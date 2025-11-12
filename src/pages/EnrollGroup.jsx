import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowRight,
  Users,
  Calendar,
  DollarSign,
  BookOpen,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EnrollGroupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get('id');
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: group, isLoading } = useQuery({
    queryKey: ['group', groupId],
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

  const enrollMutation = useMutation({
    mutationFn: async () => {
      // Create enrollment
      await base44.entities.Enrollment.create({
        student_email: user?.email,
        group_id: groupId,
        teacher_email: group?.teacher_email,
        status: 'active',
        progress_percentage: 0,
        attendance_count: 0,
        total_sessions: 0
      });

      // Update group students
      const currentStudents = group?.students || [];
      await base44.entities.StudyGroup.update(groupId, {
        students: [...currentStudents, user?.email]
      });

      // Use coupon if applied
      if (appliedCoupon) {
        await base44.entities.Coupon.update(appliedCoupon.id, {
          current_uses: (appliedCoupon.current_uses || 0) + 1
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['studentEnrollments']);
      navigate(createPageUrl("StudentDashboard"));
    },
  });

  const applyCouponMutation = useMutation({
    mutationFn: async (code) => {
      const coupons = await base44.entities.Coupon.filter({ 
        code: code,
        teacher_email: group?.teacher_email,
        is_active: true
      });
      
      if (coupons.length === 0) {
        throw new Error("كوبون غير صحيح");
      }

      const coupon = coupons[0];
      
      // Check validity
      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        throw new Error("انتهى استخدام هذا الكوبون");
      }

      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        throw new Error("انتهت صلاحية هذا الكوبون");
      }

      return coupon;
    },
    onSuccess: (coupon) => {
      setAppliedCoupon(coupon);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 mb-4">المجموعة غير موجودة</p>
        <Button onClick={() => navigate(createPageUrl("Browse"))}>
          العودة للتصفح
        </Button>
      </div>
    );
  }

  const isFull = group.students?.length >= group.max_students;
  const isAlreadyEnrolled = group.students?.includes(user?.email);

  let finalPrice = group.price_per_session;
  if (appliedCoupon) {
    if (appliedCoupon.discount_percentage) {
      finalPrice = finalPrice * (1 - appliedCoupon.discount_percentage / 100);
    } else if (appliedCoupon.discount_amount) {
      finalPrice = Math.max(0, finalPrice - appliedCoupon.discount_amount);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة
        </Button>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">تفاصيل المجموعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{group.name}</h3>
                  <p className="text-gray-600">{group.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">المادة</p>
                      <p className="font-semibold">{group.subject}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">عدد الطلاب</p>
                      <p className="font-semibold">
                        {group.students?.length || 0} / {group.max_students}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{group.stage}</Badge>
                  <Badge variant="secondary">{group.curriculum}</Badge>
                  {group.status === 'active' && (
                    <Badge className="bg-green-600">نشط</Badge>
                  )}
                </div>

                {group.schedule?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                      مواعيد الحصص
                    </h4>
                    <div className="space-y-2">
                      {group.schedule.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          <span className="font-medium">{item.day}</span>
                          <span className="text-gray-500">-</span>
                          <span>{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {teacher && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">المعلم</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <span className="text-white font-bold">
                          {teacher.name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{teacher.name}</p>
                        <p className="text-sm text-gray-600">
                          {teacher.years_experience} سنوات خبرة
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Coupon Section */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h4 className="font-semibold mb-3">لديك كوبون خصم؟</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="أدخل كود الكوبون"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={appliedCoupon}
                  />
                  <Button
                    onClick={() => applyCouponMutation.mutate(couponCode)}
                    disabled={!couponCode || appliedCoupon || applyCouponMutation.isPending}
                    variant="outline"
                  >
                    تطبيق
                  </Button>
                </div>
                {applyCouponMutation.isError && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {applyCouponMutation.error.message}
                  </p>
                )}
                {appliedCoupon && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    تم تطبيق الكوبون بنجاح
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="border-0 shadow-xl sticky top-4">
              <CardContent className="p-6">
                <h3 className="font-bold mb-4">ملخص الاشتراك</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">سعر الحصة</span>
                    <span className="font-semibold">{group.price_per_session} د.ك</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>الخصم</span>
                      <span className="font-semibold">
                        -{(group.price_per_session - finalPrice).toFixed(2)} د.ك
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">السعر النهائي</span>
                      <span className="text-2xl font-bold text-green-600">
                        {finalPrice.toFixed(2)} د.ك
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">لكل حصة</p>
                  </div>
                </div>

                {isAlreadyEnrolled ? (
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-blue-900 font-semibold">
                      أنت مشترك بالفعل في هذه المجموعة
                    </p>
                  </div>
                ) : isFull ? (
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-red-900 font-semibold">
                      المجموعة ممتلئة
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={() => enrollMutation.mutate()}
                    disabled={enrollMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {enrollMutation.isPending ? "جاري الاشتراك..." : "تأكيد الاشتراك"}
                  </Button>
                )}

                <p className="text-xs text-gray-500 mt-4 text-center">
                  بالاشتراك، أنت توافق على سياسة الاستخدام
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}