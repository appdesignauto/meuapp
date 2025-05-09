{Array.isArray(popularPosts) && popularPosts.map((item: any) => {
  // Verificar se o objeto e suas propriedades existem antes de renderizar
  if (!item || !item.post) {
    console.log('Item de post popular inválido:', item);
    return null;
  }
  
  const postId = item.post?.id || 0;
  const imageUrl = item.post?.imageUrl || '';
  const title = item.post?.title || 'Post sem título';
  const likes = item.likesCount || 0;
  const comments = item.commentsCount || 0;
  const postUserId = item.user?.id;
  const isFollowing = item.user?.isFollowing || false;
  
  return (
    <div key={postId} className="flex flex-col">
      <div className="flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 p-2 rounded-md transition-colors">
        <Link 
          href={`/comunidade/post/${postId}`}
          className="flex items-start gap-3 flex-1"
        >
          <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://placehold.co/200x200/gray/white?text=DesignAuto";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm line-clamp-2">
              {title}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {likes === 1 ? '1 curtida' : `${likes} curtidas`} • {comments === 1 ? '1 comentário' : `${comments} comentários`}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                por <span className="font-medium">{item.user?.username || 'usuário'}</span>
              </p>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Botão de seguir, exibido apenas para usuários logados que não são o autor */}
      {user && postUserId && user.id !== postUserId && (
        <div className="ml-[5.5rem] -mt-1 mb-1">
          <FollowButton 
            userId={postUserId} 
            isFollowing={isFollowing}
            size="sm"
            variant="outline"
            className="text-xs px-2 h-7 py-0"
          />
        </div>
      )}
    </div>
  );
})}
