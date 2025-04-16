import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  className 
}: PaginationProps) {
  
  // Não mostrar paginação se houver apenas uma página
  if (totalPages <= 1) {
    return null;
  }
  
  // Função para gerar array com os números de página a serem exibidos
  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    
    // Se o número total de páginas for menor ou igual ao máximo a mostrar
    if (totalPages <= maxPagesToShow) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Determinar quais páginas mostrar com base na página atual
    const pages = [];
    
    // Sempre mostrar a primeira página
    pages.push(1);
    
    // Adicionar páginas intermediárias
    if (currentPage <= 3) {
      // Próximo à primeira página
      pages.push(2, 3, 4);
    } else if (currentPage >= totalPages - 2) {
      // Próximo à última página
      pages.push(totalPages - 3, totalPages - 2, totalPages - 1);
    } else {
      // No meio
      pages.push(currentPage - 1, currentPage, currentPage + 1);
    }
    
    // Sempre mostrar a última página
    if (!pages.includes(totalPages)) {
      pages.push(totalPages);
    }
    
    // Organizar e adicionar elipses
    const sortedPages = [...new Set(pages)].sort((a, b) => a - b);
    const result = [];
    
    for (let i = 0; i < sortedPages.length; i++) {
      result.push(sortedPages[i]);
      
      // Adicionar elipse se necessário
      if (i < sortedPages.length - 1 && sortedPages[i + 1] - sortedPages[i] > 1) {
        result.push("ellipsis");
      }
    }
    
    return result;
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <nav
      role="navigation"
      aria-label="Paginação"
      className={cn("flex justify-center items-center space-x-2", className)}
    >
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center space-x-2">
        {pageNumbers.map((page, index) => 
          page === "ellipsis" ? (
            <div key={`ellipsis-${index}`} className="flex items-center justify-center">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              onClick={() => onPageChange(page as number)}
              aria-label={`Página ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </Button>
          )
        )}
      </div>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Próxima página"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}