import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "designauto-theme",
  ...props
}: ThemeProviderProps) {
  // Força sempre o tema light
  const [theme] = useState<Theme>("light");

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove qualquer classe de tema escuro e força light
    root.classList.remove("dark", "system");
    root.classList.add("light");
    
    // Limpa todas as possíveis chaves de tema no localStorage
    localStorage.removeItem(storageKey);
    localStorage.removeItem("designauto-theme");
    localStorage.removeItem("theme");
    localStorage.removeItem("ui-theme");
    
    // Força atualização de propriedades CSS
    root.style.colorScheme = "light";
    document.body.style.backgroundColor = "white";
    document.body.style.color = "rgb(17, 24, 39)";
  }, [storageKey]);

  const value = {
    theme: "light" as Theme,
    setTheme: () => {
      // Não permite mudança de tema - sempre light
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};