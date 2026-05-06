import { useState, useRef, useCallback } from "react";
import { VoiceField } from "@/components/VoiceField";
import { NifField } from "@/components/NifField";
import { ProductSelector } from "@/components/ProductSelector";
import { EmpresaConfigSection } from "@/components/EmpresaConfig";
import { CatalogoEditor } from "@/components/CatalogoEditor";
import { Product } from "@/lib/products";
import { generarPDF } from "@/lib/generatePDF";
import { useEmpresaConfig } from "@/lib/useEmpresaConfig";
import { useCatalogo } from "@/lib/useCatalogo";
import {
  FileText, Upload, Trash2, AlertCircle, CheckCircle2, Plus, Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TipoDocumento = "presupuesto" | "factura";

interface LineaPresupuesto {
  id: string;
  producto: Product | null;
  cantidad: string;
}

function newLineaId(): string {
  return `linea-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyLinea(): LineaPresupuesto {
  return { id: newLineaId(), producto: null, cantidad: "1" };
}

function genNumeroPresupuesto(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `${year}-${seq}`;
}

function genNumeroFactura(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 900) + 100).padStart(3, "0");
  return `FAC-${year}-${seq}`;
}

function getFechaHoy(): string {
  return new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function Home() {
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(undefined);
  const [logoName, setLogoName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { empresa, setEmpresa, clearEmpresa, hasData: hasEmpresaData } = useEmpresaConfig();
  const { productos, addProducto, updateProducto, deleteProducto, resetCatalogo } = useCatalogo();

  // Document type
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>("presupuesto");
  const [numeroPresupuesto, setNumeroPresupuesto] = useState(() => genNumeroPresupuesto());
  const [numeroFactura, setNumeroFactura] = useState(() => genNumeroFactura());

  // Client fields
  const [nombreCliente, setNombreCliente] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [nif, setNif] = useState("");
  const [residencia, setResidencia] = useState("");

  // Invoice-specific fields
  const [formaPago, setFormaPago] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [estadoPago, setEstadoPago] = useState("");

  const [lineas, setLineas] = useState<LineaPresupuesto[]>([emptyLinea()]);

  const handleUpdateProducto = useCallback((id: string, changes: { nombre?: string; precio?: number }) => {
    const updated = updateProducto(id, changes);
    if (updated) {
      setLineas((prev) =>
        prev.map((l) => (l.producto?.id === id ? { ...l, producto: updated } : l))
      );
    }
  }, [updateProducto]);

  const handleDeleteProducto = useCallback((id: string) => {
    deleteProducto(id);
    setLineas((prev) =>
      prev.map((l) => (l.producto?.id === id ? { ...l, producto: null } : l))
    );
  }, [deleteProducto]);

  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoDataUrl(ev.target?.result as string);
      setLogoName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const updateLinea = useCallback((id: string, patch: Partial<LineaPresupuesto>) => {
    setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const addLinea = useCallback(() => {
    setLineas((prev) => [...prev, emptyLinea()]);
  }, []);

  const removeLinea = useCallback((id: string) => {
    setLineas((prev) => {
      if (prev.length <= 1) return [emptyLinea()];
      return prev.filter((l) => l.id !== id);
    });
  }, []);

  const lineasComputed = lineas.map((l) => {
    const precio = l.producto?.precio ?? 0;
    const cant = Math.max(1, parseInt(l.cantidad) || 1);
    return { ...l, precio, cant, importe: precio * cant };
  });

  const baseImponible = lineasComputed.reduce((acc, l) => acc + l.importe, 0);
  const iva = baseImponible * 0.21;
  const totalConIva = baseImponible + iva;
  const hayProductos = lineasComputed.some((l) => l.producto !== null);

  const handleGenerarPDF = () => {
    if (!nombreCliente.trim()) {
      showToast("error", "El nombre del cliente es obligatorio.");
      return;
    }
    const lineasValidas = lineasComputed.filter((l) => l.producto !== null);
    if (lineasValidas.length === 0) {
      const tipo = tipoDocumento === "factura" ? "factura" : "presupuesto";
      showToast("error", `Añade al menos un producto antes de generar el ${tipo}.`);
      return;
    }

    generarPDF({
      tipoDocumento,
      numeroPresupuesto,
      numeroFactura,
      fecha: getFechaHoy(),
      nombreCliente: nombreCliente.trim(),
      domicilio: domicilio.trim(),
      nif: nif.trim(),
      residencia: residencia.trim(),
      lineas: lineasValidas.map((l) => ({
        producto: l.producto!.nombre,
        cantidad: l.cant,
        precioUnitario: l.precio,
      })),
      logoDataUrl,
      empresa,
      formaPago: formaPago.trim(),
      fechaVencimiento: fechaVencimiento.trim(),
      estadoPago: estadoPago.trim(),
    });

    const label = tipoDocumento === "factura" ? "¡Factura generada y descargada!" : "¡Presupuesto generado y descargado!";
    showToast("success", label);
  };

  const handleReset = () => {
    setNombreCliente("");
    setDomicilio("");
    setNif("");
    setResidencia("");
    setFormaPago("");
    setFechaVencimiento("");
    setEstadoPago("");
    setLineas([emptyLinea()]);
    setNumeroPresupuesto(genNumeroPresupuesto());
    setNumeroFactura(genNumeroFactura());
  };

  const esFactura = tipoDocumento === "factura";
  const tituloDoc = esFactura ? "Nueva factura" : "Nuevo presupuesto";

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-72 lg:min-h-screen bg-sidebar border-r border-sidebar-border flex-shrink-0 p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">Generador de</h1>
            <h1 className="text-base font-bold text-primary leading-tight">Presupuestos o Facturas</h1>
          </div>
        </div>

        {/* Logo upload */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-foreground">Logo de empresa</label>
          {logoDataUrl ? (
            <div className="flex flex-col gap-2">
              <div className="bg-white rounded-xl border-2 border-primary/30 p-3 flex items-center justify-center min-h-[90px]">
                <img
                  src={logoDataUrl}
                  alt="Logo"
                  className="max-h-16 max-w-full object-contain"
                  data-testid="logo-preview"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  data-testid="button-change-logo"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-lg border-2 border-border text-xs font-medium text-foreground hover:border-primary/40 hover:bg-white transition-all"
                >
                  Cambiar
                </button>
                <button
                  type="button"
                  data-testid="button-remove-logo"
                  onClick={() => { setLogoDataUrl(undefined); setLogoName(null); }}
                  className="py-2 px-3 rounded-lg border-2 border-destructive/30 text-xs font-medium text-destructive hover:bg-destructive/5 transition-all"
                  title="Eliminar logo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {logoName && <p className="text-xs text-muted-foreground truncate">{logoName}</p>}
            </div>
          ) : (
            <button
              type="button"
              data-testid="button-upload-logo"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 py-5 px-4 rounded-xl border-2 border-dashed border-primary/40 bg-white hover:bg-blue-50 hover:border-primary transition-all text-center"
            >
              <Upload className="w-6 h-6 text-primary/60" />
              <span className="text-sm font-medium text-primary/70">Subir logo</span>
              <span className="text-xs text-muted-foreground">PNG, JPG o SVG</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            data-testid="input-logo-file"
            onChange={handleLogo}
          />
        </div>

        {/* Company data */}
        <div className="border-t border-sidebar-border pt-5">
          <EmpresaConfigSection
            empresa={empresa}
            hasData={hasEmpresaData}
            onSave={setEmpresa}
            onClear={clearEmpresa}
          />
        </div>

        {/* Catalog */}
        <div className="border-t border-sidebar-border pt-5">
          <CatalogoEditor
            productos={productos}
            onAdd={(nombre, precio) => addProducto(nombre, precio)}
            onUpdate={handleUpdateProducto}
            onDelete={handleDeleteProducto}
            onReset={resetCatalogo}
            onSelect={(p) => {
              setLineas((prev) => {
                const emptyIdx = prev.findIndex((l) => l.producto === null);
                if (emptyIdx >= 0) {
                  return prev.map((l, i) =>
                    i === emptyIdx ? { ...l, producto: p } : l
                  );
                }
                return [...prev, { id: newLineaId(), producto: p, cantidad: "1" }];
              });
            }}
          />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-5 lg:p-8 max-w-2xl mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">{tituloDoc}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Pulsa el icono del micrófono junto a cada campo para dictar el valor.
          </p>
        </div>

        <div className="flex flex-col gap-5">

          {/* Document type selector */}
          <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-4">
              Tipo de documento
            </h3>
            <div className="flex gap-3 mb-4">
              <button
                type="button"
                onClick={() => setTipoDocumento("presupuesto")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all",
                  !esFactura
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary bg-white"
                )}
              >
                <FileText className="w-4 h-4" />
                Presupuesto
              </button>
              <button
                type="button"
                onClick={() => setTipoDocumento("factura")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all",
                  esFactura
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary bg-white"
                )}
              >
                <Receipt className="w-4 h-4" />
                Factura
              </button>
            </div>

            {/* Editable document number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {esFactura ? "Número de factura" : "Número de presupuesto"}
              </label>
              {esFactura ? (
                <input
                  type="text"
                  value={numeroFactura}
                  onChange={(e) => setNumeroFactura(e.target.value.toUpperCase())}
                  placeholder="FAC-2026-001"
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-mono font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              ) : (
                <input
                  type="text"
                  value={numeroPresupuesto}
                  onChange={(e) => setNumeroPresupuesto(e.target.value.toUpperCase())}
                  placeholder="2026-001"
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-mono font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              )}
            </div>
          </div>

          {/* Cliente */}
          <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-4">
              Datos del cliente
            </h3>
            <div className="flex flex-col gap-4">
              <VoiceField
                label="Nombre del cliente"
                value={nombreCliente}
                onChange={setNombreCliente}
                placeholder="Ej: Juan García López"
                fieldId="nombre-cliente"
              />
              <VoiceField
                label="Domicilio"
                value={domicilio}
                onChange={setDomicilio}
                placeholder="Calle, número, piso..."
                fieldId="domicilio"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NifField value={nif} onChange={setNif} />
                <VoiceField
                  label="Localidad / Residencia"
                  value={residencia}
                  onChange={setResidencia}
                  placeholder="Ciudad, provincia..."
                  fieldId="residencia"
                />
              </div>
            </div>
          </div>

          {/* Factura-specific fields */}
          {esFactura && (
            <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-4">
                Datos de pago
              </h3>
              <div className="flex flex-col gap-4">
                <VoiceField
                  label="Forma de pago"
                  value={formaPago}
                  onChange={setFormaPago}
                  placeholder="Ej: Transferencia bancaria"
                  fieldId="forma-pago"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <VoiceField
                    label="Fecha de vencimiento"
                    value={fechaVencimiento}
                    onChange={setFechaVencimiento}
                    placeholder="Ej: 30/06/2026"
                    fieldId="fecha-vencimiento"
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Estado de pago</label>
                    <select
                      value={estadoPago}
                      onChange={(e) => setEstadoPago(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    >
                      <option value="">— Sin especificar —</option>
                      <option value="Pendiente de pago">Pendiente de pago</option>
                      <option value="Pagada">Pagada</option>
                      <option value="Pago parcial">Pago parcial</option>
                      <option value="Vencida">Vencida</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Productos */}
          <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wide">
                Productos y cantidades
              </h3>
              <span className="text-xs text-muted-foreground">
                {lineas.length} {lineas.length === 1 ? "línea" : "líneas"}
              </span>
            </div>

            <div className="flex flex-col gap-5">
              {lineas.map((linea, idx) => (
                <div
                  key={linea.id}
                  data-testid={`linea-${idx}`}
                  className={cn(
                    "flex flex-col gap-3 p-4 rounded-xl border-2 transition-all",
                    linea.producto
                      ? "border-primary/20 bg-blue-50/40"
                      : "border-border bg-white"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Producto {idx + 1}
                    </span>
                    <button
                      type="button"
                      data-testid={`button-remove-linea-${idx}`}
                      onClick={() => removeLinea(linea.id)}
                      className="p-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/5 active:scale-95 transition-all"
                      title="Eliminar este producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <ProductSelector
                    value={linea.producto?.nombre ?? ""}
                    onSelect={(p) => updateLinea(linea.id, { producto: p })}
                    onAddLine={addLinea}
                    hideLabel
                    productos={productos}
                  />

                  <VoiceField
                    label="Cantidad"
                    value={linea.cantidad}
                    onChange={(v) => updateLinea(linea.id, { cantidad: v })}
                    placeholder="1"
                    fieldId={`cantidad-${linea.id}`}
                    type="number"
                    min={1}
                  />

                  {linea.producto && (
                    <div className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-blue-200">
                      <span className="text-xs text-muted-foreground">
                        {Math.max(1, parseInt(linea.cantidad) || 1)} ud. × {linea.producto.precio} €
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {(Math.max(1, parseInt(linea.cantidad) || 1) * linea.producto.precio).toFixed(2)} €
                      </span>
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                data-testid="button-add-product"
                onClick={addLinea}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-primary/40 text-primary text-sm font-semibold hover:bg-blue-50 hover:border-primary active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                Añadir producto
              </button>
            </div>
          </div>

          {/* Totales */}
          {hayProductos && (
            <div className="bg-primary rounded-2xl p-5 text-white shadow-md">
              <p className="text-white/70 text-sm font-medium mb-3">
                Resumen del {esFactura ? "factura" : "presupuesto"}
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80">Base imponible</span>
                  <span className="font-semibold tabular-nums" data-testid="text-base-imponible">
                    {baseImponible.toFixed(2)} €
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80">IVA 21 %</span>
                  <span className="font-semibold tabular-nums" data-testid="text-iva">
                    {iva.toFixed(2)} €
                  </span>
                </div>
                <div className="h-px bg-white/20 my-1" />
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold uppercase text-xs tracking-wide">
                    Total con IVA
                  </span>
                  <span className="text-3xl font-bold tabular-nums" data-testid="text-total">
                    {totalConIva.toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              data-testid="button-generate-pdf"
              onClick={handleGenerarPDF}
              className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-primary text-white text-base font-bold shadow-md hover:bg-primary/90 active:scale-95 transition-all"
            >
              {esFactura ? <Receipt className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              Generar {esFactura ? "Factura" : "Presupuesto"}
            </button>
            <button
              type="button"
              data-testid="button-reset"
              onClick={handleReset}
              className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl border-2 border-border text-foreground text-base font-semibold hover:border-destructive/40 hover:text-destructive hover:bg-destructive/5 active:scale-95 transition-all"
            >
              <Trash2 className="w-5 h-5" />
              Limpiar
            </button>
          </div>
        </div>
      </main>

      {toast && (
        <div
          className={cn(
            "fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold text-white transition-all",
            toast.type === "success" ? "bg-green-600" : "bg-destructive"
          )}
          data-testid="toast-message"
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
