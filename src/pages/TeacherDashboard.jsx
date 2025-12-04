import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/components/SupabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, DollarSign, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TeacherDashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => supabase.auth.getCurrentUserWithProfile(),
  });

  const { data: stats } = useQuery({
    queryKey: ['teacherStats', user?.email],
    queryFn: async () => {
      // Mock stats for now
      return [
        { title: "الطلاب النشطين", value: "45", icon: Users, color: "text-blue-600" },
        { title: "المجموعات", value: "8", icon: BookOpen, color: "text-green-600" },
        { title: "الأرباح هذا الشهر", value: "850 د.ك", icon: DollarSign, color: "text-yellow-600" },
        { title: "حصص قادمة", value: "12", icon: Calendar, color: "text-purple-600" },
      ];
    },
    enabled: !!user?.email
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المعلم</h1>
        <p className="text-gray-500">مرحباً بك، {user?.full_name}</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {stats?.map((stat, index) => (
          <Card key={index} className="shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-full bg-gray-50 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات الأرباح</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[{name: 'يناير', value: 400}, {name: 'فبراير', value: 600}, {name: 'مارس', value: 850}]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الحصص القادمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-10">
              لا توجد حصص مجدولة لليوم
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}