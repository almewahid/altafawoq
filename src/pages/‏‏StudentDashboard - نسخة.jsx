import React, { useState } from "react";
import { supabase } from "@/components/SupabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  BookOpen,
  Calendar,
  TrendingUp,
  FileText,
  Award,
  Clock,
  Users,
  CheckCircle2,
  Target,
  Plus,
  Edit,
  Trash2,
  Bell,
  MessageCircle,
  Video
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: "",
    description: "",
    category: "academic",
    target_date: "",
    progress_percentage: 0
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => supabase.auth.getCurrentUserWithProfile(),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['studentEnrollments', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_email', user.email);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.email,
  });

  const { data: allGroups = [] } = useQuery({
    queryKey: ['allGroups'],
    queryFn: async () => {
      const { data, error } = await supabase.from('study_groups').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['studentAssignments'],
    queryFn: async () => {
      if (!user?.email) return [];
      const groupIds = enrollments.map(e => e.group_id);
      if (groupIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .order('created_date', { ascending: false });
        
      if (error) throw error;
      return data.filter(a => groupIds.includes(a.group_id));
    },
    enabled: !!user?.email && enrollments.length > 0,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['studentSubmissions', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_email', user.email);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.email,
  });

  const { data: personalGoals = [] } = useQuery({
    queryKey: ['personalGoals', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from('personal_goals')
        .select('*')
        .eq('student_email', user.email);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.email,
  });

  const { data: learningObjectives = [] } = useQuery({
    queryKey: ['learningObjectives', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase.from('learning_objectives').select('*');
      if (error) throw error;
      
      return data.filter(obj => 
        obj.student_email === user?.email || 
        enrollments.some(e => e.group_id === obj.group_id && !obj.student_email)
      );
    },
    enabled: !!user?.email && enrollments.length > 0,
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['studentAnnouncements'],
    queryFn: async () => {
      if (!user?.email) return [];
      const groupIds = enrollments.map(e => e.group_id);
      if (groupIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_date', { ascending: false });
      if (error) throw error;

      return data.filter(a => 
        groupIds.includes(a.group_id) && 
        (!a.student_email || a.student_email === user?.email)
      ).slice(0, 5);
    },
    enabled: !!user?.email && enrollments.length > 0,
  });

  const { data: upcomingSessions = [] } = useQuery({
    queryKey: ['upcomingSessions'],
    queryFn: async () => {
      if (!user?.email) return [];
      const groupIds = enrollments.map(e => e.group_id);
      if (groupIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('video_sessions')
        .select('*')
        .order('scheduled_date', { ascending: false });
      if (error) throw error;

      return data.filter(s => {
        if (!groupIds.includes(s.group_id)) return false;
        if (s.status !== 'scheduled') return false;
        
        const sessionDate = new Date(`${s.scheduled_date}T${s.scheduled_time}`);
        return sessionDate > new Date();
      }).slice(0, 3);
    },
    enabled: !!user?.email && enrollments.length > 0,
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data) => {
      const { data: newGoal, error } = await supabase
        .from('personal_goals')
        .insert([{
          ...data,
          student_email: user?.email,
          status: 'active'
        }])
        .select();
      if (error) throw error;
      return newGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['personalGoals']);
      setShowGoalDialog(false);
      setGoalForm({
        title: "",
        description: "",
        category: "academic",
        target_date: "",
        progress_percentage: 0
      });
    },
  });

  const updateGoalProgressMutation = useMutation({
    mutationFn: async ({ id, progress }) => {
      const { data: updated, error } = await supabase
        .from('personal_goals')
        .update({ 
          progress_percentage: progress,
          status: progress >= 100 ? 'completed' : 'active'
        })
        .eq('id', id)
        .select();
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['personalGoals']);
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('personal_goals')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['personalGoals']);
    },
  });

  const enrolledGroups = allGroups.filter(g => 
    enrollments.some(e => e.group_id === g.id && e.status === 'active')
  );

  const activeEnrollments = enrollments.filter(e => e.status === 'active');
  const completedEnrollments = enrollments.filter(e => e.status === 'completed');
  
  const pendingAssignments = assignments.filter(a => 
    !submissions.some(s => s.assignment_id === a.id)
  );

  const averageProgress = activeEnrollments.length > 0
    ? activeEnrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / activeEnrollments.length
    : 0;

  // Data for charts
  const progressData = activeEnrollments.map(e => {
    const group = allGroups.find(g => g.id === e.group_id);
    return {
      name: group?.name?.substring(0, 15) || 'مجموعة',
      progress: e.progress_percentage || 0,
      attendance: Math.round((e.attendance_count / (e.total_sessions || 1)) * 100)
    };
  });

  const subjectDistribution = enrolledGroups.reduce((acc, group) => {
    const existing = acc.find(item => item.name === group.subject);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: group.subject, value: 1 });
    }
    return acc;
  }, []);

  const stats = [
    {
      title: "المجموعات النشطة",
      value: activeEnrollments.length,
      icon: Users,
      color: "blue",
      description: `${completedEnrollments.length} مكتملة`
    },
    {
      title: "الواجبات المعلقة",
      value: pendingAssignments.length,
      icon: FileText,
      color: "orange",
      description: `${submissions.length} مسلمة`
    },
    {
      title: "معدل التقدم",
      value: `${averageProgress.toFixed(0)}%`,
      icon: TrendingUp,
      color: "green",
      description: "عبر جميع المجموعات"
    },
    {
      title: "إجمالي الحصص",
      value: activeEnrollments.reduce((sum, e) => sum + (e.attendance_count || 0), 0),
      icon: Calendar,
      color: "purple",
      description: "حضرتها"
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            مرحباً، {user?.full_name}
          </h1>
          <p className="text-sm md:text-base text-gray-600">إليك نظرة عامة على تقدمك الدراسي</p>
          
          {/* Progress Tracking Link */}
          <Button
            onClick={() => navigate(createPageUrl("StudentProgress"))}
            className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <TrendingUp className="w-4 h-4 ml-2" />
            عرض تقدمي التفصيلي
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className={`flex items-start justify-between mb-4`}>
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

        {/* Announcements Section */}
        {announcements.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Bell className="w-6 h-6 text-orange-600" />
                الإعلانات الأخيرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <div 
                    key={announcement.id} 
                    className={`p-4 rounded-lg border ${
                      announcement.is_urgent 
                        ? 'bg-red-50 border-red-200' 
                        : announcement.type === 'resource'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                      <div className="flex gap-1">
                        {announcement.is_urgent && (
                          <Badge variant="destructive">عاجل</Badge>
                        )}
                        <Badge variant="secondary">
                          {announcement.type === 'announcement' ? 'إعلان' : 
                           announcement.type === 'resource' ? 'مورد' : 'تذكير'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{announcement.content}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(announcement.created_date), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Video Sessions */}
        {upcomingSessions.length > 0 && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-cyan-50 border-r-4 border-r-blue-500">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Video className="w-6 h-6 text-blue-600" />
                الجلسات المباشرة القادمة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingSessions.map((videoSession) => {
                  const group = allGroups.find(g => g.id === videoSession.group_id);
                  const sessionDate = new Date(`${videoSession.scheduled_date}T${videoSession.scheduled_time}`);
                  const timeUntil = Math.ceil((sessionDate - new Date()) / (1000 * 60));
                  const canJoin = timeUntil <= 15; // Can join 15 min before
                  
                  return (
                    <div key={videoSession.id} className="p-4 bg-white rounded-lg border border-blue-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{videoSession.title}</h4>
                          <p className="text-sm text-gray-600">{group?.name}</p>
                        </div>
                        {timeUntil < 60 && timeUntil > 0 && !canJoin && (
                          <Badge className="bg-orange-600">
                            خلال {timeUntil} دقيقة
                          </Badge>
                        )}
                        {canJoin && (
                          <Badge className="bg-green-600 animate-pulse">
                            متاحة الآن
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          {sessionDate.toLocaleDateString('ar-SA')} - {videoSession.scheduled_time}
                        </p>
                        {canJoin ? (
                          <Button 
                            size="sm"
                            onClick={() => navigate(createPageUrl("VideoSession") + `?id=${videoSession.id}`)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Video className="w-4 h-4 ml-1" />
                            انضم الآن
                          </Button>
                        ) : (
                          <Button 
                            size="sm"
                            variant="outline"
                            disabled
                          >
                            قريباً
                          </Button>
                        )}
                      </div>

                      {videoSession.meeting_url && canJoin && (
                        <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                          <p className="text-blue-900 mb-1">رابط الانضمام المباشر:</p>
                          <a 
                            href={videoSession.meeting_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                          >
                            {videoSession.meeting_url}
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Progress Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">التقدم في المجموعات</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="progress" fill="#10b981" name="التقدم %" />
                  <Bar dataKey="attendance" fill="#3b82f6" name="الحضور %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Subject Distribution */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">توزيع المواد</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={subjectDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {subjectDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Learning Objectives & Personal Goals */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Learning Objectives from Teachers */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Target className="w-6 h-6 text-blue-600" />
                الأهداف التعليمية
              </CardTitle>
            </CardHeader>
            <CardContent>
              {learningObjectives.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">لم يتم تعيين أهداف تعليمية بعد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {learningObjectives.map((objective) => (
                    <div key={objective.id} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{objective.title}</h4>
                        <Badge variant={objective.status === 'completed' ? 'default' : 'secondary'}>
                          {objective.status === 'completed' ? 'مكتمل' : objective.status === 'in_progress' ? 'جاري' : 'لم يبدأ'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{objective.description}</p>
                      <Progress value={objective.progress_percentage || 0} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        {objective.progress_percentage || 0}% مكتمل
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Goals */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-green-600" />
                  أهدافي الشخصية
                </span>
                <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 ml-1" />
                      هدف جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة هدف شخصي جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>عنوان الهدف</Label>
                        <Input
                          value={goalForm.title}
                          onChange={(e) => setGoalForm({...goalForm, title: e.target.value})}
                          placeholder="مثال: الحصول على درجة 95+ في الرياضيات"
                        />
                      </div>
                      <div>
                        <Label>الوصف</Label>
                        <Textarea
                          value={goalForm.description}
                          onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
                          placeholder="وصف تفصيلي للهدف..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>نوع الهدف</Label>
                        <Select value={goalForm.category} onValueChange={(value) => setGoalForm({...goalForm, category: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="academic">أكاديمي</SelectItem>
                            <SelectItem value="skill">مهارة</SelectItem>
                            <SelectItem value="personal">شخصي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>تاريخ الإنجاز المستهدف</Label>
                        <Input
                          type="date"
                          value={goalForm.target_date}
                          onChange={(e) => setGoalForm({...goalForm, target_date: e.target.value})}
                        />
                      </div>
                      <Button 
                        onClick={() => createGoalMutation.mutate(goalForm)}
                        disabled={!goalForm.title || createGoalMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {createGoalMutation.isPending ? "جاري الحفظ..." : "حفظ الهدف"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {personalGoals.filter(g => g.status === 'active').length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm mb-4">ابدأ بتحديد أهدافك الشخصية</p>
                  <Button 
                    size="sm"
                    onClick={() => setShowGoalDialog(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    إضافة هدف
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {personalGoals.filter(g => g.status === 'active').map((goal) => (
                    <div key={goal.id} className="p-4 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                          <Badge variant="secondary" className="mt-1">
                            {goal.category === 'academic' ? 'أكاديمي' : goal.category === 'skill' ? 'مهارة' : 'شخصي'}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("هل أنت متأكد من حذف هذا الهدف؟")) {
                              deleteGoalMutation.mutate(goal.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">التقدم</span>
                          <span className="font-semibold">{goal.progress_percentage}%</span>
                        </div>
                        <Progress value={goal.progress_percentage || 0} className="h-2" />
                        
                        <Input
                          type="range"
                          min="0"
                          max="100"
                          value={goal.progress_percentage || 0}
                          onChange={(e) => updateGoalProgressMutation.mutate({
                            id: goal.id,
                            progress: parseInt(e.target.value)
                          })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card 
            className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => navigate(createPageUrl("Browse"))}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">تصفح المعلمين</h3>
              <p className="text-sm text-gray-600 mb-4">
                ابحث عن معلمين جدد وانضم لمجموعات دراسية
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                تصفح الآن
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => navigate(createPageUrl("StudentAssignments"))}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">الواجبات</h3>
              <p className="text-sm text-gray-600 mb-4">
                اطلع على واجباتك وقم بتسليمها
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                عرض الواجبات
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => navigate(createPageUrl("Chat"))}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">الدردشة</h3>
              <p className="text-sm text-gray-600 mb-4">
                تواصل مع معلميك مباشرة
              </p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                فتح الدردشة
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Groups */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center justify-between">
              <span>مجموعاتي النشطة</span>
              <Badge>{enrolledGroups.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrolledGroups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">لم تنضم لأي مجموعة بعد</p>
                <Button 
                  onClick={() => navigate(createPageUrl("Browse"))}
                  className="bg-green-600 hover:bg-green-700"
                >
                  تصفح المجموعات
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {enrolledGroups.map((group) => {
                  const enrollment = enrollments.find(e => e.group_id === group.id);
                  return (
                    <div key={group.id} className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">{group.name}</h4>
                          <p className="text-sm text-gray-600">
                            {group.subject} - {group.stage}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {enrollment?.status === 'active' ? 'نشط' : 'مكتمل'}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">التقدم</span>
                          <span className="font-semibold">{enrollment?.progress_percentage || 0}%</span>
                        </div>
                        <Progress value={enrollment?.progress_percentage || 0} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          الحضور: {enrollment?.attendance_count || 0}/{enrollment?.total_sessions || 0}
                        </span>
                        <span>{group.price_per_session} د.ك/حصة</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Assignments */}
        {pendingAssignments.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-red-600" />
                  واجبات مستحقة قريباً
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate(createPageUrl("StudentAssignments"))}
                >
                  عرض الكل
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingAssignments.slice(0, 3).map((assignment) => {
                  const group = allGroups.find(g => g.id === assignment.group_id);
                  const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
                  const isOverdue = dueDate && dueDate < new Date();
                  return (
                    <div 
                      key={assignment.id} 
                      className={`p-4 rounded-lg border ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
                        {isOverdue && <Badge variant="destructive">متأخر</Badge>}
                        {!isOverdue && <Badge variant="secondary">مطلوب</Badge>}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        المجموعة: {group?.name || 'غير معروف'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          الموعد النهائي: {dueDate ? format(dueDate, 'dd MMMM yyyy', { locale: ar }) : 'غير محدد'}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(createPageUrl("StudentAssignments"))}
                        >
                          إرسال
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="w-6 h-6 text-gray-600" />
              النشاط الأخير
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Placeholder for recent activity items */}
            <div className="text-center py-8 text-gray-500">
              <p>لا يوجد نشاط حديث لعرضه.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}