import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/components/SupabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function StudentCalendar() {
  const { data: sessions = [] } = useQuery({
    queryKey: ['studentSessions'],
    queryFn: async () => {
      const user = await supabase.auth.getCurrentUserWithProfile();
      if (!user) return [];
      // Mock data
      return [
        { id: 1, title: "درس لغة عربية", date: new Date(), time: "16:00", teacher: "أ. محمد" },
      ];
    }
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">جدولي الدراسي</h1>
      
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">لا توجد حصص قادمة</div>
        ) : (
          sessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg text-green-600">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{session.title}</h3>
                    <p className="text-gray-500">{session.teacher}</p>
                  </div>
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg">{format(session.date, 'EEEE dd MMMM', { locale: ar })}</div>
                  <div className="text-gray-500 flex items-center justify-end gap-1">
                    <Clock className="w-4 h-4" />
                    {session.time}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}