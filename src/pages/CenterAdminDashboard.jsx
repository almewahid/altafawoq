import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Building2,
  Users,
  GraduationCap,
  DollarSign,
  TrendingUp,
  Calendar,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CenterAdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: centerProfile } = useQuery({
    queryKey: ['centerProfile', user?.email],
    queryFn: async () => {
      const centers = await base44.entities.EducationalCenter.filter({ user_email: user?.email });
      return centers[0];
    },
    enabled: !!user?.email,
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['centerTeachers', centerProfile?.id],
    queryFn: async () => {
      const allUsers = await base44.entities.User.list();
      return allUsers.filter(u => u.user_type === 'teacher' && u.center_id === centerProfile?.id);
    },
    enabled: !!centerProfile?.id,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['centerStudents', centerProfile?.id],
    queryFn: async () => {
      const allEnrollments = await base44.entities.Enrollment.list();
      const teacherEmails = teachers.map(t => t.email);
      const centerEnrollments = allEnrollments.filter(e => teacherEmails.includes(e.teacher_email));
      return [...new Set(centerEnrollments.map(e => e.student_email))];
    },
    enabled: teachers.length > 0,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['centerGroups'],
    queryFn: async () => {
      const teacherEmails = teachers.map(t => t.email);
      if (teacherEmails.length === 0) return [];
      const allGroups = await base44.entities.StudyGroup.list();
      return allGroups.filter(g => teacherEmails.includes(g.teacher_email));
    },
    enabled: teachers.length > 0,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['centerEnrollments'],
    queryFn: async () => {
      const teacherEmails = teachers.map(t => t.email);
      if (teacherEmails.length === 0) return [];
      const allEnrollments = await base44.entities.Enrollment.list();
      return allEnrollments.filter(e => teacherEmails.includes(e.teacher_email));
    },
    enabled: teachers.length > 0,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['centerPayments'],
    queryFn: async () => {
      const teacherEmails = teachers.map(t => t.email);
      if (teacherEmails.length === 0) return [];
      const allPayments = await base44.entities.Payment.list();
      return allPayments.filter(p => teacherEmails.includes(p.teacher_email) && p.status === 'completed');
    },
    enabled: teachers.length > 0,
  });

  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const activeEnrollments = enrollments.filter(e => e.status === 'active').length;
  const activeGroups = groups.filter(g => g.status === 'active').length;

  // Monthly revenue data
  const monthlyData = payments.reduce((acc, payment) => {
    const month = new Date(payment.created_date).toLocaleDateString('ar-SA', { month: 'short' });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.revenue += payment.amount || 0;
    } else {
      acc.push({ month, revenue: payment.amount || 0 });
    }
    return acc;
  }, []);

  const stats = [
    {
      title: "المعلمون",
      value: teachers.length,
      icon: GraduationCap,
      color: "blue",
      description: "معلمين نشطين"
    },
    {
      title: "الطلاب",
      value: students.length,
      icon: Users,
      color: "green",
      description: "طلاب مسجلين"
    },
    {
      title: "المجموعات",
      value: activeGroups,
      icon: BookOpen,
      color: "purple",
      description: `${groups.length} إجمالي`
    },
    {
      title: "الإيرادات",
      value: `${totalRevenue.toFixed(1)} د.ك`,
      icon: DollarSign,
      color: "orange",
      description: "هذا الشهر"
    },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            لوحة تحكم المركز
          </h1>
          <p className="text-gray-600">
            {centerProfile?.name || 'مركز التفوق التعليمي'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                  </div>
                  <h3 className="text-sm text-gray-600 mb-2">{stat.title}</h3>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>الإيرادات الشهرية</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" name="الإيرادات (د.ك)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>التسجيلات حسب المجموعة</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={groups.slice(0, 5).map(g => ({
                  name: g.name?.substring(0, 15) || 'مجموعة',
                  students: g.students?.length || 0
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students" fill="#3b82f6" name="عدد الطلاب" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="teachers" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="teachers">المعلمون ({teachers.length})</TabsTrigger>
            <TabsTrigger value="groups">المجموعات ({groups.length})</TabsTrigger>
            <TabsTrigger value="students">الطلاب ({students.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="teachers">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>المعلمون</CardTitle>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة معلم
                </Button>
              </CardHeader>
              <CardContent>
                {teachers.length === 0 ? (
                  <div className="text-center py-8">
                    <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">لا يوجد معلمون مسجلون بعد</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>البريد الإلكتروني</TableHead>
                        <TableHead>المجموعات</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teachers.map((teacher) => {
                        const teacherGroups = groups.filter(g => g.teacher_email === teacher.email);
                        return (
                          <TableRow key={teacher.id}>
                            <TableCell className="font-medium">{teacher.full_name}</TableCell>
                            <TableCell>{teacher.email}</TableCell>
                            <TableCell>{teacherGroups.length}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>المجموعات الدراسية</CardTitle>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء مجموعة
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {groups.map((group) => (
                    <div key={group.id} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{group.name}</h4>
                        <p className="text-sm text-gray-600">
                          {group.subject} - {group.stage}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={group.status === 'active' ? 'default' : 'secondary'}>
                          {group.status === 'active' ? 'نشط' : 'غير نشط'}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {group.students?.length || 0}/{group.max_students} طالب
                        </span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>الطلاب المسجلون</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">{students.length} طالب مسجل في المركز</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}