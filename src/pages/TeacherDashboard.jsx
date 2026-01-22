import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/components/SupabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, DollarSign, Calendar, Play, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const teacherImages = {
  dashboard: "https://res.cloudinary.com/dufjbywcm/image/upload/q_auto,f_auto,fl_lossy,w_150/v1769071653/Teacher_Control_Panel_ziohs0.png",
  students: "https://res.cloudinary.com/dufjbywcm/image/upload/q_auto,f_auto,fl_lossy,w_150/v1769071649/Active_students_fpw55h.png",
  groups: "https://res.cloudinary.com/dufjbywcm/image/upload/q_auto,f_auto,fl_lossy,w_150/v1769071652/Groups_wrpj91.png",
  wallet: "https://res.cloudinary.com/dufjbywcm/image/upload/q_auto,f_auto,fl_lossy,w_150/v1769071648/Wallet_loa5t7.png",
  schedule: "https://res.cloudinary.com/dufjbywcm/image/upload/q_auto,f_auto,fl_lossy,w_150/v1769071649/Class_schedule_njgnrk.png",
  chat: "https://res.cloudinary.com/dufjbywcm/image/upload/q_auto,f_auto,fl_lossy,w_150/v1769071649/Chatt_idgdog.png",
  coupon: "https://res.cloudinary.com/dufjbywcm/image/upload/q_auto,f_auto,fl_lossy,w_150/v1769071651/coupon_g0812k.png",
  myGroups: "https://res.cloudinary.com/dufjbywcm/image/upload/q_auto,f_auto,fl_lossy,w_150/v1769071651/My_groups_kewuov.png",
  nextClasses: "https://res.cloudinary.com/dufjbywcm/image/upload/q_auto,f_auto,fl_lossy,w_150/v1769071650/Next_classes_f5fqvn.png",
  monthlyProfits: "https://res.cloudinary.com/dufjbywcm/image/upload/q_auto,f_auto,fl_lossy,w_150/v1769071648/Monthly_profits_zulefg.png"
};

export default function TeacherDashboard() {
  const navigate = useNavigate();
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => supabase.auth.getCurrentUserWithProfile(),
  });

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['teacherDashboardData', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;

      const [groupsRes, walletRes, paymentsRes] = await Promise.all([
        supabase.from('study_groups').select('*').eq('teacher_email', user.email),
        supabase.from('wallets').select('*').eq('user_email', user.email).maybeSingle(),
        supabase.from('payments').select('*').eq('teacher_email', user.email)
      ]);

      const groups = groupsRes.data || [];
      const wallet = walletRes.data || { balance: 0, currency: 'KWD' };
      const payments = paymentsRes.data || [];

      const uniqueStudents = new Set();
      let weeklySessions = 0;
      
      groups.forEach(group => {
        if (group.students && Array.isArray(group.students)) {
          group.students.forEach(s => uniqueStudents.add(s));
        }
        if (group.schedule && Array.isArray(group.schedule)) {
          weeklySessions += group.schedule.length;
        }
      });

      const monthlyEarnings = {};
      payments.forEach(p => {
        if (p.created_date) {
          const date = new Date(p.created_date);
          const month = date.toLocaleString('ar-KW', { month: 'long' });
          monthlyEarnings[month] = (monthlyEarnings[month] || 0) + (p.amount || 0);
        }
      });

      const chartData = Object.entries(monthlyEarnings).map(([name, value]) => ({ name, value }));
      if (chartData.length === 0) {
        chartData.push({ name: 'الآن', value: 0 });
      }

      return {
        stats: [
          { title: "الطلاب النشطين", value: uniqueStudents.size.toString(), icon: Users, color: "text-blue-600 dark:text-blue-400" },
          { title: "المجموعات النشطة", value: groups.filter(g => g.status === 'active').length.toString(), icon: BookOpen, color: "text-green-600 dark:text-green-400" },
          { title: "الرصيد الحالي", value: `${wallet.balance} ${wallet.currency}`, icon: DollarSign, color: "text-yellow-600 dark:text-yellow-400" },
          { title: "حصص أسبوعياً", value: weeklySessions.toString(), icon: Calendar, color: "text-purple-600 dark:text-purple-400" },
        ],
        chartData,
        recentGroups: groups.slice(0, 5)
      };
    },
    enabled: !!user?.email
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Mobile Back Button */}
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm hover:bg-black hover:text-white mb-4"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            عودة
          </Button>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
              لوحة تحكم المعلم
            </h1>
            <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">مرحباً بك، {user?.full_name}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 md:gap-6">
          {dashboardData?.stats?.map((stat, index) => (
            <Card key={index} className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-0 shadow-xl rounded-3xl transition-colors duration-300">
              <CardContent className="p-4 md:p-6 flex items-center gap-4">
                <div className={`p-3 rounded-full bg-gray-50 dark:bg-slate-700 ${stat.color} transition-colors duration-300`}>
                  <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300 truncate">{stat.title}</p>
                  <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-0 shadow-xl rounded-3xl transition-colors duration-300">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white transition-colors duration-300">إحصائيات الأرباح</CardTitle>
            </CardHeader>
            <CardContent className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData?.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: 'none', 
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-0 shadow-xl rounded-3xl transition-colors duration-300">
            <CardHeader>
              <CardTitle className="flex justify-between items-center text-gray-900 dark:text-white transition-colors duration-300">
                <span>الحصص القادمة</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(createPageUrl("SessionTracking"))}
                  className="hover:bg-black hover:text-white dark:border-slate-600 transition-all text-xs md:text-sm"
                >
                  عرض الكل
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border dark:border-slate-600 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-gray-50 dark:bg-slate-700 transition-colors duration-300">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg text-purple-600 dark:text-purple-300 transition-colors duration-300">
                      <Play className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs md:text-sm text-gray-900 dark:text-white transition-colors duration-300">جلسة فورية</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">ابدأ جلسة جديدة الآن</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => navigate(createPageUrl("SessionTracking"))}
                    className="hover:bg-black w-full md:w-auto"
                  >
                    بدء
                  </Button>
                </div>
                
                <div className="p-4 border dark:border-slate-600 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white dark:bg-slate-800 transition-colors duration-300">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300 transition-colors duration-300">
                      <Clock className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs md:text-sm text-gray-900 dark:text-white transition-colors duration-300">مراجعة فيزياء</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">اليوم - 4:00 م</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="hover:bg-black hover:text-white w-full md:w-auto dark:bg-slate-700 dark:text-white transition-all"
                  >
                    انضمام
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}