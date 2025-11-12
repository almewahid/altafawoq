import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { GraduationCap, User, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COUNTRIES = ["السعودية", "الإمارات", "مصر", "الأردن", "الكويت", "قطر", "البحرين", "عمان"];

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    user_type: "",
    phone: "",
    country: "",
    city: ""
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      
      // Navigate based on user type
      if (formData.user_type === 'teacher') {
        navigate(createPageUrl("TeacherDashboard"));
      } else if (formData.user_type === 'center') {
        navigate(createPageUrl("CenterDashboard"));
      } else {
        navigate(createPageUrl("StudentDashboard"));
      }
    },
  });

  const handleSubmit = () => {
    updateProfileMutation.mutate(formData);
  };

  const userTypes = [
    {
      id: 'student',
      title: 'طالب',
      description: 'أبحث عن معلم أو مركز تعليمي',
      icon: User,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'teacher',
      title: 'معلم',
      description: 'أريد تقديم دروس تعليمية',
      icon: GraduationCap,
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'center',
      title: 'مركز تعليمي',
      description: 'أمثل مركزاً تعليمياً',
      icon: Building2,
      color: 'from-orange-500 to-red-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl border-0 shadow-2xl">
        <CardContent className="p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">مرحباً بك في التفوق</h1>
            <p className="text-gray-600">دعنا نكمل إعداد حسابك</p>
          </div>

          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                اختر نوع حسابك
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {userTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Card
                      key={type.id}
                      className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                        formData.user_type === type.id
                          ? 'ring-4 ring-green-500 shadow-xl'
                          : 'hover:scale-105'
                      }`}
                      onClick={() => {
                        setFormData({...formData, user_type: type.id});
                        setStep(2);
                      }}
                    >
                      <CardContent className="p-6 text-center">
                        <div className={`w-16 h-16 bg-gradient-to-br ${type.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {type.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {type.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  معلومات الاتصال
                </h2>
                <p className="text-gray-600">املأ البيانات التالية لإكمال حسابك</p>
              </div>

              <div>
                <Label>رقم الهاتف *</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+966 5XX XXX XXX"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>الدولة *</Label>
                <Select 
                  value={formData.country} 
                  onValueChange={(value) => setFormData({...formData, country: value})}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="اختر الدولة" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>المدينة *</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="الرياض، جدة، دبي..."
                  className="mt-2"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  السابق
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.phone || !formData.country || !formData.city || updateProfileMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {updateProfileMutation.isPending ? "جاري الحفظ..." : "إكمال التسجيل"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}