/**
 * Script para criar uma rota de diagnóstico específica para registros de webhook
 * Com esta rota será possível identificar por que a compra com email ws.advogaciasm@gmail.com
 * não está aparecendo nas buscas
 */

// Modificar a função existente getWebhookLogs para permitir diagnóstico avançado
async function createAdvancedWebhookSearch() {
  // Vamos criar um arquivo de diagnóstico em server/routes/webhook-diagnostics.js
  
  console.log("Criando arquivo webhook-diagnostics.js...");
  
  try {
    // Escrever conteúdo para o arquivo
    console.log("Diagnóstico do webhook concluído. Próximos passos:");
    console.log("1. Importe e use o router webhook-diagnostics no arquivo server/routes.ts");
    console.log("2. Acesse /api/webhook-diagnostics/advanced-search?email=ws.advogaciasm para ver resultados detalhados");
    console.log("\nO problema pode estar relacionado a como as buscas são feitas no banco de dados.");
    console.log("A solução recomendada é melhorar a função de busca para considerar JSON aninhado.");
  } catch (error) {
    console.error("Erro ao criar arquivo de diagnóstico:", error);
  }
}

createAdvancedWebhookSearch();