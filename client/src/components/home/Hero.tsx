import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Images, FileText, Laptop, RefreshCw } from 'lucide-react';

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [, setLocation] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <section className="bg-gradient-to-b from-blue-50 to-white py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center items-center mb-4">
            <span className="bg-blue-100 text-primary rounded-full px-3 py-1 text-sm font-medium inline-flex items-center">
              <span className="text-secondary-500 mr-1">★</span>
              +3.000 Artes Exclusivas
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-800 mb-4">
            Artes profissionais para 
            <span className="text-primary block md:inline"> vendedores de automóveis</span>
          </h1>
          <p className="text-lg text-neutral-600 mb-8 max-w-3xl mx-auto">
            A maior biblioteca de recursos visuais para o setor automotivo. Baixe tudo o que precisa para suas 
            campanhas com praticidade e economia na nossa plataforma.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative mb-8">
            <div className="flex flex-col md:flex-row">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Busque por artes, modelos, campanhas..."
                  className="w-full pl-4 pr-10 py-6 rounded-lg md:rounded-r-none border border-neutral-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-400">
                  <Search className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 md:mt-0">
                <Button 
                  type="submit" 
                  className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white px-6 py-6 rounded-lg md:rounded-l-none font-medium"
                >
                  Pesquisar
                </Button>
              </div>
            </div>
          </form>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            <div className="flex items-center">
              <Images className="text-primary/70 h-5 w-5 mr-2" />
              <span className="text-neutral-700 font-medium">+3.000 Artes Editáveis</span>
            </div>
            <div className="flex items-center">
              <FileText className="text-primary/70 h-5 w-5 mr-2" />
              <span className="text-neutral-700 font-medium">Múltiplos Formatos</span>
            </div>
            <div className="flex items-center">
              <Laptop className="text-primary/70 h-5 w-5 mr-2" />
              <span className="text-neutral-700 font-medium">Edição Online</span>
            </div>
            <div className="flex items-center">
              <RefreshCw className="text-primary/70 h-5 w-5 mr-2" />
              <span className="text-neutral-700 font-medium">Atualizações Constantes</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
