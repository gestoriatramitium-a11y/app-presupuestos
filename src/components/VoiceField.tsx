import { useState } from "react";
import { VoiceButton } from "./VoiceButton";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { cn } from "@/lib/utils";

interface VoiceFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  fieldId: string;
  type?: "text" | "number";
  min?: number;
}

export function VoiceField({
  label,
  value,
  onChange,
  placeholder,
  fieldId,
  type = "text",
  min,
}: VoiceFieldProps) {
  const [error, setError] = useState<string | null>(null);

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    lang: "es-ES",
    onResult: (transcript) => {
      if (type === "number") {
        const parsed = parseFloat(transcript.replace(",", "."));
        if (!isNaN(parsed)) {
          onChange(String(parsed));
        } else {
          setError("No se reconoció un número válido");
          setTimeout(() => setError(null), 3000);
        }
      } else {
        onChange(transcript.toUpperCase());
      }
    },
    onError: (err) => {
      setError(err);
      setTimeout(() => setError(null), 4000);
    },
  });

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={fieldId}
        className="text-sm font-semibold text-foreground"
      >
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={fieldId}
          data-testid={`input-${fieldId}`}
          type={type}
          min={min}
          value={value}
          onChange={(e) =>
            onChange(type === "text" ? e.target.value.toUpperCase() : e.target.value)
          }
          placeholder={placeholder}
          className={cn(
            "flex-1 px-4 py-3 rounded-xl border-2 text-base bg-white transition-all duration-150",
            "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
            isListening
              ? "border-red-400 ring-2 ring-red-200"
              : "border-border hover:border-primary/40"
          )}
        />
        <VoiceButton
          isListening={isListening}
          onStart={startListening}
          onStop={stopListening}
          data-testid={`voice-${fieldId}`}
        />
      </div>
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}
