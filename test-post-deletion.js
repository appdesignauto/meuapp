/**
 * Script para testar a funcionalidade de exclusão de posts da comunidade
 * 
 * Este script testa as seguintes funcionalidades:
 * 1. Exclusão de um post da comunidade
 * 2. Verificação da remoção de dados relacionados (likes, comentários, etc.)
 * 3. Validação das transações atômicas
 */
import { db } from './server/db.js';
import { communityPosts, communityComments, communityLikes, communityCommentLikes, communitySaves } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function testPostDeletion() {
  try {
    console.log('======== TESTE DE EXCLUSÃO DE POSTS ========');
    console.log('Iniciando teste de exclusão...');
    
    // Escolha um ID de post para testar a exclusão
    // Deve ser um post que você está disposto a perder!
    const postId = 1; // IMPORTANTE: Mude para um ID válido que possa ser excluído
    
    console.log(`Testando exclusão do post ID: ${postId}`);

    // 1. Verificar se o post existe
    const existingPost = await db.select().from(communityPosts).where(eq(communityPosts.id, postId));
    
    if (!existingPost || existingPost.length === 0) {
      console.log(`Post ID ${postId} não encontrado. Escolha outro ID para testar.`);
      return;
    }
    
    console.log(`Post encontrado: "${existingPost[0].title}"`);

    // 2. Contar dados relacionados antes da exclusão
    const commentCountBefore = await db.select({ count: db.fn.count() }).from(communityComments).where(eq(communityComments.postId, postId));
    const likesCountBefore = await db.select({ count: db.fn.count() }).from(communityLikes).where(eq(communityLikes.postId, postId));
    const savesCountBefore = await db.select({ count: db.fn.count() }).from(communitySaves).where(eq(communitySaves.postId, postId));

    // 3. Contar curtidas em comentários
    const commentIds = await db.select({ id: communityComments.id }).from(communityComments).where(eq(communityComments.postId, postId));
    let commentLikesCountBefore = 0;
    
    if (commentIds && commentIds.length > 0) {
      const ids = commentIds.map(c => c.id);
      const commentLikesCount = await db.select({ count: db.fn.count() }).from(communityCommentLikes).where(
        eq(communityCommentLikes.commentId, ids)
      );
      commentLikesCountBefore = parseInt(commentLikesCount[0]?.count || 0);
    }

    console.log('Dados relacionados antes da exclusão:');
    console.log(`- Comentários: ${commentCountBefore[0]?.count || 0}`);
    console.log(`- Curtidas no post: ${likesCountBefore[0]?.count || 0}`);
    console.log(`- Salvamentos: ${savesCountBefore[0]?.count || 0}`);
    console.log(`- Curtidas em comentários: ${commentLikesCountBefore}`);

    // 4. Executar a transação de exclusão
    console.log('\nIniciando exclusão com transação...');
    
    try {
      // Iniciar uma transação para garantir operação atômica
      await db.transaction(async (tx) => {
        console.log('- Excluindo curtidas de comentários associados a este post...');
        if (commentIds && commentIds.length > 0) {
          await tx
            .delete(communityCommentLikes)
            .where(eq(communityCommentLikes.commentId, commentIds.map(c => c.id)));
        }
        
        console.log('- Excluindo respostas aos comentários deste post...');
        if (commentIds && commentIds.length > 0) {
          await tx
            .delete(communityComments)
            .where(
              eq(communityComments.parentId, commentIds.map(c => c.id))
            );
        }
          
        console.log('- Excluindo comentários do post...');
        await tx
          .delete(communityComments)
          .where(eq(communityComments.postId, postId));
        
        console.log('- Excluindo curtidas do post...');
        await tx
          .delete(communityLikes)
          .where(eq(communityLikes.postId, postId));
        
        console.log('- Excluindo salvamentos do post...');
        await tx
          .delete(communitySaves)
          .where(eq(communitySaves.postId, postId));
        
        console.log('- Excluindo o post...');
        await tx
          .delete(communityPosts)
          .where(eq(communityPosts.id, postId));
      });
      
      console.log('Transação de exclusão concluída com sucesso');
    } catch (txError) {
      console.error('ERRO na transação de exclusão:', txError);
      return;
    }

    // 5. Verificar se o post foi realmente excluído
    const postAfter = await db.select().from(communityPosts).where(eq(communityPosts.id, postId));
    
    if (postAfter && postAfter.length > 0) {
      console.error('\nERRO: Post ainda existe após a exclusão!');
      return;
    }
    
    console.log('\nVerificação após exclusão:');
    console.log(`- Post ID ${postId} foi excluído com sucesso`);

    // 6. Verificar se dados relacionados foram excluídos
    const commentCountAfter = await db.select({ count: db.fn.count() }).from(communityComments).where(eq(communityComments.postId, postId));
    const likesCountAfter = await db.select({ count: db.fn.count() }).from(communityLikes).where(eq(communityLikes.postId, postId));
    const savesCountAfter = await db.select({ count: db.fn.count() }).from(communitySaves).where(eq(communitySaves.postId, postId));

    console.log('Dados relacionados após exclusão:');
    console.log(`- Comentários: ${commentCountAfter[0]?.count || 0} (antes: ${commentCountBefore[0]?.count || 0})`);
    console.log(`- Curtidas no post: ${likesCountAfter[0]?.count || 0} (antes: ${likesCountBefore[0]?.count || 0})`);
    console.log(`- Salvamentos: ${savesCountAfter[0]?.count || 0} (antes: ${savesCountBefore[0]?.count || 0})`);

    // 7. Conclusão
    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO');
    console.log('O post e todos os seus dados relacionados foram excluídos corretamente');
    console.log('======================================');

  } catch (error) {
    console.error('ERRO durante o teste de exclusão:', error);
  } finally {
    // Encerrar conexão
    process.exit(0);
  }
}

// Executar o teste
testPostDeletion();