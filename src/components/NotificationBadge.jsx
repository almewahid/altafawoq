import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function NotificationBadge() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ['unreadCount', user?.email],
    queryFn: async () => {
      if (!user?.email) return 0;
      const received = await base44.entities.Message.filter({ 
        receiver_email: user.email,
        is_read: false 
      });
      const chatMessages = await base44.entities.ChatMessage.filter({ 
        receiver_email: user.email,
        is_read: false 
      });
      return received.length + chatMessages.length;
    },
    enabled: !!user?.email,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (unreadMessages === 0) return null;

  return (
    <div className="relative inline-flex">
      <Bell className="w-5 h-5" />
      <Badge className="absolute -top-2 -left-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
        {unreadMessages > 9 ? '9+' : unreadMessages}
      </Badge>
    </div>
  );
}