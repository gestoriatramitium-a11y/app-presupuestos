import { useState } from "react";
import { EmpresaConfig } from "@/lib/useEmpresaConfig";
import { Trash2, Pencil, Save, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmpresaConfigProps {
  empresa: EmpresaConfig;
  hasData: boolean;
  onSave: (config: EmpresaConfig) => void;
  onClear: () => void;
}

export function EmpresaConfigSection({
  empresa,
  hasData,
  onSave,
  onClear,
}: EmpresaConfigProps) {
  const [editing, setEditing] = useState(!hasData);
  const [draft, setDraft] = useState<EmpresaConfig>(empresa);

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  const handleEdit = () => {
    setDraft(empresa);
    setEditing(true);
  };

  const handleClear = () => {
    onClear();
    setDraft({ nombre: "", domicilio: "", localidad: "", telefono: "" });
    setEditing(true);
  };

  const field = (
    label: string,
    key: keyof EmpresaConfig,
    placeholder: string,
    type = "text"
  ) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={draft[key]}
        onChange={(e) =>
          setDraft((d) => ({
            ...d,
            [key]: type === "tel" ? e.target.value : e.target.value.toUpperCase(),
          }))
        }
        placeholder={placeholder}
        data-testid={`input-empresa-${key}`}
        className="w-full px-3 py-2 rounded-lg border-2 border-border bg-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Datos de empresa</span>
        </div>
        {hasData && !editing && (
          <div className="flex gap-1">
            <button
              type="button"
              data-testid="button-edit-empresa"
              onClick={handleEdit}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-white transition-all"
              title="Editar datos de empresa"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-testid="button-clear-empresa"
              onClick={handleClear}
              className="p-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/5 transition-all"
              title="Borrar datos de empresa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2.5">
          {field("Nombre de la empresa", "nombre", "Mi Empresa S.L.")}
          {field("CIF / NIF", "cif", "B12345678")}
          {field("Domicilio", "domicilio", "Calle Mayor, 1")}
          {field("Localidad y provincia", "localidad", "Madrid, Madrid")}
          {field("Teléfono", "telefono", "600 000 000", "tel")}
          <button
            type="button"
            data-testid="button-save-empresa"
            onClick={handleSave}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            Guardar datos
          </button>
          {hasData && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs text-muted-foreground hover:text-foreground text-center transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border p-3 flex flex-col gap-1.5">
          {empresa.nombre && (
            <p className="text-sm font-bold text-foreground truncate">{empresa.nombre}</p>
          )}
          {empresa.cif && (
            <p className="text-xs text-muted-foreground truncate">CIF/NIF: {empresa.cif}</p>
          )}
          {empresa.domicilio && (
            <p className="text-xs text-muted-foreground truncate">{empresa.domicilio}</p>
          )}
          {empresa.localidad && (
            <p className="text-xs text-muted-foreground truncate">{empresa.localidad}</p>
          )}
          {empresa.telefono && (
            <p className={cn("text-xs font-medium truncate", "text-primary")}>
              {empresa.telefono}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
