// Re-export do provider para facilitar uso
export { useTheme, ThemeProvider } from '@/components/providers/theme-provider';

export class DesignAutoThemeController {
  private storageKey = 'designauto-theme';
  private defaultTheme: Theme = 'light';
  private enableSystemDetection = true;
  private systemMediaQuery: MediaQueryList | null = null;
  private callbacks: {
    onThemeChange?: (theme: Theme) => void;
    onInit?: (theme: Theme) => void;
  } = {};

  constructor(options: {
    defaultTheme?: Theme;
    enableSystemDetection?: boolean;
    onThemeChange?: (theme: Theme) => void;
    onInit?: (theme: Theme) => void;
  } = {}) {
    this.defaultTheme = options.defaultTheme || 'light';
    this.enableSystemDetection = options.enableSystemDetection !== false;
    this.callbacks = {
      onThemeChange: options.onThemeChange,
      onInit: options.onInit
    };
  }

  init(): Theme {
    try {
      const savedTheme = this.getSavedTheme();
      const systemTheme = this.getSystemTheme();
      
      const currentTheme = savedTheme || (this.enableSystemDetection ? systemTheme : null) || this.defaultTheme;
      
      this.applyTheme(currentTheme, false);
      
      if (this.enableSystemDetection) {
        this.setupSystemListener();
      }
      
      this.setupKeyboardShortcut();
      
      if (this.callbacks.onInit) {
        this.callbacks.onInit(currentTheme);
      }
      
      console.log(`🎨 DesignAuto Theme Controller iniciado: ${currentTheme}`);
      
      return currentTheme;
    } catch (error) {
      console.error('Erro ao inicializar tema:', error);
      this.applyTheme(this.defaultTheme, false);
      return this.defaultTheme;
    }
  }

  applyTheme(theme: Theme, save = true): void {
    try {
      const root = document.documentElement;
      
      // Remover classes de tema existentes
      root.removeAttribute('data-theme');
      
      // Aplicar novo tema
      if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
      }
      
      // Salvar preferência
      if (save) {
        this.saveTheme(theme);
      }
      
      // Callback
      if (this.callbacks.onThemeChange) {
        this.callbacks.onThemeChange(theme);
      }
      
      console.log(`🎨 Tema aplicado: ${theme}`);
    } catch (error) {
      console.error('Erro ao aplicar tema:', error);
    }
  }

  toggleTheme(): Theme {
    const currentTheme = this.getCurrentTheme();
    const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
    return newTheme;
  }

  getCurrentTheme(): Theme {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  private getSavedTheme(): Theme | null {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved === 'dark' || saved === 'light' ? saved : null;
    } catch {
      return null;
    }
  }

  private saveTheme(theme: Theme): void {
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch (error) {
      console.warn('Não foi possível salvar preferência de tema:', error);
    }
  }

  private getSystemTheme(): Theme {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return this.defaultTheme;
    }
  }

  private setupSystemListener(): void {
    try {
      this.systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemChange = (e: MediaQueryListEvent) => {
        // Só aplicar mudança do sistema se não houver preferência salva
        if (!this.getSavedTheme()) {
          const newTheme: Theme = e.matches ? 'dark' : 'light';
          this.applyTheme(newTheme, false);
        }
      };

      if (this.systemMediaQuery.addEventListener) {
        this.systemMediaQuery.addEventListener('change', handleSystemChange);
      } else {
        // Fallback para navegadores mais antigos
        this.systemMediaQuery.addListener(handleSystemChange);
      }
    } catch (error) {
      console.warn('Não foi possível configurar listener do sistema:', error);
    }
  }

  private setupKeyboardShortcut(): void {
    try {
      const handleKeyboard = (e: KeyboardEvent) => {
        // Ctrl/Cmd + Shift + T para alternar tema
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
          e.preventDefault();
          this.toggleTheme();
        }
      };

      document.addEventListener('keydown', handleKeyboard);
    } catch (error) {
      console.warn('Não foi possível configurar atalho de teclado:', error);
    }
  }
}

// Hook personalizado para usar o controlador de tema
export function useThemeController() {
  const [theme, setThemeState] = useState<Theme>('light');
  const [controller] = useState(() => new DesignAutoThemeController({
    onThemeChange: (newTheme) => setThemeState(newTheme)
  }));

  useEffect(() => {
    const initialTheme = controller.init();
    setThemeState(initialTheme);
  }, [controller]);

  const setTheme = (newTheme: Theme) => {
    controller.applyTheme(newTheme);
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = controller.toggleTheme();
    setThemeState(newTheme);
  };

  return {
    theme,
    setTheme,
    toggleTheme,
    controller
  };
}