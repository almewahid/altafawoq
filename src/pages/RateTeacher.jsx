import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/components/SupabaseClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, ThumbsUp, Clock, MessageSquare, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function RateTeacher() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(location.search);
  
  const teacherEmail = searchParams.get("teacher_email");
  const studentEmail = searchParams.get("student_email");
  const groupId = searchParams.get("group_id");

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  
  // Detailed aspects
  const [aspects, setAspects] = useState({
    teaching_quality: 0,
    communication: 0,
    punctuality: 0,
    materials: 0
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      const { data, error } = await supabase.from('reviews').insert([reviewData]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("تم إرسال تقييمك بنجاح!");
      navigate(-1); // Go back
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء إرسال التقييم: " + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("يرجى اختيار تقييم عام");
      return;
    }

    submitReviewMutation.mutate({
      teacher_email: teacherEmail,
      student_email: studentEmail, // In real app, get from auth context if null
      group_id: groupId,
      rating: rating,
      comment: comment,
      aspects: aspects,
      is_verified: true // Assuming logged in student
    });
  };

  const StarRating = ({ value, onChange, size = "md", hover = false, onHover }) => {
    const stars = [1, 2, 3, 4, 5];
    const sizeClasses = size === "lg" ? "w-8 h-8" : "w-5 h-5";
    
    return (
      <div className="flex gap-1" onMouseLeave={() => hover && onHover(0)}>
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange && onChange(star)}
            onMouseEnter={() => hover && onHover(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star 
              className={`${sizeClasses} ${
                star <= (hover ? (hoverRating || value) : value)
                  ? "fill-yellow-400 text-yellow-400" 
                  : "text-gray-300"
              }`} 
            />
          </button>
        ))}
      </div>
    );
  };

  if (!teacherEmail) return <div className="p-8 text-center">رابط غير صحيح</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 md:p-8" dir="rtl">
      <Card className="max-w-2xl mx-auto shadow-lg border-orange-100 bg-white/90 backdrop-blur">
        <CardHeader className="text-center border-b border-gray-100 pb-6">
          <CardTitle className="text-2xl font-bold text-gray-800">تقييم المعلم</CardTitle>
          <p className="text-gray-500 mt-2">شاركنا رأيك وتجربتك للمساعدة في تحسين الجودة</p>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* General Rating */}
            <div className="flex flex-col items-center gap-3">
              <label className="text-lg font-semibold text-gray-700">التقييم العام</label>
              <StarRating 
                value={rating} 
                onChange={setRating} 
                size="lg" 
                hover={true}
                onHover={setHoverRating}
              />
              <span className="text-sm text-gray-500 font-medium">
                {rating > 0 ? ["سيء جداً", "سيء", "متوسط", "جيد", "م ممتاز"][rating - 1] : "اختر التقييم"}
              </span>
            </div>

            <div className="border-t border-gray-100 my-6"></div>

            {/* Detailed Aspects */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  جودة الشرح
                </label>
                <StarRating 
                  value={aspects.teaching_quality} 
                  onChange={(v) => setAspects({...aspects, teaching_quality: v})} 
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MessageSquare className="w-4 h-4 text-green-500" />
                  التواصل والتفاعل
                </label>
                <StarRating 
                  value={aspects.communication} 
                  onChange={(v) => setAspects({...aspects, communication: v})} 
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="w-4 h-4 text-purple-500" />
                  الالتزام بالمواعيد
                </label>
                <StarRating 
                  value={aspects.punctuality} 
                  onChange={(v) => setAspects({...aspects, punctuality: v})} 
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ThumbsUp className="w-4 h-4 text-orange-500" />
                  المواد التعليمية
                </label>
                <StarRating 
                  value={aspects.materials} 
                  onChange={(v) => setAspects({...aspects, materials: v})} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">ملاحظات إضافية (اختياري)</label>
              <Textarea
                placeholder="اكتب تفاصيل تجربتك هنا..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[120px] resize-none focus:ring-orange-200"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all"
                disabled={submitReviewMutation.isPending}
              >
                {submitReviewMutation.isPending ? "جاري الإرسال..." : "إرسال التقييم"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="px-6"
                onClick={() => navigate(-1)}
              >
                إلغاء
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}