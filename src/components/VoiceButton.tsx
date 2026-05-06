import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  className?: string;
  "data-testid"?: string;
}

export function VoiceButton({
  isListening,
  onStart,
  onStop,
  className,
  "data-testid": testId,
}: VoiceButtonProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={isListening ? onStop : onStart}
      className={cn(
        "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 flex-shrink-0",
        isListening
          ? "bg-red-500 border-red-600 text-white animate-pulse shadow-lg shadow-red-200"
          : "bg-white border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400 active:scale-95",
        className
      )}
      aria-label={isListening ? "Detener escucha" : "Activar micrófono"}
    >
      {isListening ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  );
}
