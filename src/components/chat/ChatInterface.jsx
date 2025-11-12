import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Paperclip, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function ChatInterface({ receiverEmail, groupId, onClose }) {
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chatMessages', receiverEmail, groupId],
    queryFn: async () => {
      if (groupId) {
        return await base44.entities.ChatMessage.filter({ group_id: groupId }, '-created_date', 100);
      } else if (receiverEmail) {
        const sent = await base44.entities.ChatMessage.filter({ 
          sender_email: user?.email, 
          receiver_email: receiverEmail 
        });
        const received = await base44.entities.ChatMessage.filter({ 
          sender_email: receiverEmail,
          receiver_email: user?.email 
        });
        return [...sent, ...received].sort((a, b) => 
          new Date(a.created_date) - new Date(b.created_date)
        );
      }
      return [];
    },
    enabled: !!user?.email && (!!receiverEmail || !!groupId),
    refetchInterval: 5000, // Refetch every 5 seconds for real-time effect
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['chatMessages']);
      setMessageText("");
      
      // Create notification for receiver
      if (receiverEmail) {
        base44.entities.Notification.create({
          user_email: receiverEmail,
          title: "رسالة جديدة",
          message: `رسالة جديدة من ${user?.full_name}`,
          type: "message",
          link: "",
          is_read: false
        });
      }
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    const result = await base44.integrations.Core.UploadFile({ file });
    
    sendMessageMutation.mutate({
      sender_email: user?.email,
      receiver_email: receiverEmail,
      group_id: groupId,
      message: `تم إرسال ملف: ${file.name}`,
      message_type: "file",
      file_url: result.file_url,
      file_name: file.name,
      is_read: false
    });
    
    setUploadingFile(false);
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    sendMessageMutation.mutate({
      sender_email: user?.email,
      receiver_email: receiverEmail,
      group_id: groupId,
      message: messageText,
      message_type: "text",
      is_read: false
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-xl border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
            <span className="font-bold">
              {receiverEmail ? receiverEmail.charAt(0).toUpperCase() : <Users className="w-5 h-5" />}
            </span>
          </div>
          <div>
            <h3 className="font-bold">
              {groupId ? 'محادثة المجموعة' : receiverEmail?.split('@')[0]}
            </h3>
            <p className="text-xs text-white/80">
              {messages.length} رسالة
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            ابدأ المحادثة الآن
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isSent = msg.sender_email === user?.email;
              return (
                <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isSent ? 'order-2' : 'order-1'}`}>
                    {msg.message_type === 'announcement' && (
                      <Badge className="mb-1 bg-blue-600">إعلان</Badge>
                    )}
                    <div className={`rounded-2xl p-3 ${
                      isSent 
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' 
                        : 'bg-white border border-gray-200'
                    }`}>
                      {msg.message_type === 'file' ? (
                        <div>
                          <p className={`text-sm mb-2 ${isSent ? 'text-white' : 'text-gray-700'}`}>
                            {msg.message}
                          </p>
                          <a 
                            href={msg.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`text-xs underline flex items-center gap-1 ${
                              isSent ? 'text-white/90' : 'text-blue-600'
                            }`}
                          >
                            <Paperclip className="w-3 h-3" />
                            {msg.file_name}
                          </a>
                        </div>
                      ) : (
                        <p className={`${isSent ? 'text-white' : 'text-gray-700'}`}>
                          {msg.message}
                        </p>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${isSent ? 'text-left' : 'text-right'} text-gray-500`}>
                      {format(new Date(msg.created_date), 'HH:mm', { locale: ar })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white rounded-b-lg">
        <div className="flex items-end gap-2">
          <input
            type="file"
            id="file-upload"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploadingFile}
          />
          <label htmlFor="file-upload">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={uploadingFile}
              className="cursor-pointer"
              asChild
            >
              <span>
                <Paperclip className="w-5 h-5" />
              </span>
            </Button>
          </label>

          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="اكتب رسالتك..."
            className="flex-1"
            disabled={uploadingFile}
          />

          <Button 
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending || uploadingFile}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        {uploadingFile && (
          <p className="text-xs text-gray-600 mt-2">جاري رفع الملف...</p>
        )}
      </div>
    </div>
  );
}