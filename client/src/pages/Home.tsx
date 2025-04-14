import { useState } from 'react';
import Hero from '@/components/home/Hero';
import CategoryFilters from '@/components/home/CategoryFilters';
import FeaturedCollections from '@/components/home/FeaturedCollections';
import ArtGallery from '@/components/home/ArtGallery';
import PremiumFeatures from '@/components/home/PremiumFeatures';
import Testimonials from '@/components/home/Testimonials';
import CallToAction from '@/components/home/CallToAction';

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<number | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<number | null>(null);

  return (
    <>
      <Hero />
      <CategoryFilters 
        onCategoryChange={setSelectedCategory}
        onFormatChange={setSelectedFormat}
        onFileTypeChange={setSelectedFileType}
      />
      <FeaturedCollections />
      <ArtGallery 
        categoryId={selectedCategory} 
        formatId={selectedFormat} 
        fileTypeId={selectedFileType} 
      />
      <PremiumFeatures />
      <Testimonials />
      <CallToAction />
    </>
  );
};

export default Home;
