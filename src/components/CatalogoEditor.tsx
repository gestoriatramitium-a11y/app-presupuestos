import { useState } from "react";
import { Product } from "@/lib/products";
import { Package, Trash2, Pencil, Save, Plus, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface CatalogoEditorProps {
  productos: Product[];
  onAdd: (nombre: string, precio: number) => void;
  onUpdate: (id: string, changes: { nombre?: string; precio?: number }) => void;
  onDelete: (id: string) => void;
  onReset: () => void;
  onSelect: (producto: Product) => void;
}

interface EditState {
  id: string;
  nombre: string;
  precio: string;
}

export function CatalogoEditor({
  productos,
  onAdd,
  onUpdate,
  onDelete,
  onReset,
  onSelect,
}: CatalogoEditorProps) {
  const [editState, setEditState] = useState<EditState | null>(null);
  const [newNombre, setNewNombre] = useState("");
  const [newPrecio, setNewPrecio] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const startEdit = (p: Product) => {
    setEditState({ id: p.id, nombre: p.nombre, precio: String(p.precio) });
  };

  const cancelEdit = () => setEditState(null);

  const saveEdit = () => {
    if (!editState) return;
    const precio = parseFloat(editState.precio.replace(",", "."));
    if (!editState.nombre.trim() || isNaN(precio) || precio < 0) return;
    onUpdate(editState.id, { nombre: editState.nombre.trim(), precio });
    setEditState(null);
  };

  const handleAdd = () => {
    const precio = parseFloat(newPrecio.replace(",", "."));
    if (!newNombre.trim() || isNaN(precio) || precio < 0) return;
    onAdd(newNombre.trim(), precio);
    setNewNombre("");
    setNewPrecio("");
    setShowAddForm(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Catálogo de productos</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          title="Restaurar catálogo original"
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-white transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground -mt-1">
        Toca un producto para añadirlo. Usa el lápiz para editarlo.
      </p>

      <div className="flex flex-col gap-1">
        {productos.map((p) =>
          editState?.id === p.id ? (
            // ── Edit mode ──────────────────────────────
            <div
              key={p.id}
              className="flex flex-col gap-1.5 p-2 rounded-lg border-2 border-primary/40 bg-white"
            >
              <input
                type="text"
                value={editState.nombre}
                onChange={(e) =>
                  setEditState((s) => s && { ...s, nombre: e.target.value.toUpperCase() })
                }
                placeholder="Nombre del producto"
                className="w-full px-2 py-1.5 rounded border border-border text-xs focus:outline-none focus:border-primary"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
              />
              <div className="flex gap-1.5 items-center">
                <input
                  type="number"
                  value={editState.precio}
                  onChange={(e) => setEditState((s) => s && { ...s, precio: e.target.value })}
                  placeholder="Precio €"
                  min={0}
                  step={0.01}
                  className="flex-1 px-2 py-1.5 rounded border border-border text-xs focus:outline-none focus:border-primary"
                  onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                />
                <button
                  type="button"
                  onClick={saveEdit}
                  className="p-1.5 rounded bg-primary text-white hover:bg-primary/90 transition-all"
                  title="Guardar"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-all"
                  title="Cancelar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            // ── Display mode ───────────────────────────
            <div
              key={p.id}
              className="group flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border bg-white text-xs transition-all hover:border-primary/40 hover:bg-blue-50"
              data-testid={`catalog-item-${p.id}`}
            >
              <button
                type="button"
                className="flex-1 flex items-center justify-between text-left gap-1 min-w-0"
                onPointerDown={(e) => {
                  e.preventDefault();
                  onSelect(p);
                }}
              >
                <span className="font-medium truncate">{p.nombre}</span>
                <span className="font-bold text-primary flex-shrink-0">{p.precio} €</span>
              </button>
              <div className={cn("flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity")}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); startEdit(p); }}
                  className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-blue-100 transition-all"
                  title="Editar producto"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                  className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Add product form */}
      {showAddForm ? (
        <div className="flex flex-col gap-1.5 p-2 rounded-lg border-2 border-dashed border-primary/40 bg-white">
          <input
            type="text"
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value.toUpperCase())}
            placeholder="Nombre del producto/servicio"
            className="w-full px-2 py-1.5 rounded border border-border text-xs focus:outline-none focus:border-primary"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setShowAddForm(false); }}
          />
          <div className="flex gap-1.5">
            <input
              type="number"
              value={newPrecio}
              onChange={(e) => setNewPrecio(e.target.value)}
              placeholder="Precio €"
              min={0}
              step={0.01}
              className="flex-1 px-2 py-1.5 rounded border border-border text-xs focus:outline-none focus:border-primary"
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setShowAddForm(false); }}
            />
            <button
              type="button"
              onClick={handleAdd}
              className="px-3 py-1.5 rounded bg-primary text-white text-xs font-semibold hover:bg-primary/90 active:scale-95 transition-all"
            >
              Añadir
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setNewNombre(""); setNewPrecio(""); }}
              className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          data-testid="button-add-catalog-product"
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 border-dashed border-primary/30 text-primary text-xs font-semibold hover:bg-blue-50 hover:border-primary/50 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo producto/servicio
        </button>
      )}
    </div>
  );
}
