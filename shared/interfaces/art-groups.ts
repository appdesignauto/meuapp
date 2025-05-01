/**
 * Interfaces para o sistema de artes com múltiplos formatos
 */

export interface ArtGroup {
  id: number;
  title: string;
  categoryId: number;
  designerId: number;
  isVisible: boolean;
  isPremium: boolean;
  status: string;
  downloadCount: number;
  viewCount: number;
  likeCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Campos relacionados (preenchidos em consultas JOIN)
  designerName?: string;
  designerUsername?: string;
  designerProfileImageUrl?: string;
  designerBio?: string;
  categoryName?: string;
  categorySlug?: string;
  primaryVariationId?: number;
  primaryImageUrl?: string;
}

export interface ArtVariation {
  id: number;
  groupId: number;
  formatId: number;
  imageUrl: string;
  editUrl: string;
  fileTypeId: number;
  width?: number | null;
  height?: number | null;
  aspectRatio?: string | null;
  isPrimary: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Campos relacionados (preenchidos em consultas JOIN)
  formatName?: string;
  formatSlug?: string;
  fileTypeName?: string;
  fileTypeSlug?: string;
}

export interface ArtGroupWithVariations extends ArtGroup {
  variations: ArtVariation[];
}

export interface ArtGroupFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  formatId?: number;
  designerId?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
  onlyPremium?: boolean;
  showInvisible?: boolean;
}

// Tipo para criar um novo grupo de arte
export interface CreateArtGroupRequest {
  title: string;
  categoryId: number;
  isPremium: boolean;
  formatId: number;
  fileTypeId: number;
  editUrl?: string;
  // A imagem é enviada como FormData
}

// Tipo para adicionar uma nova variação
export interface AddVariationRequest {
  formatId: number;
  fileTypeId: number;
  editUrl?: string;
  isPrimary?: boolean;
  // A imagem é enviada como FormData
}

// Tipo para resposta da API com paginação
export interface ArtGroupsResponse {
  groups: ArtGroup[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  }
}