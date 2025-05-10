// Arquivo de exportação centralizada dos serviços da aplicação
import { SupabaseStorageService } from './supabase-storage-service';
import { StorageService } from './storage-service';

// Instanciar serviços
export const storageService: StorageService = new SupabaseStorageService();

// Exportar outros serviços conforme necessário