import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Images, FileText, Laptop, RefreshCw, ChevronRight } from 'lucide-react';

// Constantes para eventos personalizados
export const SHOW_SEARCHBAR_EVENT = 'searchbar:showInHeader';
export const HIDE_SEARCHBAR_EVENT = 'searchbar:hideInHeader';

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [, setLocation] = useLocation();
  const searchFormRef = useRef<HTMLFormElement>(null);

  // Configurar o Intersection Observer para detectar quando a barra de pesquisa sai da área visível
  useEffect(() => {
    if (!searchFormRef.current) return;

    const options = {
      root: null, // viewport como referência
      rootMargin: '0px',
      threshold: 0.1 // quando 10% do elemento estiver visível
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Quando o formulário de pesquisa sair da área visível
        if (!entry.isIntersecting) {
          // Exibir a barra de pesquisa no cabeçalho quando a barra do hero não estiver visível
          document.dispatchEvent(new CustomEvent(SHOW_SEARCHBAR_EVENT));
        } else {
          // Esconder a barra de pesquisa do cabeçalho quando a barra do hero estiver visível
          document.dispatchEvent(new CustomEvent(HIDE_SEARCHBAR_EVENT));
        }
      });
    }, options);

    observer.observe(searchFormRef.current);

    return () => {
      if (searchFormRef.current) {
        observer.unobserve(searchFormRef.current);
      }
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirecionar para a página de artes com o parâmetro de pesquisa
      setLocation(`/arts?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <section className="relative bg-gradient-to-b from-[#e8f0fb] to-white py-6 sm:py-8 md:py-14 pb-4 md:pb-6 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute -left-20 bottom-20 w-80 h-80 bg-secondary/5 rounded-full blur-3xl"></div>
      <div className="absolute top-40 left-1/4 w-40 h-40 bg-blue-100 rounded-full blur-2xl opacity-40"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center items-center mb-4">
            <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-[10px] sm:text-xs font-medium inline-flex items-center border border-primary/20 shadow-sm">
              <span className="text-blue-500 mr-1">★</span>
              +3.000 Artes Exclusivas
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-primary/90 mb-4 leading-tight px-2">
            A MAIOR PLATAFORMA DE
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400 block"> 
              ARTES AUTOMOTIVAS
            </span>
          </h1>
          <div className="mb-6 max-w-2xl mx-auto px-4">
            <p className="text-xs sm:text-sm md:text-base text-neutral-600 leading-relaxed bg-blue-50/50 py-2 px-3 rounded-lg inline-block shadow-sm">
              <span className="font-medium text-blue-600">Tudo o que você precisa</span> para impulsionar suas vendas com materiais profissionais prontos para edição.
            </p>
          </div>
          
          {/* Search Bar */}
          <form 
            ref={searchFormRef}
            onSubmit={handleSearch} 
            className="max-w-2xl mx-auto relative mb-8 sm:mb-10 px-3"
            id="hero-search-bar"
          >
            <div className="relative shadow-lg rounded-xl overflow-hidden">
              <Input
                type="text"
                placeholder="Busque por artes, modelos, campanhas..."
                className="w-full pl-3 sm:pl-5 pr-12 py-5 sm:py-7 rounded-xl border-0 focus-visible:ring-1 focus-visible:ring-secondary/50 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="hero-search-input"
              />
              <button 
                type="submit" 
                className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-blue-500 hover:text-blue-600 transition-colors"
              >
                <Search className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </form>
          
          {/* CTA Buttons */}
          <div className="flex flex-row items-center justify-center gap-3 sm:gap-4 mb-6 px-3">
            <Button 
              className="bg-blue-600 text-white hover:bg-blue-700 px-3 sm:px-5 py-3 sm:py-5 rounded-lg font-medium flex items-center shadow-md flex-1 sm:flex-initial sm:min-w-[180px] text-sm sm:text-base justify-center"
              onClick={() => setLocation('/register')}
            >
              Cadastre-se
              <ChevronRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="border-blue-400 text-blue-600 hover:bg-blue-50 px-3 sm:px-5 py-3 sm:py-5 rounded-lg font-medium flex items-center flex-1 sm:flex-initial sm:min-w-[180px] text-sm sm:text-base justify-center"
              onClick={() => setLocation('/demo')}
            >
              Ver Demonstração
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;