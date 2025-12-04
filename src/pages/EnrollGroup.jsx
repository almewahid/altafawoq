import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/components/SupabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Wallet } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function EnrollGroup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const groupId = searchParams.get('groupId');
  const [paymentMethod, setPaymentMethod] = useState('card');

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const { data } = await supabase.from('study_groups').select('*').eq('id', groupId).single();
      return data;
    },
    enabled: !!groupId
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      // Simulated enrollment logic
      const user = await supabase.auth.getCurrentUserWithProfile();
      if (!user) throw new Error("Not logged in");

      const { error } = await supabase.from('enrollments').insert({
        group_id: groupId,
        student_email: user.email,
        teacher_email: group.teacher_email,
        status: 'active',
        progress_percentage: 0
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      alert("تم التسجيل بنجاح!");
      navigate(createPageUrl("StudentDashboard"));
    }
  });

  if (!group) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="max-w-lg mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>تأكيد التسجيل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h3 className="font-bold">{group.name}</h3>
            <p className="text-sm text-gray-600">{group.description}</p>
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>السعر الإجمالي:</span>
              <span>{group.price_per_session} د.ك</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>طريقة الدفع</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid gap-4">
              <div className="flex items-center justify-between border p-4 rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="w-4 h-4" />
                    بطاقة ائتمان / كي نت
                  </Label>
                </div>
              </div>
              <div className="flex items-center justify-between border p-4 rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="wallet" id="wallet" />
                  <Label htmlFor="wallet" className="flex items-center gap-2 cursor-pointer">
                    <Wallet className="w-4 h-4" />
                    المحفظة الإلكترونية
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <Button 
            className="w-full bg-green-600 hover:bg-green-700" 
            onClick={() => enrollMutation.mutate()}
            disabled={enrollMutation.isPending}
          >
            {enrollMutation.isPending ? "جاري المعالجة..." : `دفع ${group.price_per_session} د.ك وتأكيد`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}