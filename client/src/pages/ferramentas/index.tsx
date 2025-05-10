import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

import FerramentaCard from '@/components/ferramentas/FerramentaCard';
import CategoriasCarousel from '@/components/ferramentas/CategoriasCarousel';
import { Input } from '@/components/ui/input';
import { Ferramenta, FerramentaCategoria } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';

const FerramentasPage: React.FC = () => {
  // Estado local
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const [termoBusca, setTermoBusca] = useState('');
  const { toast } = useToast();

  // Buscar categorias
  const { 
    data: categorias = [], 
    isLoading: categoriasCarregando,
    error: categoriasErro 
  } = useQuery<FerramentaCategoria[]>({
    queryKey: ['/api/ferramentas/categorias'],
  });

  // Buscar ferramentas com filtros
  const { 
    data: ferramentas = [], 
    isLoading: ferramentasCarregando,
    error: ferramentasErro,
    refetch: refetchFerramentas
  } = useQuery<Ferramenta[]>({
    queryKey: ['/api/ferramentas', { categoria: categoriaSelecionada, busca: termoBusca }],
    enabled: true,
  });

  // Recarregar ferramentas quando o filtro mudar
  useEffect(() => {
    refetchFerramentas();
  }, [categoriaSelecionada, termoBusca, refetchFerramentas]);

  // Verificar erros
  useEffect(() => {
    if (categoriasErro) {
      toast({
        title: 'Erro ao carregar categorias',
        description: 'Ocorreu um erro ao carregar as categorias. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }

    if (ferramentasErro) {
      toast({
        title: 'Erro ao carregar ferramentas',
        description: 'Ocorreu um erro ao carregar as ferramentas. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  }, [categoriasErro, ferramentasErro, toast]);

  // Handler para alterar a categoria selecionada
  const handleCategoriaChange = (slug: string | null) => {
    setCategoriaSelecionada(slug);
  };

  // Handler para pesquisa com debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    // Usando um timeout simples para debounce
    const timeoutId = setTimeout(() => {
      setTermoBusca(valor);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  return (
    <Layout>
      <Helmet>
        <title>Ferramentas Úteis | Design Auto</title>
        <meta name="description" content="Ferramentas úteis para designers automotivos - Design Auto" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Ferramentas Úteis</h1>
            <p className="text-gray-600 mb-6 md:mb-0">
              Descubra as melhores ferramentas para designers automotivos
            </p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Buscar ferramentas..."
              className="pl-10"
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Carousel de categorias estilo Netflix */}
        {categoriasCarregando ? (
          <div className="h-10 bg-gray-200 animate-pulse rounded-md mb-6"></div>
        ) : (
          <CategoriasCarousel
            categorias={categorias}
            categoriaSelecionada={categoriaSelecionada}
            onCategoriaChange={handleCategoriaChange}
          />
        )}

        {/* Grid de ferramentas */}
        {ferramentasCarregando ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-md h-80"></div>
            ))}
          </div>
        ) : ferramentas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {termoBusca 
                ? `Nenhuma ferramenta encontrada para "${termoBusca}"` 
                : "Nenhuma ferramenta disponível"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {ferramentas.map((ferramenta) => (
              <FerramentaCard
                key={ferramenta.id}
                id={ferramenta.id}
                nome={ferramenta.nome}
                descricao={ferramenta.descricao}
                imageUrl={ferramenta.imageUrl}
                websiteUrl={ferramenta.websiteUrl}
                isExterno={ferramenta.isExterno}
                isNovo={ferramenta.isNovo}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FerramentasPage;