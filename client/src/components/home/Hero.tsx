import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Images, FileText, Laptop, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [, setLocation] = useLocation();
  const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(null);

  // Buscar artes destacadas para o hero
  const { data: featuredArts = [] } = useQuery<any[]>({
    queryKey: ['/api/arts/featured'],
    queryFn: async () => {
      const res = await fetch('/api/arts?limit=5&featured=true');
      if (!res.ok) return [];
      const data = await res.json();
      return data.arts || [];
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/arts?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const scrollToGallery = () => {
    const galleryElement = document.getElementById('art-gallery');
    if (galleryElement) {
      galleryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative bg-gradient-to-b from-[#e8f0fb] to-white py-10 md:py-16 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute -left-20 bottom-20 w-80 h-80 bg-secondary/5 rounded-full blur-3xl"></div>
      <div className="absolute top-40 left-1/4 w-40 h-40 bg-blue-100 rounded-full blur-2xl opacity-40"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 md:gap-12 items-center">
          {/* Left column - Text content */}
          <div className="text-center lg:text-left lg:w-1/2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex lg:justify-start justify-center items-center mb-5"
            >
              <span className="bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium inline-flex items-center border border-primary/20">
                <span className="text-blue-500 mr-1">★</span>
                +3.000 Artes Exclusivas
              </span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold text-primary/90 mb-6 leading-tight"
            >
              A MAIOR PLATAFORMA DE
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400 block"> 
                ARTES AUTOMOTIVAS
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-neutral-600 mb-10 max-w-3xl mx-auto lg:mx-0"
            >
              Tudo o que você precisa para impulsionar suas vendas com materiais 
              profissionais prontos para edição.
            </motion.p>
            
            {/* Search Bar */}
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              onSubmit={handleSearch} 
              className="max-w-2xl mx-auto lg:mx-0 relative mb-8"
            >
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
                    className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white px-8 py-7 font-medium rounded-b-xl md:rounded-bl-none md:rounded-r-xl transition-colors duration-200"
                  >
                    Pesquisar
                  </Button>
                </div>
              </div>
            </motion.form>
            
            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-4 mb-8"
            >
              <Button 
                onClick={() => setLocation('/auth')}
                className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-6 rounded-lg font-medium flex items-center shadow-md min-w-[200px]"
              >
                Começar Agora
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                onClick={scrollToGallery}
                variant="outline" 
                className="border-blue-400 text-blue-600 hover:bg-blue-50 px-6 py-6 rounded-lg font-medium flex items-center min-w-[200px]"
              >
                Ver Designs
                <ChevronDown className="ml-2 h-4 w-4 animate-bounce" />
              </Button>
            </motion.div>
            
            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="grid grid-cols-2 gap-3 md:gap-4 rounded-xl bg-white shadow-md p-4 max-w-md mx-auto lg:mx-0"
            >
              <div className="flex items-center p-2">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <Images className="text-blue-600 h-5 w-5" />
                </div>
                <span className="text-neutral-700 font-medium text-sm">+3.000 Artes</span>
              </div>
              <div className="flex items-center p-2">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <FileText className="text-blue-600 h-5 w-5" />
                </div>
                <span className="text-neutral-700 font-medium text-sm">Múltiplos Formatos</span>
              </div>
              <div className="flex items-center p-2">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <Laptop className="text-blue-600 h-5 w-5" />
                </div>
                <span className="text-neutral-700 font-medium text-sm">Edição Online</span>
              </div>
              <div className="flex items-center p-2">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <RefreshCw className="text-blue-600 h-5 w-5" />
                </div>
                <span className="text-neutral-700 font-medium text-sm">Atualizações Semanais</span>
              </div>
            </motion.div>
          </div>
          
          {/* Right column - Featured images */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="lg:w-1/2 w-full"
          >
            <div className="relative h-[450px] md:h-[500px]">
              {/* Imagens em destaque - Layout dinâmico */}
              {featuredArts.slice(0, 5).map((art, index) => (
                <motion.div
                  key={art.id}
                  className="absolute rounded-xl overflow-hidden shadow-lg transition-all duration-300"
                  initial={{ 
                    scale: 0.9,
                    zIndex: 5 - index 
                  }}
                  animate={{ 
                    top: getImagePosition(index, 5).top, 
                    left: getImagePosition(index, 5).left,
                    rotate: getImagePosition(index, 5).rotate,
                    scale: hoveredImageIndex === index ? 1.05 : 1,
                    zIndex: hoveredImageIndex === index ? 10 : 5 - index
                  }}
                  transition={{ duration: 0.3 }}
                  style={{ 
                    width: getImagePosition(index, 5).width,
                    height: getImagePosition(index, 5).height,
                  }}
                  onMouseEnter={() => setHoveredImageIndex(index)}
                  onMouseLeave={() => setHoveredImageIndex(null)}
                  onClick={() => setLocation(`/arts/${art.id}`)}
                  whileHover={{ scale: 1.05 }}
                >
                  <img 
                    src={art.imageUrl} 
                    alt={art.title} 
                    className="w-full h-full object-cover object-center"
                  />
                  {hoveredImageIndex === index && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                      <div className="text-white">
                        <h3 className="font-medium text-sm">{art.title}</h3>
                        <p className="text-xs opacity-80">{art.format}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
              
              {/* Placeholder quando não tiver imagens carregadas */}
              {featuredArts.length === 0 && (
                <div className="grid grid-cols-2 gap-4 h-full">
                  {[...Array(4)].map((_, index) => (
                    <div 
                      key={index} 
                      className="animate-pulse bg-neutral-200 rounded-xl"
                      style={{
                        height: index % 2 === 0 ? '100%' : '48%'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.5, 
          delay: 0.8,
          repeat: Infinity,
          repeatType: "reverse",
          repeatDelay: 0.5
        }}
        className="flex justify-center mt-4"
      >
        <ChevronDown className="h-6 w-6 text-blue-500" />
      </motion.div>
    </section>
  );
};

// Helper para posicionar as imagens de forma dinâmica
function getImagePosition(index: number, total: number) {
  // Diferentes posições com base no índice
  switch (index) {
    case 0: // Imagem principal (maior)
      return { 
        top: '10%', 
        left: '10%', 
        width: '60%', 
        height: '75%', 
        rotate: '-2deg' 
      };
    case 1: // Direita superior
      return { 
        top: '5%', 
        left: '65%', 
        width: '40%', 
        height: '40%', 
        rotate: '3deg' 
      };
    case 2: // Direita inferior
      return { 
        top: '50%', 
        left: '70%', 
        width: '35%', 
        height: '45%', 
        rotate: '-5deg' 
      };
    case 3: // Esquerda inferior
      return { 
        top: '60%', 
        left: '-5%', 
        width: '30%', 
        height: '35%', 
        rotate: '6deg' 
      };
    case 4: // Centro inferior
      return { 
        top: '80%', 
        left: '30%', 
        width: '40%', 
        height: '30%', 
        rotate: '-3deg' 
      };
    default:
      return { 
        top: '0%', 
        left: '0%', 
        width: '0%', 
        height: '0%', 
        rotate: '0deg' 
      };
  }
}

export default Hero;
