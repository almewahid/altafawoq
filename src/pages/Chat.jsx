import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Send, 
  Search, 
  Paperclip, 
  Users,
  MessageCircle,
  Bell,
  Upload
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function ChatPage() {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: chatMessages = [], isLoading } = useQuery({
    queryKey: ['chatMessages', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const sent = await base44.entities.ChatMessage.filter({ sender_email: user.email });
      const received = await base44.entities.ChatMessage.filter({ receiver_email: user.email });
      return [...sent, ...received].sort((a, b) => 
        new Date(a.created_date) - new Date(b.created_date)
      );
    },
    enabled: !!user?.email,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time effect
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['chatMessages']);
      setMessageText("");
      setFileUrl("");
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.ChatMessage.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['chatMessages']);
    },
  });

  // Group messages by conversation
  const conversations = React.useMemo(() => {
    const convMap = new Map();
    
    chatMessages.forEach(msg => {
      const otherEmail = msg.sender_email === user?.email 
        ? msg.receiver_email 
        : msg.sender_email;
      
      if (!convMap.has(otherEmail)) {
        convMap.set(otherEmail, {
          email: otherEmail,
          messages: [],
          unreadCount: 0,
          lastMessage: null
        });
      }
      
      const conv = convMap.get(otherEmail);
      conv.messages.push(msg);
      
      if (!msg.is_read && msg.receiver_email === user?.email) {
        conv.unreadCount++;
      }
      
      if (!conv.lastMessage || new Date(msg.created_date) > new Date(conv.lastMessage.created_date)) {
        conv.lastMessage = msg;
      }
    });
    
    return Array.from(convMap.values()).sort((a, b) => 
      new Date(b.lastMessage?.created_date || 0) - new Date(a.lastMessage?.created_date || 0)
    );
  }, [chatMessages, user?.email]);

  const currentMessages = selectedConversation 
    ? conversations.find(c => c.email === selectedConversation)?.messages || []
    : [];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentMessages]);

  useEffect(() => {
    // Mark messages as read when conversation is selected
    if (selectedConversation) {
      currentMessages.forEach(msg => {
        if (!msg.is_read && msg.receiver_email === user?.email) {
          markAsReadMutation.mutate(msg.id);
        }
      });
    }
  }, [selectedConversation, currentMessages]);

  const handleSendMessage = () => {
    if (!messageText.trim() && !fileUrl) return;

    sendMessageMutation.mutate({
      sender_email: user?.email,
      receiver_email: selectedConversation,
      message: messageText,
      file_url: fileUrl || undefined,
      is_read: false
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    const result = await base44.integrations.Core.UploadFile({ file });
    setFileUrl(result.file_url);
    setUploadingFile(false);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">الدردشة المباشرة</h1>
            <p className="text-gray-600 flex items-center gap-2">
              تواصل مع الطلاب والمعلمين فوراً
              {totalUnread > 0 && (
                <Badge className="bg-red-500">
                  <Bell className="w-3 h-3 ml-1" />
                  {totalUnread} جديد
                </Badge>
              )}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg h-[700px] flex flex-col">
              <CardHeader className="pb-3">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="بحث في المحادثات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-600">لا توجد محادثات</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredConversations.map((conv) => (
                      <div
                        key={conv.email}
                        onClick={() => setSelectedConversation(conv.email)}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedConversation === conv.email
                            ? 'bg-green-50'
                            : 'hover:bg-gray-50'
                        } ${conv.unreadCount > 0 ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                              {conv.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-sm truncate">
                                {conv.email.split('@')[0]}
                              </span>
                              {conv.unreadCount > 0 && (
                                <Badge className="bg-red-500 text-white h-5 w-5 flex items-center justify-center p-0 text-xs">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mb-1">
                              {conv.lastMessage && format(new Date(conv.lastMessage.created_date), 'HH:mm', { locale: ar })}
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {conv.lastMessage?.message || ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg h-[700px] flex flex-col">
              {!selectedConversation ? (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">اختر محادثة للبدء</p>
                  </div>
                </CardContent>
              ) : (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                          {selectedConversation.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-lg">{selectedConversation.split('@')[0]}</h3>
                        <p className="text-xs text-gray-500">{selectedConversation}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                    {currentMessages.map((msg) => {
                      const isSent = msg.sender_email === user?.email;
                      return (
                        <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isSent ? 'order-2' : 'order-1'}`}>
                            <div className={`rounded-2xl px-4 py-3 ${
                              isSent 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                              {msg.file_url && (
                                <a 
                                  href={msg.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={`text-xs mt-2 flex items-center gap-1 ${
                                    isSent ? 'text-white/90' : 'text-blue-600'
                                  }`}
                                >
                                  <Paperclip className="w-3 h-3" />
                                  ملف مرفق
                                </a>
                              )}
                            </div>
                            <p className={`text-xs text-gray-500 mt-1 ${isSent ? 'text-left' : 'text-right'}`}>
                              {format(new Date(msg.created_date), 'HH:mm', { locale: ar })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </CardContent>

                  <div className="border-t p-4">
                    <div className="space-y-3">
                      {fileUrl && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                          <Paperclip className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-700 flex-1">تم إرفاق ملف</span>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setFileUrl("")}
                          >
                            حذف
                          </Button>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Textarea
                            placeholder="اكتب رسالتك هنا..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            rows={2}
                            className="resize-none pr-12"
                          />
                          <label className="absolute left-3 top-3 cursor-pointer">
                            <input
                              type="file"
                              onChange={handleFileUpload}
                              className="hidden"
                              disabled={uploadingFile}
                            />
                            <Paperclip className={`w-5 h-5 ${uploadingFile ? 'text-gray-300' : 'text-gray-500 hover:text-gray-700'}`} />
                          </label>
                        </div>
                        
                        <Button 
                          onClick={handleSendMessage}
                          disabled={(!messageText.trim() && !fileUrl) || sendMessageMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 px-6"
                        >
                          <Send className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}