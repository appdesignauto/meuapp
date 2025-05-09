import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, Loader2, CheckCircle, MessageSquare, Heart, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { formatRelativeTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Notification {
  id: number;
  type: string;
  content: string;
  read: boolean;
  createdAt: string;
  sourceUser: {
    id: number;
    username: string;
    name: string;
    profileimageurl: string | null;
  };
  relatedPostId: number | null;
  relatedCommentId: number | null;
}

export function NotificationsPopover() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Interface para a resposta da contagem de notificações não lidas
  interface UnreadCountResponse {
    unreadCount: number;
  }

  // Interface para a resposta de notificações
  interface NotificationsResponse {
    notifications: Notification[];
  }

  // Consulta para obter o contador de notificações não lidas
  const { data, isLoading, error } = useQuery<UnreadCountResponse>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user, // Só carrega quando o usuário está logado
  });
  
  // Consulta para obter as notificações quando o popover está aberto
  const { 
    data: notificationsData, 
    isLoading: isLoadingNotifications, 
    error: notificationsError,
    refetch: refetchNotifications
  } = useQuery<NotificationsResponse>({
    queryKey: ["/api/notifications", { unread: activeTab === "unread" ? true : undefined }],
    enabled: !!user && open, // Só carrega quando está aberto e o usuário está logado
  });
  
  // Recarregar notificações quando mudar a aba
  useEffect(() => {
    if (open) {
      refetchNotifications();
    }
  }, [activeTab, open, refetchNotifications]);

  // Mutação para marcar notificações como lidas
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds: number[] | null) => {
      const payload = notificationIds ? { notificationIds } : { all: true };
      const res = await apiRequest("POST", "/api/notifications/mark-read", payload);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidar as queries de notificações para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      
      toast({
        title: "Notificações marcadas como lidas",
        description: "Todas as notificações foram marcadas como lidas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao marcar notificações",
        description: error.message || "Não foi possível marcar as notificações como lidas. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Função para lidar com clique em uma notificação
  const handleNotificationClick = (notification: Notification) => {
    // Marcar a notificação como lida
    if (!notification.read) {
      markAsReadMutation.mutate([notification.id]);
    }
    
    // Navegar para a página relacionada
    if (notification.relatedPostId) {
      navigate(`/comunidade/post/${notification.relatedPostId}`);
      setOpen(false);
    } else if (notification.type === "follow") {
      navigate(`/perfil/${notification.sourceUser.username}`);
      setOpen(false);
    }
  };

  // Função para obter o ícone baseado no tipo de notificação
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  // Função para marcar todas as notificações como lidas
  const handleMarkAllAsRead = () => {
    markAsReadMutation.mutate(null); // null indica marcar todas
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="h-9 w-9 flex items-center justify-center rounded-full text-neutral-600 hover:text-blue-600 hover:bg-blue-50 cursor-pointer">
          <div className="relative">
            <Bell className="h-5 w-5" />
            {data && data.unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                {data.unreadCount > 99 ? "99+" : data.unreadCount}
              </span>
            )}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="text-sm font-medium">Notificações</h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-2"
            onClick={handleMarkAllAsRead}
            disabled={markAsReadMutation.isPending}
          >
            {markAsReadMutation.isPending ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <CheckCircle className="h-3 w-3 mr-1" />
            )}
            <span>Marcar todas como lidas</span>
          </Button>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="unread">Não lidas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="focus:outline-none">
            <NotificationsList
              notifications={notificationsData?.notifications || []}
              isLoading={isLoadingNotifications}
              error={notificationsError}
              onNotificationClick={handleNotificationClick}
            />
          </TabsContent>
          
          <TabsContent value="unread" className="focus:outline-none">
            <NotificationsList
              notifications={notificationsData?.notifications || []}
              isLoading={isLoadingNotifications}
              error={notificationsError}
              onNotificationClick={handleNotificationClick}
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

interface NotificationsListProps {
  notifications: Notification[];
  isLoading: boolean;
  error: Error | null;
  onNotificationClick: (notification: Notification) => void;
}

function NotificationsList({
  notifications,
  isLoading,
  error,
  onNotificationClick,
}: NotificationsListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px] p-4">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] p-4 text-center">
        <Bell className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Erro ao carregar notificações.</p>
        <p className="text-xs text-gray-400 mt-1">Tente novamente mais tarde.</p>
      </div>
    );
  }

  if (!notifications.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] p-4 text-center">
        <Bell className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Nenhuma notificação disponível.</p>
        <p className="text-xs text-gray-400 mt-1">Novas notificações aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[350px]">
      <div className="p-1">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-md transition-colors ${
              !notification.read ? "bg-blue-50" : ""
            }`}
            onClick={() => onNotificationClick(notification)}
          >
            <div className="mt-0.5">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{notification.sourceUser.name}</span>{" "}
                {notification.content}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatRelativeTime(new Date(notification.createdAt))}
              </p>
            </div>
            {!notification.read && (
              <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "like":
      return <Heart className="h-4 w-4 text-red-500" />;
    case "comment":
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case "follow":
      return <UserPlus className="h-4 w-4 text-green-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}