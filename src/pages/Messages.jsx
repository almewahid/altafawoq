import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/components/SupabaseClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import ChatInterface from "@/components/chat/ChatInterface";

export default function Messages() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { currentUser: user, loading: authLoading } = useAuth();

  console.log('🔍 User from AuthContext:', user);
  console.log('🔍 Auth Loading:', authLoading);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', user?.email],
    queryFn: async () => {
      console.log('🚀 Starting query with email:', user?.email);
      
      if (!user?.email) return [];

      const sessionStr = localStorage.getItem('sb-auth-token');
      const session = JSON.parse(sessionStr);

      // استعلام 1: الرسائل المرسلة
      const sentResponse = await fetch(
        `https://jwfawrdwlhixjjyxposq.supabase.co/rest/v1/chat_messages?sender_email=eq.${user.email}&group_id=is.null&select=*`,
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZmF3cmR3bGhpeGpqeXhwb3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTY4MDUsImV4cCI6MjA3OTk5MjgwNX0.2_bFNg5P616a33CNI_aEjgbKyZlQkmam2R4bOMh2Lck',
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );
      const sent = await sentResponse.json();
      console.log('📤 Sent messages:', sent);

      // استعلام 2: الرسائل المستلمة
      const receivedResponse = await fetch(
        `https://jwfawrdwlhixjjyxposq.supabase.co/rest/v1/chat_messages?receiver_email=eq.${user.email}&group_id=is.null&select=*`,
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZmF3cmR3bGhpeGpqeXhwb3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTY4MDUsImV4cCI6MjA3OTk5MjgwNX0.2_bFNg5P616a33CNI_aEjgbKyZlQkmam2R4bOMh2Lck',
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );
      const received = await receivedResponse.json();
      console.log('📥 Received messages:', received);

      const allMessages = [...(Array.isArray(sent) ? sent : []), ...(Array.isArray(received) ? received : [])];
      console.log('📦 All messages:', allMessages);
      
      if (allMessages.length === 0) return [];

      // ترتيب الرسائل حسب التاريخ
      allMessages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // تجميع المحادثات حسب المستخدم الآخر
      const conversationsMap = new Map();

      allMessages.forEach(msg => {
        const otherUserEmail = msg.sender_email === user.email 
          ? msg.receiver_email 
          : msg.sender_email;

        if (!conversationsMap.has(otherUserEmail)) {
          conversationsMap.set(otherUserEmail, {
            email: otherUserEmail,
            lastMessage: msg.message,
            lastMessageTime: msg.created_at,
            unread: msg.receiver_email === user.email && !msg.is_read ? 1 : 0
          });
        } else {
          const conv = conversationsMap.get(otherUserEmail);
          if (msg.receiver_email === user.email && !msg.is_read) {
            conv.unread += 1;
          }
        }
      });

      // جلب أسماء المستخدمين
      const emails = Array.from(conversationsMap.keys());
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('email, full_name')
        .in('email', emails);

      console.log('👥 Profiles:', profiles);

      // دمج البيانات
      const conversationsArray = Array.from(conversationsMap.values()).map(conv => {
        const profile = profiles?.find(p => p.email === conv.email);
        return {
          ...conv,
          name: profile?.full_name || conv.email.split('@')[0],
          time: formatTime(conv.lastMessageTime)
        };
      });

      console.log('✅ Final conversations array:', conversationsArray);
      return conversationsArray;
    },
    enabled: !!user?.email && !authLoading,
  });

  console.log('📋 Final conversations:', conversations);
  console.log('⏳ Is Loading:', isLoading);

  // فلترة المحادثات
  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // تنسيق الوقت
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ar-KW', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'أمس';
    } else {
      return date.toLocaleDateString('ar-KW', { month: 'short', day: 'numeric' });
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center m-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-white rounded-lg shadow-sm overflow-hidden m-4 border">
      {/* Sidebar */}
      <div className="w-80 border-l bg-gray-50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="بحث في المحادثات..." 
              className="pr-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? 'لا توجد نتائج' : 'لا توجد محادثات بعد'}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div 
                key={conv.email}
                onClick={() => setSelectedUser(conv)}
                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-100 transition-colors ${
                  selectedUser?.email === conv.email ? 'bg-blue-50' : ''
                }`}
              >
                <Avatar>
                  <AvatarFallback className="bg-green-600 text-white">
                    {conv.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-medium truncate">{conv.name}</h3>
                    <span className="text-xs text-gray-500">{conv.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    {conv.unread}
                  </span>
                )}
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedUser ? (
          <ChatInterface 
            receiverEmail={selectedUser.email}
            onClose={() => setSelectedUser(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
            <Search className="w-16 h-16 mb-4 opacity-20" />
            <p>اختر محادثة للبدء</p>
          </div>
        )}
      </div>
    </div>
  );
}