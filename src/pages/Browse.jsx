import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/components/SupabaseClient";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ArrowRight, MapPin, Video, Home as HomeIcon, MessageCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Browse() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isGuest = searchParams.get('guest') === 'true';
  
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    subject: "all",
    stage: "all",
    curriculum: "all",
    teaching_type: "all",
    country: "all",
    entity_type: "all"
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => supabase.auth.getCurrentUserWithProfile(),
    retry: false,
  });

  const { data: allData, isLoading } = useQuery({
    queryKey: ['browseAll', search, filters],
    queryFn: async () => {
      const fetchedData = {
        groups: [],
        teachers: [],
        centers: []
      };

      // جلب المجموعات
      if (filters.entity_type === "all" || filters.entity_type === "group") {
        let groupQuery = supabase.from('study_groups').select('*').eq('status', 'active');
        
        if (search) {
          groupQuery = groupQuery.or(`name.ilike.%${search}%,subject.ilike.%${search}%,description.ilike.%${search}%`);
        }
        if (filters.subject !== "all") groupQuery = groupQuery.eq('subject', filters.subject);
        if (filters.stage !== "all") groupQuery = groupQuery.eq('stage', filters.stage);
        if (filters.curriculum !== "all") groupQuery = groupQuery.eq('curriculum', filters.curriculum);
        
        const { data, error } = await groupQuery.order('created_at', { ascending: false });
        if (!error) fetchedData.groups = data || [];
      }

      // جلب المعلمين
      if (filters.entity_type === "all" || filters.entity_type === "teacher") {
        let teacherQuery = supabase.from('teacher_profiles').select('*').eq('is_approved', true);
        
        if (search) {
          teacherQuery = teacherQuery.or(`name.ilike.%${search}%,bio.ilike.%${search}%`);
        }
        if (filters.subject !== "all") {
          teacherQuery = teacherQuery.contains('subjects', [filters.subject]);
        }
        if (filters.stage !== "all") {
          teacherQuery = teacherQuery.contains('stages', [filters.stage]);
        }
        if (filters.curriculum !== "all") {
          teacherQuery = teacherQuery.contains('curriculum', [filters.curriculum]);
        }
        if (filters.teaching_type !== "all") {
          teacherQuery = teacherQuery.contains('teaching_type', [filters.teaching_type]);
        }
        
        const { data, error } = await teacherQuery.order('created_at', { ascending: false });
        if (!error) fetchedData.teachers = data || [];
      }

      // جلب المراكز
      if (filters.entity_type === "all" || filters.entity_type === "center") {
        let centerQuery = supabase.from('educational_centers').select('*').eq('is_approved', true);
        
        if (search) {
          centerQuery = centerQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }
        if (filters.subject !== "all") {
          centerQuery = centerQuery.contains('subjects', [filters.subject]);
        }
        if (filters.stage !== "all") {
          centerQuery = centerQuery.contains('stages', [filters.stage]);
        }
        if (filters.curriculum !== "all") {
          centerQuery = centerQuery.contains('curriculum', [filters.curriculum]);
        }
        
        const { data, error } = await centerQuery.order('created_at', { ascending: false });
        if (!error) fetchedData.centers = data || [];
      }

      return fetchedData;
    }
  });

  const { groups = [], teachers = [], centers = [] } = allData || {};

  const allSubjects = [...new Set([
    ...groups.map(g => g.subject),
    ...teachers.flatMap(t => t.subjects || []),
    ...centers.flatMap(c => c.subjects || []),
  ])].filter(Boolean);
  
  const allStages = [...new Set([
    ...groups.map(g => g.stage),
    ...teachers.flatMap(t => t.stages || []),
    ...centers.flatMap(c => c.stages || []),
  ])].filter(Boolean);
  
  const allCurricula = [...new Set([
    ...groups.map(g => g.curriculum),
    ...teachers.flatMap(t => t.curriculum || []),
    ...centers.flatMap(c => c.curriculum || []),
  ])].filter(Boolean);

  const handleContact = (email) => {
    if (!user || isGuest) {
      navigate(createPageUrl("UserLogin"));
      return;
    }
    navigate(createPageUrl("Chat") + `?to=${email}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm hover:bg-green-600 hover:text-white transition-all"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            عودة
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
              {isGuest ? "تصفح كزائر" : "تصفح المجموعات والمعلمين والمراكز"}
            </h1>
            {isGuest && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">سجل دخولك للحصول على المزايا الكاملة</p>
            )}
          </div>
        </div>
        
        <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-0 shadow-xl rounded-3xl transition-colors duration-300">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="ابحث عن مادة، معلم، مركز أو مجموعة..." 
                  className="pr-10 bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600 transition-colors duration-300"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="hover:bg-green-600 hover:text-white dark:bg-slate-700 dark:text-white dark:border-slate-600 transition-all"
              >
                <Filter className="w-4 h-4 ml-2" />
                تصفية متقدمة
              </Button>
            </div>

            {showFilters && (
              <div className="grid md:grid-cols-4 gap-4 mt-4 pt-4 border-t dark:border-slate-600">
                <Select value={filters.entity_type} onValueChange={(v) => setFilters({...filters, entity_type: v})}>
                  <SelectTrigger className="dark:bg-slate-700 dark:text-white dark:border-slate-600">
                    <SelectValue placeholder="النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="group">مجموعة دراسية</SelectItem>
                    <SelectItem value="teacher">معلم</SelectItem>
                    <SelectItem value="center">مركز تعليمي</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.subject} onValueChange={(v) => setFilters({...filters, subject: v})}>
                  <SelectTrigger className="dark:bg-slate-700 dark:text-white dark:border-slate-600">
                    <SelectValue placeholder="المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المواد</SelectItem>
                    {allSubjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.stage} onValueChange={(v) => setFilters({...filters, stage: v})}>
                  <SelectTrigger className="dark:bg-slate-700 dark:text-white dark:border-slate-600">
                    <SelectValue placeholder="المرحلة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المراحل</SelectItem>
                    {allStages.map((stage) => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.curriculum} onValueChange={(v) => setFilters({...filters, curriculum: v})}>
                  <SelectTrigger className="dark:bg-slate-700 dark:text-white dark:border-slate-600">
                    <SelectValue placeholder="المنهج" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المناهج</SelectItem>
                    {allCurricula.map((curriculum) => (
                      <SelectItem key={curriculum} value={curriculum}>{curriculum}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.teaching_type} onValueChange={(v) => setFilters({...filters, teaching_type: v})}>
                  <SelectTrigger className="dark:bg-slate-700 dark:text-white dark:border-slate-600">
                    <SelectValue placeholder="نوع التدريس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="online">أونلاين</SelectItem>
                    <SelectItem value="home">حضوري</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.length === 0 && teachers.length === 0 && centers.length === 0 && (
              <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-0 shadow-xl rounded-3xl transition-colors duration-300">
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-lg transition-colors duration-300">لا توجد نتائج</p>
                </CardContent>
              </Card>
            )}

            {(filters.entity_type === "all" || filters.entity_type === "group") && groups.length > 0 && (
              <div className="grid md:grid-cols-3 gap-6">
                <h2 className="col-span-full text-xl font-bold text-gray-900 dark:text-white">المجموعات الدراسية</h2>
                {groups.map((group) => (
                  <Card 
                    key={group.id} 
                    className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer rounded-3xl overflow-hidden group"
                    onClick={() => {
                      if (isGuest) {
                        navigate(createPageUrl("UserLogin"));
                      } else {
                        navigate(createPageUrl("GroupDetails") + `?id=${group.id}`);
                      }
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-green-600">
                            {group.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">{group.subject} - {group.stage}</p>
                        </div>
                        <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 transition-colors duration-300">
                          {group.price} د.ك
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 transition-colors duration-300">
                        {isGuest ? "سجل دخولك لعرض التفاصيل الكاملة" : group.description}
                      </p>

                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4 transition-colors duration-300">
                        {group.is_online ? <Video className="w-4 h-4" /> : <HomeIcon className="w-4 h-4" />}
                        <span>{group.is_online ? 'أونلاين' : 'حضوري'}</span>
                        {group.location && <><MapPin className="w-4 h-4" /> <span>{group.location}</span></>}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t dark:border-slate-600 transition-colors duration-300">
                        <span className="text-green-600 dark:text-green-400 font-bold transition-colors duration-300">
                          {group.current_students}/{group.max_students} طالب
                        </span>
                        
                        {!isGuest && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContact(group.teacher_email);
                            }}
                            className="hover:bg-green-600 hover:text-white dark:border-slate-600 transition-all"
                          >
                            <MessageCircle className="w-4 h-4 ml-1" />
                            تواصل
                          </Button>
                        )}
                      </div>

                      {isGuest && (
                      <Button 
                        className="w-full mt-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold transition-all shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(createPageUrl("UserLogin"));
                        }}
                      >
                        سجل دخولك للمتابعة
                      </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {(filters.entity_type === "all" || filters.entity_type === "teacher") && teachers.length > 0 && (
              <div className="grid md:grid-cols-3 gap-6">
                <h2 className="col-span-full text-xl font-bold text-gray-900 dark:text-white mt-4">المعلمون</h2>
                {teachers.map((teacher) => (
                  <Card 
                    key={teacher.id} 
                    className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer rounded-3xl overflow-hidden group"
                    onClick={() => {
                      if (isGuest) {
                        navigate(createPageUrl("UserLogin"));
                      } else {
                        navigate(createPageUrl("TeacherDetails") + `?id=${teacher.id}`);
                      }
                    }}
                  >
                    {teacher.avatar_url && (
                      <div className="relative h-40 overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <img src={teacher.avatar_url} alt={teacher.name} className="h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-green-600">
                            {teacher.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">{teacher.subjects?.join(', ') || ''}</p>
                        </div>
                        <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 transition-colors duration-300">
                          {teacher.hourly_rate} {teacher.currency}/ساعة
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 transition-colors duration-300">
                        {isGuest ? "سجل دخولك لعرض التفاصيل الكاملة" : teacher.bio}
                      </p>

                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4 transition-colors duration-300">
                        {teacher.teaching_type?.includes('online') && <Video className="w-4 h-4" />}
                        {teacher.teaching_type?.includes('home') && <HomeIcon className="w-4 h-4" />}
                        <span>{teacher.teaching_type?.join(', ') || 'أونلاين'}</span>
                        {teacher.city && <><MapPin className="w-4 h-4" /> <span>{teacher.city}</span></>}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t dark:border-slate-600 transition-colors duration-300">
                        <span className="text-green-600 dark:text-green-400 font-bold transition-colors duration-300">
                          التقييم: {teacher.rating}
                        </span>
                        
                        {!isGuest && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContact(teacher.user_email);
                            }}
                            className="hover:bg-green-600 hover:text-white dark:border-slate-600 transition-all"
                          >
                            <MessageCircle className="w-4 h-4 ml-1" />
                            تواصل
                          </Button>
                        )}
                      </div>

                      {isGuest && (
                      <Button 
                        className="w-full mt-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold transition-all shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(createPageUrl("UserLogin"));
                        }}
                      >
                        سجل دخولك للمتابعة
                      </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {(filters.entity_type === "all" || filters.entity_type === "center") && centers.length > 0 && (
              <div className="grid md:grid-cols-3 gap-6">
                <h2 className="col-span-full text-xl font-bold text-gray-900 dark:text-white mt-4">المراكز التعليمية</h2>
                {centers.map((center) => (
                  <Card 
                    key={center.id} 
                    className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer rounded-3xl overflow-hidden group"
                    onClick={() => {
                      if (isGuest) {
                        navigate(createPageUrl("UserLogin"));
                      } else {
                        navigate(createPageUrl("CenterDetails") + `?id=${center.id}`);
                      }
                    }}
                  >
                    {center.images?.[0] && (
                      <div className="relative h-40 overflow-hidden">
                        <img src={center.images[0]} alt={center.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-green-600">
                            {center.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">{center.city} - {center.area}</p>
                        </div>
                        <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 transition-colors duration-300">
                          {center.price_per_month} د.ك/شهر
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 transition-colors duration-300">
                        {isGuest ? "سجل دخولك لعرض التفاصيل الكاملة" : center.description}
                      </p>

                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4 transition-colors duration-300">
                        <MapPin className="w-4 h-4" />
                        <span>{center.address}</span>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t dark:border-slate-600 transition-colors duration-300">
                        <span className="text-green-600 dark:text-green-400 font-bold transition-colors duration-300">
                          التقييم: {center.rating}
                        </span>
                        
                        {!isGuest && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContact(center.user_email);
                            }}
                            className="hover:bg-green-600 hover:text-white dark:border-slate-600 transition-all"
                          >
                            <MessageCircle className="w-4 h-4 ml-1" />
                            تواصل
                          </Button>
                        )}
                      </div>

                      {isGuest && (
                      <Button 
                        className="w-full mt-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold transition-all shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(createPageUrl("UserLogin"));
                        }}
                      >
                        سجل دخولك للمتابعة
                      </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}