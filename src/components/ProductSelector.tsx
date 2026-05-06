import { useState, useRef, useEffect } from "react";
import { Product } from "@/lib/products";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { VoiceButton } from "./VoiceButton";
import { ChevronDown, CheckCircle2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

function isAddProductCommand(transcript: string): boolean {
  const t = transcript.toLowerCase().trim();
  return /\b(a[ñn]ad[ie]|incluir?|incluye|nuevo|nueva|agregar?|agrega|otro|otra)\b[\s\w]*\bproducto/.test(t)
    || /^(a[ñn]adir|incluir|nuevo|agregar)$/.test(t);
}

function buscarProductoRobusto(texto: string, productos: Product[]): Product | null {
  if (!texto) return null;
  const t = texto.toLowerCase().trim();

  const exacto = productos.find((p) => p.nombre.toLowerCase() === t);
  if (exacto) return exacto;

  const porId = productos.find((p) => p.id.toLowerCase() === t);
  if (porId) return porId;

  const contiene = productos.find((p) => p.nombre.toLowerCase().includes(t));
  if (contiene) return contiene;

  const palabras = t.split(/\s+/);
  const parcial = productos.find((p) =>
    palabras.some((pal) => pal.length >= 3 && p.nombre.toLowerCase().includes(pal))
  );
  if (parcial) return parcial;

  return null;
}

interface ProductSelectorProps {
  value: string;
  onSelect: (product: Product | null) => void;
  onAddLine?: () => void;
  hideLabel?: boolean;
  productos: Product[];
}

export function ProductSelector({ value, onSelect, onAddLine, hideLabel, productos }: ProductSelectorProps) {
  const [open, setOpen] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click/touch
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    lang: "es-ES",
    onResult: (transcript) => {
      // Voice command: add new product line
      if (onAddLine && isAddProductCommand(transcript)) {
        onAddLine();
        setVoiceError(null);
        return;
      }
      const found = buscarProductoRobusto(transcript, productos);
      if (found) {
        onSelect(found);
        setVoiceError(null);
      } else {
        setVoiceError(`No se encontró "${transcript}" en el catálogo`);
        setTimeout(() => setVoiceError(null), 4000);
      }
    },
    onError: (err) => {
      setVoiceError(err);
      setTimeout(() => setVoiceError(null), 4000);
    },
  });

  const selected = productos.find((p) => p.nombre === value) ?? null;

  const handleItemSelect = (p: Product) => {
    onSelect(p);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {!hideLabel && (
        <label className="text-sm font-semibold text-foreground">
          Producto contratado
        </label>
      )}
      <div className="flex items-center gap-2">
        <div ref={containerRef} className="relative flex-1">
          <button
            type="button"
            data-testid="select-producto"
            onPointerDown={(e) => {
              // Prevent focus loss when toggling
              e.preventDefault();
              setOpen((prev) => !prev);
            }}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-base bg-white transition-all duration-150",
              "focus:outline-none hover:border-primary/40",
              isListening
                ? "border-red-400 ring-2 ring-red-200"
                : open
                ? "border-primary ring-2 ring-primary/20"
                : "border-border"
            )}
          >
            <span className={cn(!selected && "text-muted-foreground")}>
              {selected ? selected.nombre : "Selecciona o dicta un producto"}
            </span>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-muted-foreground transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </button>

          {open && (
            <div className="absolute z-50 w-full mt-1 bg-white border-2 border-primary/30 rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
              {productos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  data-testid={`product-option-${p.id}`}
                  // Use onPointerDown to fire before any blur-closing logic
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleItemSelect(p);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors border-b border-border/50 last:border-0",
                    selected?.id === p.id
                      ? "bg-blue-50"
                      : "hover:bg-blue-50 active:bg-blue-100"
                  )}
                >
                  <div>
                    <div className="font-semibold text-foreground">{p.nombre}</div>
                    {p.descripcion && (
                      <div className="text-xs text-muted-foreground">{p.descripcion}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <span className="font-bold text-primary">{p.precio} €</span>
                    {selected?.id === p.id && (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <VoiceButton
          isListening={isListening}
          onStart={startListening}
          onStop={stopListening}
          data-testid="voice-producto"
        />
        {onAddLine && (
          <button
            type="button"
            onClick={onAddLine}
            data-testid="button-add-product-line"
            title='Añadir otro producto (también puedes decir "añadir producto")'
            className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-primary/30 text-primary bg-white hover:bg-blue-50 hover:border-primary active:scale-95 transition-all flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
      {voiceError && (
        <p className="text-xs text-destructive mt-1">{voiceError}</p>
      )}
      {selected && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200 mt-1">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">
            {selected.nombre} · {selected.precio} € / ud.
          </span>
        </div>
      )}
    </div>
  );
}
