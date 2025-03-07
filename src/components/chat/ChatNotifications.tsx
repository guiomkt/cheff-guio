import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, MessageSquare, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationType {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'message';
  time: string;
  read: boolean;
  action?: string;
}

interface TypeStyles {
  bgColor: string;
  icon: React.ReactNode;
}

const ChatNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([
    {
      id: '1',
      title: 'Nova mensagem recebida',
      message: 'Você recebeu uma nova mensagem de João Silva',
      type: 'message',
      time: 'Agora mesmo',
      read: false,
      action: 'Ver mensagem'
    },
    {
      id: '2',
      title: 'Atendimento concluído',
      message: 'O atendimento com Maria Oliveira foi concluído com sucesso',
      type: 'success',
      time: '10 min atrás',
      read: false
    },
    {
      id: '3',
      title: 'Lembrete de seguimento',
      message: 'Você precisa entrar em contato com Pedro Santos para seguimento',
      type: 'info',
      time: '2h atrás',
      read: true,
      action: 'Agendar'
    },
    {
      id: '4',
      title: 'Alerta de espera longa',
      message: 'A conversa com Ana Pereira está aguardando resposta há mais de 30 min',
      type: 'warning',
      time: '35 min atrás',
      read: true
    }
  ]);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationAction = (id: string) => {
    // Implement the action for a notification
    console.log(`Action clicked for notification ${id}`);
  };

  const markAllAsRead = () => {
    // Implement the logic to mark all notifications as read
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: NotificationType['type']) => {
    switch (type) {
      case 'success':
        return <CheckCheck className="h-4 w-4 text-white" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-white" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-white" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-white" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-white" />;
    }
  };

  const getNotificationTypeStyles = (type: NotificationType['type']): TypeStyles => {
    switch (type) {
      case 'success':
        return { bgColor: 'bg-green-500', icon: <CheckCheck className="h-4 w-4 text-white" /> };
      case 'warning':
        return { bgColor: 'bg-yellow-500', icon: <AlertCircle className="h-4 w-4 text-white" /> };
      case 'error':
        return { bgColor: 'bg-red-500', icon: <AlertCircle className="h-4 w-4 text-white" /> };
      case 'message':
        return { bgColor: 'bg-blue-500', icon: <MessageSquare className="h-4 w-4 text-white" /> };
      case 'info':
      default:
        return { bgColor: 'bg-gray-500', icon: <Info className="h-4 w-4 text-white" /> };
    }
  };

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium">Notificações</h3>
            <p className="text-sm text-muted-foreground">
              Acompanhe as novidades e alertas do sistema de atendimento.
            </p>
          </div>
          
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                <h3 className="font-medium text-lg">Sem notificações</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Você não tem nenhuma notificação no momento. Novas notificações aparecerão aqui.
                </p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "p-4 rounded-lg border relative",
                    notification.read ? "bg-background" : "bg-muted/30"
                  )}
                >
                  {!notification.read && (
                    <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary" />
                  )}
                  <div className="flex gap-4">
                    <div className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      getNotificationTypeStyles(notification.type).bgColor
                    )}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-start justify-between">
                        <p className={cn(
                          "text-sm font-medium leading-none",
                          !notification.read && "text-foreground"
                        )}>
                          {notification.title}
                        </p>
                        <time className="text-xs text-muted-foreground">{notification.time}</time>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      {notification.action && (
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-sm font-medium mt-1" 
                          onClick={() => handleNotificationAction(notification.id)}
                        >
                          {notification.action}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="pt-2 flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs" 
                onClick={markAllAsRead}
                disabled={!unreadCount}
              >
                Marcar todas como lidas
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatNotifications; 