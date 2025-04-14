import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Category, Format, FileType } from '@/types';

interface CategoryFiltersProps {
  onCategoryChange: (categoryId: number | null) => void;
  onFormatChange: (formatId: number | null) => void;
  onFileTypeChange: (fileTypeId: number | null) => void;
}

const CategoryFilters = ({ onCategoryChange, onFormatChange, onFileTypeChange }: CategoryFiltersProps) => {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [showFileTypeDropdown, setShowFileTypeDropdown] = useState(false);

  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch formats
  const { data: formats } = useQuery<Format[]>({
    queryKey: ['/api/formats'],
  });

  // Fetch file types
  const { data: fileTypes } = useQuery<FileType[]>({
    queryKey: ['/api/fileTypes'],
  });

  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    onCategoryChange(categoryId);
  };

  const handleFormatSelect = (formatId: number | null) => {
    onFormatChange(formatId);
    setShowFormatDropdown(false);
  };

  const handleFileTypeSelect = (fileTypeId: number | null) => {
    onFileTypeChange(fileTypeId);
    setShowFileTypeDropdown(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowFormatDropdown(false);
      setShowFileTypeDropdown(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <section className="py-8 border-b border-neutral-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4 md:mb-0">Encontre artes por categoria</h2>
          
          <div className="flex items-center space-x-3">
            {/* Format Dropdown */}
            <div className="relative">
              <button 
                className="flex items-center text-neutral-700 hover:text-primary border border-neutral-300 rounded-md px-3 py-2 text-sm font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFormatDropdown(!showFormatDropdown);
                  setShowFileTypeDropdown(false);
                }}
              >
                <span>Formato</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </button>
              
              {showFormatDropdown && (
                <div className="absolute z-10 mt-1 w-48 bg-white rounded-md shadow-lg">
                  <div className="py-1">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                      onClick={() => handleFormatSelect(null)}
                    >
                      Todos os formatos
                    </button>
                    {formats?.map((format) => (
                      <button
                        key={format.id}
                        className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                        onClick={() => handleFormatSelect(format.id)}
                      >
                        {format.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* File Type Dropdown */}
            <div className="relative">
              <button 
                className="flex items-center text-neutral-700 hover:text-primary border border-neutral-300 rounded-md px-3 py-2 text-sm font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFileTypeDropdown(!showFileTypeDropdown);
                  setShowFormatDropdown(false);
                }}
              >
                <span>Tipo de arquivo</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </button>
              
              {showFileTypeDropdown && (
                <div className="absolute z-10 mt-1 w-48 bg-white rounded-md shadow-lg">
                  <div className="py-1">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                      onClick={() => handleFileTypeSelect(null)}
                    >
                      Todos os tipos
                    </button>
                    {fileTypes?.map((fileType) => (
                      <button
                        key={fileType.id}
                        className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                        onClick={() => handleFileTypeSelect(fileType.id)}
                      >
                        {fileType.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* More Filters Button */}
            <button className="hidden md:flex items-center text-neutral-700 hover:text-primary border border-neutral-300 rounded-md px-3 py-2 text-sm font-medium">
              <Sliders className="h-4 w-4 mr-2" />
              <span>Mais filtros</span>
            </button>
          </div>
        </div>
        
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            className={cn(
              "rounded-full text-sm",
              selectedCategory === null ? "bg-primary text-white" : ""
            )}
            onClick={() => handleCategorySelect(null)}
          >
            Todos
          </Button>
          
          {categories?.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              className={cn(
                "rounded-full text-sm",
                selectedCategory === category.id ? "bg-primary text-white" : ""
              )}
              onClick={() => handleCategorySelect(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryFilters;
