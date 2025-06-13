import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

interface ResumoGeralData {
  faturamento: number
  assinantes: number
  premiumUsers: number
  totalUsers: number
  usuariosGratuitos: number
  taxaConversao: number
  ticketMedio: number
  totalArts: number
  totalPosts: number
  totalDownloads: number
  totalComments: number
  monthlyRevenue: number
  periodRevenue: number
  userGrowthPercent: number
  artGrowthPercent: number
  communityGrowthPercent: number
  downloadGrowthPercent: number
  commentGrowthPercent: number
}

export function useResumoGeral() {
  const { data: dados, isLoading: loading, error } = useQuery<ResumoGeralData>({
    queryKey: ['/api/dashboard/resumo-geral'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/resumo-geral', {
        credentials: 'include' // Importante para incluir cookies de sessão
      })
      
      if (!response.ok) {
        throw new Error('Erro ao carregar resumo geral')
      }
      
      return response.json()
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    retry: 2
  })

  return { dados, loading, error }
}