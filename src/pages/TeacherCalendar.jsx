import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/components/SupabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function TeacherCalendar() {
  const { data: sessions = [] } = useQuery({
    queryKey: ['teacherSessions'],
    queryFn: async () => {
      const user = await supabase.auth.getCurrentUserWithProfile();
      if (!user) return [];
      // Mock data
      return [
        { id: 1, title: "مراجعة رياضيات", date: new Date(), time: "10:00", group: "مجموعة أستاذي" },
        { id: 2, title: "فيزياء متقدمة", date: new Date(Date.now() + 86400000), time: "14:30", group: "الصف الثاني عشر" },
      ];
    }
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">جدول الحصص</h1>
      
      <div className="space-y-4">
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{session.title}</h3>
                  <p className="text-gray-500">{session.group}</p>
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
        ))}
      </div>
    </div>
  );
}