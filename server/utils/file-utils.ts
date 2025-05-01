import { randomBytes } from 'crypto';
import path from 'path';

/**
 * Gera um nome de arquivo aleatório com a extensão fornecida
 * @param extension Extensão do arquivo (sem o ponto)
 * @returns Nome de arquivo aleatório com a extensão
 */
export function generateRandomFilename(extension: string): string {
  const timestamp = Date.now().toString();
  const randomString = randomBytes(8).toString('hex');
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Valida se a extensão do arquivo é permitida
 * @param filename Nome do arquivo
 * @param allowedExtensions Array com extensões permitidas
 * @returns true se a extensão for permitida, false caso contrário
 */
export function isValidFileExtension(
  filename: string,
  allowedExtensions: string[]
): boolean {
  const ext = path.extname(filename).toLowerCase().substring(1);
  return allowedExtensions.includes(ext);
}

/**
 * Obtém a extensão do arquivo a partir do mimetype
 * @param mimetype Tipo MIME do arquivo
 * @returns Extensão correspondente ao mimetype
 */
export function getExtensionFromMimeType(mimetype: string): string {
  const mimeTypeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'application/pdf': 'pdf'
  };

  return mimeTypeMap[mimetype] || 'unknown';
}

/**
 * Valida o tipo MIME de um arquivo
 * @param mimetype Tipo MIME do arquivo
 * @param allowedMimeTypes Array com tipos MIME permitidos
 * @returns true se o tipo MIME for permitido, false caso contrário
 */
export function isValidMimeType(
  mimetype: string,
  allowedMimeTypes: string[]
): boolean {
  return allowedMimeTypes.includes(mimetype);
}

/**
 * Cria um caminho de arquivo com estrutura de diretórios para melhor organização
 * @param category Categoria do arquivo (ex: 'avatars', 'products', etc)
 * @param filename Nome do arquivo
 * @returns Caminho estruturado para o arquivo
 */
export function createStructuredFilePath(
  category: string,
  filename: string
): string {
  const timestamp = new Date();
  const year = timestamp.getFullYear().toString();
  const month = (timestamp.getMonth() + 1).toString().padStart(2, '0');
  
  return `${category}/${year}/${month}/${filename}`;
}