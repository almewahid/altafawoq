import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  TrendingUp,
  Award,
  Target,
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function StudentProgressPage() {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['studentEnrollments', user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: allGroups = [] } = useQuery({
    queryKey: ['allGroups'],
    queryFn: () => base44.entities.StudyGroup.list(),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['studentAssignments'],
    queryFn: async () => {
      if (!user?.email) return [];
      const groupIds = enrollments.map(e => e.group_id);
      if (groupIds.length === 0) return [];
      
      const allAssignments = await base44.entities.Assignment.list('-created_date');
      return allAssignments.filter(a => groupIds.includes(a.group_id));
    },
    enabled: !!user?.email && enrollments.length > 0,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['studentSubmissions', user?.email],
    queryFn: () => base44.entities.AssignmentSubmission.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['studentAttendance', user?.email],
    queryFn: () => base44.entities.Attendance.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  // Calculate metrics
  const activeEnrollments = enrollments.filter(e => e.status === 'active');
  const completedEnrollments = enrollments.filter(e => e.status === 'completed');
  
  const totalAssignments = assignments.length;
  const submittedAssignments = submissions.length;
  const gradedSubmissions = submissions.filter(s => s.status === 'graded');
  
  const averageScore = gradedSubmissions.length > 0
    ? gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length
    : 0;

  const totalAttendance = attendance.filter(a => a.status === 'present').length;
  const totalSessions = attendance.length;
  const attendanceRate = totalSessions > 0 ? (totalAttendance / totalSessions) * 100 : 0;

  const overallProgress = activeEnrollments.length > 0
    ? activeEnrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / activeEnrollments.length
    : 0;

  // Progress by subject
  const progressBySubject = activeEnrollments.map(enrollment => {
    const group = allGroups.find(g => g.id === enrollment.group_id);
    return {
      name: group?.subject || 'مادة',
      progress: enrollment.progress_percentage || 0,
      attendance: Math.round((enrollment.attendance_count / (enrollment.total_sessions || 1)) * 100)
    };
  });

  // Assignment scores over time
  const assignmentScoresData = gradedSubmissions
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))
    .map((submission, index) => {
      const assignment = assignments.find(a => a.id === submission.assignment_id);
      return {
        name: `واجب ${index + 1}`,
        score: submission.score || 0,
        maxScore: assignment?.max_score || 100,
        percentage: ((submission.score || 0) / (assignment?.max_score || 100)) * 100,
        date: format(new Date(submission.submitted_at), 'dd/MM', { locale: ar })
      };
    });

  // Performance distribution
  const performanceDistribution = [
    {
      name: 'ممتاز (90-100)',
      value: gradedSubmissions.filter(s => {
        const assignment = assignments.find(a => a.id === s.assignment_id);
        const percentage = ((s.score || 0) / (assignment?.max_score || 100)) * 100;
        return percentage >= 90;
      }).length
    },
    {
      name: 'جيد جداً (80-89)',
      value: gradedSubmissions.filter(s => {
        const assignment = assignments.find(a => a.id === s.assignment_id);
        const percentage = ((s.score || 0) / (assignment?.max_score || 100)) * 100;
        return percentage >= 80 && percentage < 90;
      }).length
    },
    {
      name: 'جيد (70-79)',
      value: gradedSubmissions.filter(s => {
        const assignment = assignments.find(a => a.id === s.assignment_id);
        const percentage = ((s.score || 0) / (assignment?.max_score || 100)) * 100;
        return percentage >= 70 && percentage < 80;
      }).length
    },
    {
      name: 'مقبول (60-69)',
      value: gradedSubmissions.filter(s => {
        const assignment = assignments.find(a => a.id === s.assignment_id);
        const percentage = ((s.score || 0) / (assignment?.max_score || 100)) * 100;
        return percentage >= 60 && percentage < 70;
      }).length
    },
    {
      name: 'ضعيف (<60)',
      value: gradedSubmissions.filter(s => {
        const assignment = assignments.find(a => a.id === s.assignment_id);
        const percentage = ((s.score || 0) / (assignment?.max_score || 100)) * 100;
        return percentage < 60;
      }).length
    }
  ].filter(item => item.value > 0);

  // Radar chart data
  const radarData = activeEnrollments.map(enrollment => {
    const group = allGroups.find(g => g.id === enrollment.group_id);
    const groupAssignments = assignments.filter(a => a.group_id === enrollment.group_id);
    const groupSubmissions = submissions.filter(s => 
      groupAssignments.some(a => a.id === s.assignment_id)
    );
    const gradedCount = groupSubmissions.filter(s => s.status === 'graded').length;
    const avgScore = gradedCount > 0
      ? groupSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedCount
      : 0;

    return {
      subject: group?.subject || 'مادة',
      التقدم: enrollment.progress_percentage || 0,
      الحضور: Math.round((enrollment.attendance_count / (enrollment.total_sessions || 1)) * 100),
      الأداء: Math.min(avgScore, 100)
    };
  });

  // Completion timeline
  const completionTimeline = completedEnrollments.map(enrollment => {
    const group = allGroups.find(g => g.id === enrollment.group_id);
    return {
      name: group?.name || 'مجموعة',
      date: format(new Date(enrollment.updated_date), 'dd/MM/yyyy', { locale: ar }),
      progress: 100
    };
  });

  // Stats cards
  const stats = [
    {
      title: "المعدل العام",
      value: `${averageScore.toFixed(1)}%`,
      icon: Star,
      color: "yellow",
      change: "+5% من الشهر الماضي",
      trend: "up"
    },
    {
      title: "نسبة الإنجاز",
      value: `${overallProgress.toFixed(0)}%`,
      icon: Target,
      color: "blue",
      change: `${activeEnrollments.length} مجموعة نشطة`,
      trend: "up"
    },
    {
      title: "معدل الحضور",
      value: `${attendanceRate.toFixed(0)}%`,
      icon: Calendar,
      color: "green",
      change: `${totalAttendance}/${totalSessions} جلسة`,
      trend: "up"
    },
    {
      title: "الواجبات",
      value: `${submittedAssignments}/${totalAssignments}`,
      icon: BookOpen,
      color: "purple",
      change: `${totalAssignments - submittedAssignments} متبقية`,
      trend: submittedAssignments >= totalAssignments ? "up" : "down"
    }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">تقدمي الدراسي</h1>
              <p className="text-gray-600">تتبع شامل لأدائك وإنجازاتك</p>
            </div>
            <Button onClick={() => navigate(createPageUrl("StudentDashboard"))}>
              العودة للوحة
            </Button>
          </div>

          {/* Achievement Badge */}
          {averageScore >= 90 && (
            <Card className="border-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Award className="w-12 h-12" />
                  <div>
                    <h3 className="text-xl font-bold">إنجاز متميز!</h3>
                    <p className="text-yellow-50">معدلك يتجاوز 90% - استمر في التفوق!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                    {stat.trend === 'up' && (
                      <Badge className="bg-green-100 text-green-700">
                        <TrendingUp className="w-3 h-3 ml-1" />
                        نمو
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-sm text-gray-600 mb-2">{stat.title}</h3>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.change}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="assignments">الواجبات</TabsTrigger>
            <TabsTrigger value="subjects">المواد</TabsTrigger>
            <TabsTrigger value="performance">الأداء</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Progress by Subject */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    التقدم في المواد
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={progressBySubject}>
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

              {/* Overall Progress Radar */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    تحليل الأداء الشامل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis />
                      <Radar name="التقدم" dataKey="التقدم" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                      <Radar name="الحضور" dataKey="الحضور" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      <Radar name="الأداء" dataKey="الأداء" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Course Progress Cards */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>التقدم التفصيلي في المجموعات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeEnrollments.map((enrollment) => {
                    const group = allGroups.find(g => g.id === enrollment.group_id);
                    return (
                      <div key={enrollment.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{group?.name}</h4>
                            <p className="text-sm text-gray-600">{group?.subject} - {group?.stage}</p>
                          </div>
                          <Badge variant="secondary">{enrollment.progress_percentage || 0}%</Badge>
                        </div>
                        <Progress value={enrollment.progress_percentage || 0} className="h-3 mb-2" />
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            الحضور: {enrollment.attendance_count}/{enrollment.total_sessions}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-blue-600" />
                            {Math.round(((enrollment.total_sessions - enrollment.attendance_count) / (enrollment.total_sessions || 1)) * 100)}% متبقي
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Scores Over Time */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    تطور الدرجات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={assignmentScoresData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="percentage" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="النسبة المئوية" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Performance Distribution */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5" />
                    توزيع الأداء
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={performanceDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {performanceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Assignment Details */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>تفاصيل الواجبات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {gradedSubmissions.slice(0, 10).map((submission) => {
                    const assignment = assignments.find(a => a.id === submission.assignment_id);
                    const group = allGroups.find(g => g.id === assignment?.group_id);
                    const percentage = ((submission.score || 0) / (assignment?.max_score || 100)) * 100;
                    
                    return (
                      <div key={submission.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{assignment?.title}</h4>
                            <p className="text-sm text-gray-600">{group?.name}</p>
                          </div>
                          <Badge variant={percentage >= 90 ? 'default' : percentage >= 70 ? 'secondary' : 'destructive'}>
                            {submission.score}/{assignment?.max_score}
                          </Badge>
                        </div>
                        <Progress value={percentage} className="h-2 mb-2" />
                        <p className="text-sm text-gray-600">{format(new Date(submission.submitted_at), 'dd MMMM yyyy', { locale: ar })}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {progressBySubject.map((subject, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">التقدم</span>
                          <span className="font-semibold">{subject.progress}%</span>
                        </div>
                        <Progress value={subject.progress} className="h-3" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">الحضور</span>
                          <span className="font-semibold">{subject.attendance}%</span>
                        </div>
                        <Progress value={subject.attendance} className="h-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>ملخص الأداء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <div className="text-4xl font-bold text-green-600 mb-2">{averageScore.toFixed(1)}%</div>
                    <p className="text-sm text-gray-600">المعدل العام</p>
                  </div>
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-4xl font-bold text-blue-600 mb-2">{attendanceRate.toFixed(0)}%</div>
                    <p className="text-sm text-gray-600">معدل الحضور</p>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-lg">
                    <div className="text-4xl font-bold text-purple-600 mb-2">{submittedAssignments}/{totalAssignments}</div>
                    <p className="text-sm text-gray-600">الواجبات المسلمة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Completion Timeline */}
            {completionTimeline.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    المجموعات المكتملة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {completionTimeline.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                          <div>
                            <h4 className="font-semibold text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-600">مكتمل في {item.date}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-600">100%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}