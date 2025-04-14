import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Images, FileText, Laptop, RefreshCw, ChevronRight } from 'lucide-react';

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
    <section className="relative bg-gradient-to-b from-[#e8f0fb] to-white py-16 md:py-24 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute -left-20 bottom-20 w-80 h-80 bg-secondary/5 rounded-full blur-3xl"></div>
      <div className="absolute top-40 left-1/4 w-40 h-40 bg-blue-100 rounded-full blur-2xl opacity-40"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center items-center mb-5">
            <span className="bg-secondary/10 text-secondary-foreground rounded-full px-4 py-1.5 text-sm font-medium inline-flex items-center border border-secondary/20">
              <span className="text-secondary mr-1">★</span>
              +3.000 Artes Exclusivas
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6 leading-tight">
            A MAIOR PLATAFORMA DE
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-secondary to-secondary/80 block"> 
              ARTES AUTOMOTIVAS
            </span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 mb-10 max-w-3xl mx-auto">
            Tudo o que você precisa para impulsionar suas vendas com materiais 
            profissionais prontos para edição.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative mb-10">
            <div className="flex flex-col md:flex-row shadow-lg rounded-xl overflow-hidden">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Busque por artes, modelos, campanhas..."
                  className="w-full pl-5 pr-10 py-7 rounded-t-xl md:rounded-tr-none md:rounded-l-xl border-0 focus-visible:ring-1 focus-visible:ring-secondary/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-400">
                  <Search className="h-5 w-5" />
                </div>
              </div>
              <div>
                <Button 
                  type="submit" 
                  className="w-full md:w-auto bg-secondary hover:bg-secondary/90 text-white px-8 py-7 font-medium rounded-b-xl md:rounded-bl-none md:rounded-r-xl transition-colors duration-200"
                >
                  Pesquisar
                </Button>
              </div>
            </div>
          </form>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Button className="bg-secondary text-white hover:bg-secondary/90 px-6 py-6 rounded-lg font-medium flex items-center shadow-md min-w-[200px]">
              Começar Agora
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/5 px-6 py-6 rounded-lg font-medium flex items-center min-w-[200px]">
              Ver Demonstração
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 rounded-xl bg-white shadow-md p-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center p-3">
              <div className="bg-primary/10 p-2 rounded-full mb-3">
                <Images className="text-primary h-6 w-6" />
              </div>
              <span className="text-neutral-700 font-medium text-sm">+3.000 Artes Editáveis</span>
            </div>
            <div className="flex flex-col items-center text-center p-3">
              <div className="bg-primary/10 p-2 rounded-full mb-3">
                <FileText className="text-primary h-6 w-6" />
              </div>
              <span className="text-neutral-700 font-medium text-sm">Múltiplos Formatos</span>
            </div>
            <div className="flex flex-col items-center text-center p-3">
              <div className="bg-primary/10 p-2 rounded-full mb-3">
                <Laptop className="text-primary h-6 w-6" />
              </div>
              <span className="text-neutral-700 font-medium text-sm">Edição Online</span>
            </div>
            <div className="flex flex-col items-center text-center p-3">
              <div className="bg-primary/10 p-2 rounded-full mb-3">
                <RefreshCw className="text-primary h-6 w-6" />
              </div>
              <span className="text-neutral-700 font-medium text-sm">Atualizações Constantes</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
