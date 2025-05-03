import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import useScrollTop from '@/hooks/useScrollTop';
import Hero from '@/components/home/Hero';
import RecentDesigns from '@/components/home/RecentDesigns';
import FeaturedCategories from '@/components/home/FeaturedCategories';
import ArtGallery from '@/components/home/ArtGallery';
import PremiumFeatures from '@/components/home/PremiumFeatures';
import Testimonials from '@/components/home/Testimonials';
import CallToAction from '@/components/home/CallToAction';
import FeatureStats from '@/components/home/FeatureStats';

const Home = () => {
  // Garantir rolagem para o topo ao navegar para esta página
  useScrollTop();
  
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<number | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<number | null>(null);
  const [location] = useLocation();

  // Processar parâmetros da URL para aplicar filtros
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('category');
    
    if (categoryParam) {
      const categoryId = parseInt(categoryParam);
      if (!isNaN(categoryId)) {
        setSelectedCategory(categoryId);
        
        // Rolagem suave até a galeria quando uma categoria é selecionada
        setTimeout(() => {
          const galleryElement = document.getElementById('art-gallery');
          if (galleryElement) {
            galleryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
    }
  }, [location]);

  // Função para atualizar os filtros e a URL
  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    
    // Atualizar URL sem recarregar a página
    const url = new URL(window.location.href);
    if (categoryId) {
      url.searchParams.set('category', categoryId.toString());
    } else {
      url.searchParams.delete('category');
    }
    window.history.pushState({}, '', url.toString());
  };

  return (
    <>
      <Hero />
      <RecentDesigns />
      <FeaturedCategories selectedCategory={selectedCategory} onCategorySelect={handleCategoryChange} />
      <div id="art-gallery">
        <ArtGallery 
          categoryId={selectedCategory} 
          formatId={selectedFormat} 
          fileTypeId={selectedFileType}
          onCategorySelect={handleCategoryChange}
        />
      </div>
      <FeatureStats />
      <PremiumFeatures />
      <Testimonials />
      <CallToAction />
    </>
  );
};

export default Home;
