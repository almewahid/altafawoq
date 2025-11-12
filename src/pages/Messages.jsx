import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, MessageSquare, Search, Mail, MailOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const sent = await base44.entities.Message.filter({ sender_email: user.email });
      const received = await base44.entities.Message.filter({ receiver_email: user.email });
      return [...sent, ...received].sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
    },
    enabled: !!user?.email,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
      setReplyText("");
      setSelectedMessage(null);
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Message.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
    },
  });

  const handleSelectMessage = (message) => {
    setSelectedMessage(message);
    if (!message.is_read && message.receiver_email === user?.email) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const handleReply = () => {
    if (!replyText.trim() || !selectedMessage) return;

    sendMessageMutation.mutate({
      sender_email: user?.email,
      receiver_email: selectedMessage.sender_email === user?.email 
        ? selectedMessage.receiver_email 
        : selectedMessage.sender_email,
      subject: `رد: ${selectedMessage.subject || 'رسالة'}`,
      content: replyText,
      is_read: false
    });
  };

  const filteredMessages = messages.filter(msg => {
    const otherEmail = msg.sender_email === user?.email ? msg.receiver_email : msg.sender_email;
    return otherEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (msg.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
           (msg.content || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const unreadCount = messages.filter(m => !m.is_read && m.receiver_email === user?.email).length;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">الرسائل</h1>
            <p className="text-gray-600">
              تواصل مع الطلاب والمعلمين
              {unreadCount > 0 && (
                <Badge className="mr-2 bg-red-500">{unreadCount} جديد</Badge>
              )}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="بحث في الرسائل..."
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
                ) : filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-600">لا توجد رسائل</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredMessages.map((message) => {
                      const isReceived = message.receiver_email === user?.email;
                      const otherEmail = isReceived ? message.sender_email : message.receiver_email;
                      const isUnread = !message.is_read && isReceived;

                      return (
                        <div
                          key={message.id}
                          onClick={() => handleSelectMessage(message)}
                          className={`p-4 cursor-pointer transition-colors ${
                            selectedMessage?.id === message.id
                              ? 'bg-green-50'
                              : 'hover:bg-gray-50'
                          } ${isUnread ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-sm">
                                {otherEmail.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm truncate">
                                  {otherEmail.split('@')[0]}
                                </span>
                                {isUnread && (
                                  <Mail className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mb-1">
                                {format(new Date(message.created_date), 'dd MMM', { locale: ar })}
                              </p>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Message Details */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg h-[600px] flex flex-col">
              {!selectedMessage ? (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">اختر رسالة لعرض التفاصيل</p>
                  </div>
                </CardContent>
              ) : (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">
                          {(selectedMessage.sender_email === user?.email 
                            ? selectedMessage.receiver_email 
                            : selectedMessage.sender_email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">
                          {selectedMessage.sender_email === user?.email 
                            ? selectedMessage.receiver_email 
                            : selectedMessage.sender_email}
                        </h3>
                        {selectedMessage.subject && (
                          <p className="text-sm text-gray-600 mb-1">
                            الموضوع: {selectedMessage.subject}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {format(new Date(selectedMessage.created_date), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                        </p>
                      </div>
                      {selectedMessage.is_read ? (
                        <MailOpen className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Mail className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 overflow-y-auto p-6">
                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedMessage.content}
                      </p>
                    </div>
                  </CardContent>

                  <div className="border-t p-4">
                    <div className="space-y-3">
                      <Textarea
                        placeholder="اكتب ردك هنا..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleReply}
                          disabled={!replyText.trim() || sendMessageMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Send className="w-4 h-4 ml-2" />
                          {sendMessageMutation.isPending ? "جاري الإرسال..." : "إرسال"}
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