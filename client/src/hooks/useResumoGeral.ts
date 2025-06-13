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
  newUsersMonth: number
  newUsersPrevPeriod: number
  activeUsers: number
  activeWeek: number
  artsThisPeriod: number
  artsPrevPeriod: number
  artsThisWeek: number
  artsThisMonth: number
  postsThisPeriod: number
  postsPrevPeriod: number
  postsThisWeek: number
  postsThisMonth: number
  downloadsThisPeriod: number
  downloadsPrevPeriod: number
  commentsThisPeriod: number
  commentsPrevPeriod: number
}

export function useResumoGeral(period: string = '30d') {
  const { data: dados, isLoading: loading, error } = useQuery<ResumoGeralData>({
    queryKey: ['/api/dashboard/resumo-geral', period],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/resumo-geral?period=${period}`, {
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