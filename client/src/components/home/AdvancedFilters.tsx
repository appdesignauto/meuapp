import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Eye, Star, Clock, Crown, Gift } from 'lucide-react';
import { Category, Format, FileType } from '@/types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface AdvancedFiltersProps {
  selectedCategory?: number | null;
  selectedFormat?: number | null;
  selectedFileType?: number | null;
  selectedSort?: string;
  selectedPremiumFilter?: 'all' | 'premium' | 'free';
  onCategorySelect: (categoryId: number | null) => void;
  onFormatSelect: (formatId: number | null) => void;
  onFileTypeSelect: (fileTypeId: number | null) => void;
  onSortSelect: (sort: string) => void;
  onPremiumFilterSelect: (filter: 'all' | 'premium' | 'free') => void;
}

const AdvancedFilters = ({
  selectedCategory,
  selectedFormat,
  selectedFileType,
  selectedSort = 'recentes',
  selectedPremiumFilter = 'all',
  onCategorySelect,
  onFormatSelect,
  onFileTypeSelect,
  onSortSelect,
  onPremiumFilterSelect
}: AdvancedFiltersProps) => {
  // Fetch data for dropdowns
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: formats } = useQuery<Format[]>({
    queryKey: ['/api/formats'],
  });

  const { data: fileTypes } = useQuery<FileType[]>({
    queryKey: ['/api/fileTypes'],
  });

  // Filter buttons configuration
  const sortFilters = [
    {
      id: 'todas',
      label: 'Todas',
      icon: Eye,
      description: 'Ver todas as artes'
    },
    {
      id: 'populares',
      label: 'Mais populares',
      icon: Star,
      description: 'Artes mais visualizadas'
    },
    {
      id: 'recentes',
      label: 'Recentes',
      icon: Clock,
      description: 'Artes mais recentes'
    }
  ];

  const premiumFilters = [
    {
      id: 'premium' as const,
      label: 'Premium',
      icon: Crown,
      description: 'Artes premium exclusivas'
    },
    {
      id: 'free' as const,
      label: 'Grátis',
      icon: Gift,
      description: 'Artes gratuitas'
    }
  ];

  // Get selected format name
  const getSelectedFormatName = () => {
    if (!selectedFormat || !formats) return 'Todos os formatos';
    const format = formats.find(f => f.id === selectedFormat);
    return format?.name || 'Todos os formatos';
  };

  // Get selected file type name
  const getSelectedFileTypeName = () => {
    if (!selectedFileType || !fileTypes) return 'Todos os tipos';
    const fileType = fileTypes.find(ft => ft.id === selectedFileType);
    return fileType?.name || 'Todos os tipos';
  };

  return (
    <div className="w-full space-y-4 mb-6">
      {/* Main filter buttons */}
      <div className="flex flex-wrap gap-2">
        {sortFilters.map((filter) => {
          const Icon = filter.icon;
          const isActive = selectedSort === filter.id;
          
          return (
            <Button
              key={filter.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={cn(
                "flex items-center gap-2 h-9 px-4 transition-all duration-200",
                isActive 
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md" 
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
              )}
              onClick={() => {
                onSortSelect(filter.id);
                if (filter.id === 'todas') {
                  onPremiumFilterSelect('all');
                }
              }}
            >
              <Icon className="w-4 h-4" />
              {filter.label}
            </Button>
          );
        })}

        {/* Premium/Free filters */}
        {premiumFilters.map((filter) => {
          const Icon = filter.icon;
          const isActive = selectedPremiumFilter === filter.id;
          
          return (
            <Button
              key={filter.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={cn(
                "flex items-center gap-2 h-9 px-4 transition-all duration-200",
                isActive 
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md" 
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
              )}
              onClick={() => onPremiumFilterSelect(filter.id)}
            >
              <Icon className="w-4 h-4" />
              {filter.label}
            </Button>
          );
        })}
      </div>

      {/* Dropdown filters */}
      <div className="flex flex-wrap gap-3">
        {/* Format dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 h-9 px-4 bg-white hover:bg-gray-50 border-gray-200"
            >
              {getSelectedFormatName()}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onFormatSelect(null)}
            >
              Todos os formatos
            </DropdownMenuItem>
            {formats?.map((format) => (
              <DropdownMenuItem
                key={format.id}
                className="cursor-pointer"
                onClick={() => onFormatSelect(format.id)}
              >
                {format.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* File Type dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 h-9 px-4 bg-white hover:bg-gray-50 border-gray-200"
            >
              {getSelectedFileTypeName()}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onFileTypeSelect(null)}
            >
              Todos os tipos
            </DropdownMenuItem>
            {fileTypes?.map((fileType) => (
              <DropdownMenuItem
                key={fileType.id}
                className="cursor-pointer"
                onClick={() => onFileTypeSelect(fileType.id)}
              >
                {fileType.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                selectedCategory === null 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
              onClick={() => onCategorySelect(null)}
            >
              Todas as categorias
            </button>
            
            {categories.map((category) => (
              <button
                key={category.id}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                  selectedCategory === category.id 
                    ? "bg-blue-600 text-white shadow-md" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
                onClick={() => onCategorySelect(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;