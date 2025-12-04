import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/components/SupabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Book, Video } from "lucide-react";

export default function TeacherDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const teacherEmail = id || searchParams.get('email');

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher', teacherEmail],
    queryFn: async () => {
      if (!teacherEmail) return null;
      const { data, error } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('user_email', teacherEmail)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!teacherEmail
  });

  if (isLoading) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (!teacher) return <div className="p-8 text-center">المعلم غير موجود</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        ← عودة
      </Button>

      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <CardContent className="relative pt-0 px-6 pb-6">
          <div className="flex flex-col md:flex-row items-start gap-6 -mt-12">
            <img 
              src={teacher.avatar_url || "https://via.placeholder.com/150"} 
              alt={teacher.name}
              className="w-32 h-32 rounded-xl border-4 border-white shadow-lg object-cover bg-white"
            />
            <div className="flex-1 pt-14 md:pt-16 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{teacher.name}</h1>
                  <div className="flex items-center gap-2 text-gray-500 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{teacher.city}, {teacher.country}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-yellow-700">{teacher.rating || 5.0}</span>
                </div>
              </div>
              
              <p className="text-gray-600">{teacher.bio}</p>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {teacher.subjects?.map(subject => (
                  <Badge key={subject} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {teacher.video_introduction && (
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <iframe 
                    src={teacher.video_introduction} 
                    className="w-full h-full"
                    title="Teacher Introduction"
                    frameBorder="0" 
                    allowFullScreen
                  />
                </div>
              )}
              
              <div>
                <h3 className="font-bold text-lg mb-3">المؤهلات والخبرة</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 text-sm">سنوات الخبرة</span>
                    <p className="font-bold text-lg">{teacher.years_experience} سنوات</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 text-sm">سعر الساعة</span>
                    <p className="font-bold text-lg">{teacher.hourly_rate} {teacher.currency}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="bg-blue-50 border-blue-100">
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-bold text-blue-900">تواصل مع المعلم</h3>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <MessageSquare className="w-4 h-4" />
                    إرسال رسالة
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <Video className="w-4 h-4" />
                    حجز حصة تجريبية
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}