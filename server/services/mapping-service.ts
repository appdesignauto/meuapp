import { PrismaClient } from '@prisma/client';

// Interface para os dados de entrada
interface ProductMappingInput {
  productId: string;
  offerCode?: string;
  productName: string;
  planType: string;
  durationDays: number;
}

// Inicializa o cliente Prisma
const prisma = new PrismaClient();

export const MappingService = {
  /**
   * Cria um novo mapeamento de produto Hotmart
   */
  async create(data: ProductMappingInput) {
    try {
      const result = await prisma.hotmartProductMapping.create({
        data
      });
      console.log('Mapeamento de produto criado com sucesso:', result);
      return result;
    } catch (error) {
      console.error('Erro ao criar mapeamento de produto:', error);
      throw error;
    }
  },

  /**
   * Lista todos os mapeamentos de produtos cadastrados
   */
  async list() {
    try {
      return await prisma.hotmartProductMapping.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      console.error('Erro ao listar mapeamentos de produtos:', error);
      throw error;
    }
  },

  /**
   * Remove um mapeamento de produto pelo ID
   */
  async delete(id: string) {
    try {
      return await prisma.hotmartProductMapping.delete({
        where: { id }
      });
    } catch (error) {
      console.error(`Erro ao remover mapeamento de produto ${id}:`, error);
      throw error;
    }
  },

  /**
   * Encontra um mapeamento baseado no ID do produto e código da oferta (opcional)
   */
  async findMatch(productId: string, offerCode?: string) {
    try {
      // Se offerCode for fornecido, busca pelo produto E oferta específicos
      if (offerCode) {
        return await prisma.hotmartProductMapping.findFirst({
          where: {
            productId,
            offerCode
          }
        });
      }
      
      // Caso contrário, busca apenas pelo ID do produto
      // Isso permite mapeamentos genéricos por produto
      return await prisma.hotmartProductMapping.findFirst({
        where: {
          productId,
          offerCode: null // Mapeamento padrão sem código de oferta específico
        }
      });
    } catch (error) {
      console.error(`Erro ao buscar mapeamento para produto ${productId}:`, error);
      return null;
    }
  }
};