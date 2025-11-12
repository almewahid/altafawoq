
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Users,
  GraduationCap,
  Building2,
  CheckCircle,
  XCircle,
  Eye,
  Settings as SettingsIcon,
  UserCheck,
  UserX,
  Edit,
  DollarSign, // Added DollarSign icon
  Trash2,     // Added Trash2 icon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    contact_view_price: "",
    platform_commission_online: "",
    platform_commission_home: ""
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.role === 'admin',
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['allTeachers'],
    queryFn: () => base44.entities.TeacherProfile.list(),
    enabled: user?.role === 'admin',
  });

  const { data: centers = [] } = useQuery({
    queryKey: ['allCenters'],
    queryFn: () => base44.entities.EducationalCenter.list(),
    enabled: user?.role === 'admin',
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['allEnrollments'],
    queryFn: () => base44.entities.Enrollment.list(),
    enabled: user?.role === 'admin',
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['platformSettings'],
    queryFn: () => base44.entities.PlatformSettings.list(),
    enabled: user?.role === 'admin',
  });

  const { data: withdrawalRequests = [] } = useQuery({
    queryKey: ['allWithdrawalRequests'],
    queryFn: () => base44.entities.WithdrawalRequest.list('-created_date'),
    enabled: user?.role === 'admin',
  });

  const { data: allGroups = [] } = useQuery({
    queryKey: ['adminAllGroups'],
    queryFn: () => base44.entities.StudyGroup.list(),
    enabled: user?.role === 'admin',
  });

  const approveTeacherMutation = useMutation({
    mutationFn: (id) => base44.entities.TeacherProfile.update(id, { is_approved: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['allTeachers']);
    },
  });

  const rejectTeacherMutation = useMutation({
    mutationFn: (id) => base44.entities.TeacherProfile.update(id, { is_approved: false }),
    onSuccess: () => {
      queryClient.invalidateQueries(['allTeachers']);
    },
  });

  const approveCenterMutation = useMutation({
    mutationFn: (id) => base44.entities.EducationalCenter.update(id, { is_approved: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['allCenters']);
    },
  });

  const rejectCenterMutation = useMutation({
    mutationFn: (id) => base44.entities.EducationalCenter.update(id, { is_approved: false }),
    onSuccess: () => {
      queryClient.invalidateQueries(['allCenters']);
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }) => {
      const setting = settings.find(s => s.setting_key === key);
      if (setting) {
        return base44.entities.PlatformSettings.update(setting.id, { setting_value: value });
      }
      return base44.entities.PlatformSettings.create({ setting_key: key, setting_value: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['platformSettings']);
      setShowSettingsDialog(false);
    },
  });

  // New mutations for editing profiles
  const updateTeacherMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TeacherProfile.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allTeachers']);
      setShowEditDialog(false);
    },
  });

  const updateCenterMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EducationalCenter.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allCenters']);
      setShowEditDialog(false);
    },
  });

  const approveWithdrawalMutation = useMutation({
    mutationFn: (id) => base44.entities.WithdrawalRequest.update(id, {
      status: 'approved',
      processed_date: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['allWithdrawalRequests']);
    },
  });

  const rejectWithdrawalMutation = useMutation({
    mutationFn: ({ id, notes }) => base44.entities.WithdrawalRequest.update(id, {
      status: 'rejected',
      admin_notes: notes,
      processed_date: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['allWithdrawalRequests']);
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StudyGroup.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAllGroups']);
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id) => base44.entities.StudyGroup.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAllGroups']);
    },
  });

  React.useEffect(() => {
    if (settings.length > 0) {
      const contactPrice = settings.find(s => s.setting_key === 'contact_view_price');
      const commissionOnline = settings.find(s => s.setting_key === 'platform_commission_online');
      const commissionHome = settings.find(s => s.setting_key === 'platform_commission_home');

      setSettingsForm({
        contact_view_price: contactPrice?.setting_value || "0.5",
        platform_commission_online: commissionOnline?.setting_value || "20",
        platform_commission_home: commissionHome?.setting_value || "10"
      });
    }
  }, [settings]);

  const handleSaveSettings = () => {
    updateSettingMutation.mutate({ key: 'contact_view_price', value: settingsForm.contact_view_price });
    updateSettingMutation.mutate({ key: 'platform_commission_online', value: settingsForm.platform_commission_online });
    updateSettingMutation.mutate({ key: 'platform_commission_home', value: settingsForm.platform_commission_home });
  };

  const handleViewProfile = (profile, type) => {
    setSelectedProfile({ ...profile, type });
    setShowProfileDialog(true);
  };

  // New function to handle editing
  const handleEdit = (profile, type) => {
    setEditForm(profile);
    setSelectedProfile({ ...profile, type });
    setShowEditDialog(true);
  };

  // New function to save edited profile
  const handleSaveEdit = () => {
    if (selectedProfile.type === 'teacher') {
      updateTeacherMutation.mutate({ id: selectedProfile.id, data: editForm });
    } else if (selectedProfile.type === 'center') {
      updateCenterMutation.mutate({ id: selectedProfile.id, data: editForm });
    }
  };

  // New function to toggle teacher visibility
  const toggleTeacherVisibility = (id, currentStatus) => {
    updateTeacherMutation.mutate({
      id,
      data: { is_approved: !currentStatus }
    });
  };

  // New function to toggle center visibility
  const toggleCenterVisibility = (id, currentStatus) => {
    updateCenterMutation.mutate({
      id,
      data: { is_approved: !currentStatus }
    });
  };

  const handleViewAsRole = async (userType) => {
    await base44.auth.updateMe({ user_type: userType });

    // Navigate to appropriate dashboard based on role
    if (userType === 'teacher') {
      navigate(createPageUrl("TeacherDashboard"));
    } else if (userType === 'student') {
      navigate(createPageUrl("StudentDashboard"));
    }

    window.location.reload();
  };

  const pendingTeachers = teachers.filter(t => !t.is_approved);
  const approvedTeachers = teachers.filter(t => t.is_approved);
  const pendingCenters = centers.filter(c => !c.is_approved);
  const approvedCenters = centers.filter(c => c.is_approved);
  const totalStudents = allUsers.filter(u => u.user_type === 'student').length;
  const pendingWithdrawals = withdrawalRequests.filter(r => r.status === 'pending');

  const stats = [
    {
      title: "إجمالي المعلمين",
      value: teachers.length,
      icon: GraduationCap,
      color: "blue",
      description: `${pendingTeachers.length} بانتظار الموافقة`
    },
    {
      title: "المراكز التعليمية",
      value: centers.length,
      icon: Building2,
      color: "orange",
      description: `${pendingCenters.length} بانتظار الموافقة`
    },
    {
      title: "إجمالي الطلاب",
      value: totalStudents,
      icon: Users,
      color: "green",
      description: `${enrollments.length} تسجيل نشط`
    },
    {
      title: "طلبات السحب",
      value: pendingWithdrawals.length,
      icon: DollarSign,
      color: "purple",
      description: "بانتظار المراجعة"
    },
  ];

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">غير مصرح</h2>
        <p className="text-gray-600">ليس لديك صلاحية للوصول إلى لوحة الإدارة</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة إدارة المنصة</h1>
            <p className="text-gray-600">إدارة المعلمين والمراكز والإعدادات</p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setShowSettingsDialog(true)}
              className="bg-gray-900 hover:bg-gray-800"
            >
              <SettingsIcon className="w-4 h-4 ml-2" />
              الإعدادات
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-blue-50 hover:bg-blue-100 border-blue-200">
                  <Eye className="w-4 h-4 ml-2" />
                  عرض كـ
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>عرض الموقع بدور مختلف</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    يمكنك عرض الموقع كمعلم أو طالب لتجربة الواجهة من منظورهم
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => handleViewAsRole('teacher')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <GraduationCap className="w-4 h-4 ml-2" />
                      عرض كمعلم
                    </Button>
                    <Button
                      onClick={() => handleViewAsRole('student')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Users className="w-4 h-4 ml-2" />
                      عرض كطالب
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-0 shadow-lg">
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

        {/* Tabs for Teachers and Centers */}
        <Tabs defaultValue="teachers" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="teachers">
              المعلمون ({teachers.length})
            </TabsTrigger>
            <TabsTrigger value="centers">
              المراكز ({centers.length})
            </TabsTrigger>
            <TabsTrigger value="users">
              المستخدمون ({allUsers.length})
            </TabsTrigger>
            <TabsTrigger value="withdrawals">
              السحوبات ({pendingWithdrawals.length})
            </TabsTrigger>
            <TabsTrigger value="groups">
              المجموعات ({allGroups.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teachers">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>إدارة المعلمين</CardTitle>
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
                        <TableHead>المواد</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teachers.map((teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">{teacher.name}</TableCell>
                          <TableCell>{teacher.user_email}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {teacher.subjects?.slice(0, 2).map((subject, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {subject}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={teacher.is_approved ? "default" : "secondary"}>
                              {teacher.is_approved ? "معتمد" : "بانتظار"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewProfile(teacher, 'teacher')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(teacher, 'teacher')}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {teacher.is_approved ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleTeacherVisibility(teacher.id, teacher.is_approved)}
                                  title="إخفاء"
                                >
                                  <UserX className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => approveTeacherMutation.mutate(teacher.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                  title="موافقة"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="centers">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>إدارة المراكز التعليمية</CardTitle>
              </CardHeader>
              <CardContent>
                {centers.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">لا توجد مراكز مسجلة بعد</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>البريد الإلكتروني</TableHead>
                        <TableHead>الموقع</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {centers.map((center) => (
                        <TableRow key={center.id}>
                          <TableCell className="font-medium">{center.name}</TableCell>
                          <TableCell>{center.user_email}</TableCell>
                          <TableCell>{center.city}, {center.country}</TableCell>
                          <TableCell>
                            <Badge variant={center.is_approved ? "default" : "secondary"}>
                              {center.is_approved ? "معتمد" : "بانتظار"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewProfile(center, 'center')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(center, 'center')}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {center.is_approved ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleCenterVisibility(center.id, center.is_approved)}
                                  title="إخفاء"
                                >
                                  <UserX className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => approveCenterMutation.mutate(center.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                  title="موافقة"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>جميع المستخدمين</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>نوع المستخدم</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((usr) => (
                      <TableRow key={usr.id}>
                        <TableCell className="font-medium">{usr.full_name}</TableCell>
                        <TableCell>{usr.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {usr.user_type === 'teacher' ? 'معلم' : usr.user_type === 'student' ? 'طالب' : usr.user_type === 'center' ? 'مركز' : 'غير محدد'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={usr.role === 'admin' ? 'destructive' : 'default'}>
                            {usr.role === 'admin' ? 'مدير' : 'مستخدم'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (usr.user_type === 'teacher') {
                                const teacherProfile = teachers.find(t => t.user_email === usr.email);
                                if (teacherProfile) handleViewProfile(teacherProfile, 'teacher');
                              } else if (usr.user_type === 'student') {
                                handleViewProfile(usr, 'student');
                              } else if (usr.user_type === 'center') {
                                const centerProfile = centers.find(c => c.user_email === usr.email);
                                if (centerProfile) handleViewProfile(centerProfile, 'center');
                              }
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>طلبات سحب الأرباح</CardTitle>
              </CardHeader>
              <CardContent>
                {withdrawalRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">لا توجد طلبات سحب</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المعلم</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>البنك</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawalRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.user_email}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {request.amount} {request.currency}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{request.bank_account?.bank_name}</p>
                              <p className="text-gray-500">{request.bank_account?.account_number}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(request.created_date).toLocaleDateString('ar-SA')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              request.status === 'pending' ? 'secondary' :
                              request.status === 'approved' ? 'default' :
                              request.status === 'completed' ? 'default' : 'destructive'
                            }>
                              {request.status === 'pending' ? 'قيد المراجعة' :
                               request.status === 'approved' ? 'تمت الموافقة' :
                               request.status === 'completed' ? 'مكتمل' : 'مرفوض'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {request.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => approveWithdrawalMutation.mutate(request.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const notes = prompt("سبب الرفض:");
                                    if (notes) {
                                      rejectWithdrawalMutation.mutate({ id: request.id, notes });
                                    }
                                  }}
                                  className="text-red-600"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>إدارة المجموعات الدراسية</CardTitle>
              </CardHeader>
              <CardContent>
                {allGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">لا توجد مجموعات</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>اسم المجموعة</TableHead>
                        <TableHead>المعلم</TableHead>
                        <TableHead>المادة</TableHead>
                        <TableHead>الطلاب</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allGroups.map((group) => (
                        <TableRow key={group.id}>
                          <TableCell className="font-medium">{group.name}</TableCell>
                          <TableCell>{group.teacher_email}</TableCell>
                          <TableCell>{group.subject}</TableCell>
                          <TableCell>
                            {group.students?.length || 0}/{group.max_students}
                          </TableCell>
                          <TableCell>
                            <Badge variant={group.status === 'active' ? 'default' : 'secondary'}>
                              {group.status === 'active' ? 'نشط' : group.status === 'inactive' ? 'غير نشط' : 'مكتمل'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const newStatus = group.status === 'active' ? 'inactive' : 'active';
                                  updateGroupMutation.mutate({
                                    id: group.id,
                                    data: { status: newStatus }
                                  });
                                }}
                              >
                                {group.status === 'active' ? 'إيقاف' : 'تفعيل'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (confirm("هل أنت متأكد من حذف هذه المجموعة؟")) {
                                    deleteGroupMutation.mutate(group.id);
                                  }
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                تعديل {selectedProfile?.type === 'teacher' ? 'المعلم' : 'المركز'}
              </DialogTitle>
            </DialogHeader>

            {selectedProfile && (
              <div className="space-y-4">
                <div>
                  <Label>الاسم</Label>
                  <Input
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  />
                </div>

                {selectedProfile.type === 'teacher' && (
                  <>
                    <div>
                      <Label>النبذة</Label>
                      <Textarea
                        value={editForm.bio || ""}
                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>سعر الساعة (د.ك)</Label>
                      <Input
                        type="number"
                        value={editForm.hourly_rate || 0}
                        onChange={(e) => setEditForm({...editForm, hourly_rate: parseFloat(e.target.value)})}
                      />
                    </div>
                  </>
                )}

                {selectedProfile.type === 'center' && (
                  <>
                    <div>
                      <Label>الوصف</Label>
                      <Textarea
                        value={editForm.description || ""}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>السعر الشهري (د.ك)</Label>
                      <Input
                        type="number"
                        value={editForm.price_per_month || 0}
                        onChange={(e) => setEditForm({...editForm, price_per_month: parseFloat(e.target.value)})}
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label>الحالة</Label>
                  <Select
                    value={editForm.is_approved?.toString() || "false"}
                    onValueChange={(value) => setEditForm({...editForm, is_approved: value === "true"})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">معتمد (ظاهر)</SelectItem>
                      <SelectItem value="false">غير معتمد (مخفي)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleSaveEdit}
                  disabled={updateTeacherMutation.isPending || updateCenterMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {(updateTeacherMutation.isPending || updateCenterMutation.isPending) ? "جاري الحفظ..." : "حفظ التعديلات"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إعدادات المنصة</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label>سعر عرض بيانات الاتصال (دينار)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={settingsForm.contact_view_price}
                  onChange={(e) => setSettingsForm({...settingsForm, contact_view_price: e.target.value})}
                />
              </div>

              <div>
                <Label>عمولة المنصة - الدروس الأونلاين (%)</Label>
                <Input
                  type="number"
                  value={settingsForm.platform_commission_online}
                  onChange={(e) => setSettingsForm({...settingsForm, platform_commission_online: e.target.value})}
                />
              </div>

              <div>
                <Label>عمولة المنصة - الدروس المنزلية (%)</Label>
                <Input
                  type="number"
                  value={settingsForm.platform_commission_home}
                  onChange={(e) => setSettingsForm({...settingsForm, platform_commission_home: e.target.value})}
                />
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={updateSettingMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {updateSettingMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Profile View Dialog */}
        <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedProfile?.type === 'teacher' ? 'ملف المعلم' :
                 selectedProfile?.type === 'center' ? 'ملف المركز' : 'ملف الطالب'}
              </DialogTitle>
            </DialogHeader>

            {selectedProfile && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">الاسم</Label>
                    <p className="font-semibold">{selectedProfile.name || selectedProfile.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">البريد الإلكتروني</Label>
                    <p className="font-semibold">{selectedProfile.user_email || selectedProfile.email}</p>
                  </div>
                </div>

                {selectedProfile.type === 'teacher' && (
                  <>
                    <div>
                      <Label className="text-gray-600">النبذة</Label>
                      <p>{selectedProfile.bio}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">المواد</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedProfile.subjects?.map((subject, idx) => (
                          <Badge key={idx} variant="secondary">{subject}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-600">المراحل</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedProfile.stages?.map((stage, idx) => (
                          <Badge key={idx} variant="secondary">{stage}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {selectedProfile.type === 'center' && (
                  <>
                    <div>
                      <Label className="text-gray-600">الوصف</Label>
                      <p>{selectedProfile.description}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">العنوان</Label>
                      <p>{selectedProfile.address}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
