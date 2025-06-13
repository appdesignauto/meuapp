import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

interface ResumoGeralData {
  faturamento: number
  assinantes: number
  taxaConversao: number
  ticketMedio: number
  usuariosTotais: number
  usuariosGratuitos: number
  usuariosPremium: number
  artesTotais: number
  postsTotais: number
  receitaMensal: number
  downloadsTotais: number
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