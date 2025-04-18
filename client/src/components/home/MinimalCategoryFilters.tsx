import { useQuery } from '@tanstack/react-query';
import { Category } from '@/types';
import { cn } from '@/lib/utils';

interface MinimalCategoryFiltersProps {
  selectedCategory?: number | null;
  onCategorySelect: (categoryId: number | null) => void;
}

const MinimalCategoryFilters = ({ 
  selectedCategory,
  onCategorySelect 
}: MinimalCategoryFiltersProps) => {
  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  return (
    <div className="overflow-x-auto hide-scrollbar mb-1">
      <div className="flex space-x-1.5 items-center">
        <button
          className={cn(
            "whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition-all",
            selectedCategory === null 
              ? "bg-blue-600 text-white" 
              : "bg-gray-100 text-neutral-700 hover:bg-gray-200"
          )}
          onClick={() => onCategorySelect(null)}
        >
          Todos
        </button>
        
        {categories?.map((category) => (
          <button
            key={category.id}
            className={cn(
              "whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              selectedCategory === category.id 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-neutral-700 hover:bg-gray-200"
            )}
            onClick={() => onCategorySelect(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MinimalCategoryFilters;