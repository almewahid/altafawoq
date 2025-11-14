
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowRight,
  Calendar,
  Clock,
  Users,
  FileText,
  Video,
  Download,
  ExternalLink,
  BookOpen,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DAYS_MAP = {
  "السبت": "Sat",
  "الأحد": "Sun",
  "الإثنين": "Mon",
  "الثلاثاء": "Tue",
  "الأربعاء": "Wed",
  "الخميس": "Thu",
  "الجمعة": "Fri"
};

export default function GroupDetailsPage() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get('id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: group, isLoading } = useQuery({
    queryKey: ['groupDetails', groupId],
    queryFn: async () => {
      const groups = await base44.entities.StudyGroup.filter({ id: groupId });
      return groups[0];
    },
    enabled: !!groupId,
  });

  const { data: teacher } = useQuery({
    queryKey: ['teacher', group?.teacher_email],
    queryFn: async () => {
      const teachers = await base44.entities.TeacherProfile.filter({ user_email: group?.teacher_email });
      return teachers[0];
    },
    enabled: !!group?.teacher_email,
  });

  const { data: materials = [] } = useQuery({
    queryKey: ['materials', groupId],
    queryFn: () => base44.entities.StudyMaterial.filter({ group_id: groupId }, 'order'),
    enabled: !!groupId,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', groupId],
    queryFn: () => base44.entities.VideoSession.filter({ group_id: groupId }, '-scheduled_date'),
    enabled: !!groupId,
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements', groupId],
    queryFn: () => base44.entities.Announcement.filter({ group_id: groupId }, '-created_date', 10),
    enabled: !!groupId,
  });

  const isEnrolled = group?.students?.includes(user?.email);
  const isTeacher = group?.teacher_email === user?.email;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <p className="text-gray-600 mb-4">المجموعة غير موجودة</p>
          <Button onClick={() => navigate(createPageUrl("Browse"))}>
            العودة للتصفح
          </Button>
        </div>
      </div>
    );
  }

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'video': return Video;
      case 'file': return FileText;
      case 'document': return BookOpen;
      default: return FileText;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            رجوع
          </Button>

          <Card className="border-0 shadow-lg overflow-hidden">
            {group.image_url && (
              <div className="h-40 md:h-64 overflow-hidden">
                <img 
                  src={group.image_url} 
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2">
                    {group.name}
                  </h1>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary">
                      <BookOpen className="w-3 h-3 ml-1" />
                      {group.subject}
                    </Badge>
                    <Badge variant="secondary">{group.stage}</Badge>
                    {group.curriculum && <Badge variant="secondary">{group.curriculum}</Badge>}
                    <Badge variant={group.status === 'active' ? 'default' : 'secondary'}>
                      {group.status === 'active' ? 'نشط' : group.status === 'inactive' ? 'غير نشط' : 'مكتمل'}
                    </Badge>
                  </div>
                  
                  {group.description && (
                    <p className="text-sm md:text-base text-gray-600 mb-4">{group.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
                    <div className="flex items-center gap-2 text-xs md:text-sm">
                      <Users className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                      <span>{group.students?.length || 0}/{group.max_students}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm">
                      <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                      <span>{group.price_per_session} د.ك</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm">
                      <FileText className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                      <span>{materials.length} مادة</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm">
                      <Video className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                      <span>{sessions.length} جلسة</span>
                    </div>
                  </div>

                  {teacher && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {teacher.name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{teacher.name}</p>
                        <p className="text-xs text-gray-600">المعلم</p>
                      </div>
                    </div>
                  )}
                </div>

                {!isTeacher && !isEnrolled && (
                  <Button
                    onClick={() => navigate(createPageUrl("EnrollGroup") + `?groupId=${group.id}`)}
                    className="bg-green-600 hover:bg-green-700 w-full md:w-auto"
                  >
                    انضم للمجموعة
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="schedule">الجدول</TabsTrigger>
            <TabsTrigger value="materials">المواد</TabsTrigger>
            <TabsTrigger value="sessions">الجلسات</TabsTrigger>
            <TabsTrigger value="announcements">الإعلانات</TabsTrigger>
          </TabsList>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  جدول الحصص
                </CardTitle>
              </CardHeader>
              <CardContent>
                {group.schedule && group.schedule.length > 0 ? (
                  <div className="space-y-3">
                    {group.schedule.map((slot, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xs">
                              {DAYS_MAP[slot.day] || slot.day}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{slot.day}</p>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="w-3 h-3" />
                              {slot.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">لم يتم تحديد مواعيد بعد</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  المواد التعليمية
                </CardTitle>
              </CardHeader>
              <CardContent>
                {materials.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {materials.map((material) => {
                      const Icon = getMaterialIcon(material.type);
                      return (
                        <div key={material.id} className="p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Icon className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{material.title}</h4>
                                <p className="text-xs text-gray-600">
                                  {material.type === 'video' ? 'فيديو' : 
                                   material.type === 'file' ? 'ملف' : 
                                   material.type === 'document' ? 'مستند' : 'رابط'}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {material.description && (
                            <p className="text-sm text-gray-600 mb-3">{material.description}</p>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(material.file_url, '_blank')}
                              className="flex-1"
                            >
                              <ExternalLink className="w-3 h-3 ml-1" />
                              فتح
                            </Button>
                            {material.is_downloadable && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const a = document.createElement('a');
                                  a.href = material.file_url;
                                  a.download = material.title;
                                  a.click();
                                }}
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">لا توجد مواد متاحة</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  الجلسات المباشرة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length > 0 ? (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div key={session.id} className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{session.title}</h4>
                            {session.description && (
                              <p className="text-sm text-gray-600 mt-1">{session.description}</p>
                            )}
                          </div>
                          <Badge variant={session.status === 'scheduled' ? 'default' : 'secondary'}>
                            {session.status === 'scheduled' ? 'مجدولة' : 
                             session.status === 'live' ? 'مباشر' : 
                             session.status === 'completed' ? 'مكتملة' : 'ملغية'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(session.scheduled_date).toLocaleDateString('ar-SA')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.scheduled_time}
                          </span>
                        </div>
                        {session.status === 'scheduled' && (isEnrolled || isTeacher) && (
                          <Button
                            size="sm"
                            onClick={() => navigate(createPageUrl("VideoSession") + `?id=${session.id}`)}
                            className="mt-3 bg-blue-600 hover:bg-blue-700"
                          >
                            انضم للجلسة
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">لا توجد جلسات مجدولة</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  الإعلانات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {announcements.length > 0 ? (
                  <div className="space-y-3">
                    {announcements.map((announcement) => (
                      <div key={announcement.id} className={`p-4 rounded-lg border ${
                        announcement.is_urgent 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                          {announcement.is_urgent && (
                            <Badge variant="destructive">عاجل</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{announcement.content}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(announcement.created_date).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">لا توجد إعلانات</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
