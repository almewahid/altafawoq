import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/components/SupabaseClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Search } from "lucide-react";

export default function Messages() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => supabase.auth.getCurrentUserWithProfile(),
  });

  // Mock conversations for UI
  const conversations = [
    { id: 1, name: "أحمد محمد", lastMessage: "شكراً لك يا أستاذ", time: "10:30 ص", unread: 2 },
    { id: 2, name: "سارة علي", lastMessage: "متى موعد الحصة القادمة؟", time: "أمس", unread: 0 },
  ];

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    // Logic to send message
    setMessage("");
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-white rounded-lg shadow-sm overflow-hidden m-4 border">
      {/* Sidebar */}
      <div className="w-80 border-l bg-gray-50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="بحث في المحادثات..." className="pr-9" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {conversations.map((conv) => (
            <div 
              key={conv.id}
              onClick={() => setSelectedUser(conv)}
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-100 transition-colors ${selectedUser?.id === conv.id ? 'bg-blue-50' : ''}`}
            >
              <Avatar>
                <AvatarFallback>{conv.name[0]}</AvatarFallback>
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
          ))}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedUser ? (
          <>
            <div className="p-4 border-b flex items-center gap-3 bg-white shadow-sm z-10">
              <Avatar>
                <AvatarFallback>{selectedUser.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">{selectedUser.name}</h2>
                <p className="text-xs text-green-600">متصل الآن</p>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4 bg-gray-50/50">
              <div className="space-y-4">
                {/* Mock messages */}
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white p-3 rounded-l-lg rounded-tr-lg max-w-[70%]">
                    مرحباً، كيف يمكنني مساعدتك؟
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white border text-gray-800 p-3 rounded-r-lg rounded-tl-lg max-w-[70%]">
                    {selectedUser.lastMessage}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <form onSubmit={handleSend} className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <Input 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب رسالتك هنا..." 
                  className="flex-1"
                />
                <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
            <Send className="w-16 h-16 mb-4 opacity-20" />
            <p>اختر محادثة للبدء</p>
          </div>
        )}
      </div>
    </div>
  );
}