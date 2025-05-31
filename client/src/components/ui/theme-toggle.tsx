import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      title={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'} (Ctrl+Shift+T)`}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
}

// Versão mais elaborada do toggle com indicador visual
export function ThemeToggleAdvanced() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={toggleTheme}
        className="relative h-8 w-16 px-0 transition-all duration-300"
        title={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
      >
        <div className="flex h-full w-full items-center justify-between px-2">
          <Sun className="h-3 w-3 text-yellow-500" />
          <Moon className="h-3 w-3 text-blue-400" />
        </div>
        <div
          className={`absolute top-0.5 h-7 w-7 rounded-sm bg-background shadow-md transition-all duration-300 ${
            theme === 'light' ? 'left-0.5' : 'left-8'
          }`}
        >
          <div className="flex h-full w-full items-center justify-center">
            {theme === 'light' ? (
              <Sun className="h-3 w-3 text-yellow-600" />
            ) : (
              <Moon className="h-3 w-3 text-blue-400" />
            )}
          </div>
        </div>
      </Button>
    </div>
  );
}

// Toggle com texto
export function ThemeToggleWithText() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      onClick={toggleTheme}
      className="flex items-center space-x-2 transition-all duration-300"
      title={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
    >
      {theme === 'light' ? (
        <>
          <Sun className="h-4 w-4" />
          <span className="text-sm">Claro</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" />
          <span className="text-sm">Escuro</span>
        </>
      )}
    </Button>
  );
}