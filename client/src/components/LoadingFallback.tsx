import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface LoadingFallbackProps {
  message?: string;
  timeout?: number;
}

export function LoadingFallback({ message = "Carregando...", timeout = 10000 }: LoadingFallbackProps) {
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout]);

  if (showTimeout) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <div>
            <p className="text-sm text-gray-600">{message}</p>
            <p className="text-xs text-gray-500 mt-2">
              Isso está demorando mais que o esperado. Verifique sua conexão.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingFallback message="Carregando página..." />
    </div>
  );
}