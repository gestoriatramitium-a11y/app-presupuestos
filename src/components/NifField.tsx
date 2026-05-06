import { useState } from "react";
import { VoiceButton } from "./VoiceButton";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { normalizarNIF, validarNIF } from "@/lib/nifUtils";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface NifFieldProps {
  value: string;
  onChange: (val: string) => void;
}

export function NifField({ value, onChange }: NifFieldProps) {
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const validationError = value ? validarNIF(value) : null;

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    lang: "es-ES",
    onResult: (transcript) => {
      const normalized = normalizarNIF(transcript);
      onChange(normalized);
      const err = validarNIF(normalized);
      if (err) {
        setVoiceError(`Reconocido: "${normalized}" — ${err}`);
        setTimeout(() => setVoiceError(null), 5000);
      }
    },
    onError: (err) => {
      setVoiceError(err);
      setTimeout(() => setVoiceError(null), 4000);
    },
  });

  const isValid = value && !validarNIF(value);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="nif" className="text-sm font-semibold text-foreground">
        NIF / CIF
      </label>
      <div className="flex items-center gap-2">
        <input
          id="nif"
          data-testid="input-nif"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase().replace(/\s+/g, ""))}
          placeholder="12345678A"
          maxLength={12}
          autoCapitalize="characters"
          className={cn(
            "flex-1 px-4 py-3 rounded-xl border-2 text-base bg-white transition-all duration-150",
            "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
            isListening
              ? "border-red-400 ring-2 ring-red-200"
              : validationError && value
              ? "border-amber-400 ring-2 ring-amber-100"
              : isValid
              ? "border-green-400"
              : "border-border hover:border-primary/40"
          )}
        />
        <VoiceButton
          isListening={isListening}
          onStart={startListening}
          onStop={stopListening}
          data-testid="voice-nif"
        />
      </div>
      {voiceError && (
        <p className="text-xs text-amber-600 mt-1">{voiceError}</p>
      )}
      {!voiceError && validationError && value && (
        <p className="text-xs text-amber-600 mt-1">{validationError}</p>
      )}
      {isValid && (
        <p className="flex items-center gap-1 text-xs text-green-600 mt-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> NIF/CIF válido
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Puedes dictar letra a letra: "doce tres cuatro cinco seis siete ocho a"
      </p>
    </div>
  );
}
