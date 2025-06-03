/**
 * Script para corrigir a exibição de datas nos posts da comunidade
 * 
 * Este script adiciona o campo formattedDate em todas as consultas
 * que retornam posts da comunidade para evitar que o frontend mostre
 * "agora" ou "há x minutos" para posts antigos que foram atualizados.
 * 
 * A solução é pré-calcular a data formatada no backend, no formato
 * convencional brasileiro DD/MM/YYYY HH:MM e enviá-la pronta para o frontend
 * sem depender de bibliotecas de formatação relativa de datas.
 */

// Locais onde adicionar a formatação de data:
// 
// 1. Na rota /api/community/populares - linha 186
//    - Adicionar após linha 185:
//      // Pré-formatar a data para evitar mudanças ao visualizar
//      const formattedDate = formatarDataCompleta(row.createdAt || new Date());
//    - Após linha 200 acrescentar:
//      formattedDate: formattedDate // Adicionar campo de data pré-formatada
//
// 2. Na rota /api/community/posts - [IMPLEMENTADO]
//    - Formatação já foi implementada
//
// 3. Na rota /api/community/posts/:id - [IMPLEMENTADO]
//    - Formatação já foi implementada
//
// 4. Na rota /api/community/posts-by-user - linha 2691
//    - Usar a mesma lógica
//
// Verificar outras rotas que possam retornar posts da comunidade e
// aplicar a mesma solução de pré-formatação de data.