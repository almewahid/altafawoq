import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/components/SupabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Wallet, CheckCircle2, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function PaymentCheckout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get("amount") || "0";
  const title = searchParams.get("title") || "دفع مستحقات";
  const type = searchParams.get("type") || "service"; // service, enrollment, etc.
  const id = searchParams.get("id"); // related entity id

  const [method, setMethod] = React.useState("card");
  const [loading, setLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const user = await supabase.auth.getCurrentUserWithProfile();
      if (!user) throw new Error("يجب تسجيل الدخول");

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real app, this would call a backend function to process payment
      // Here we just create a record
      const { error } = await supabase.from('payments').insert({
        student_email: user.email,
        teacher_email: searchParams.get("teacher_email") || "system", // Should be passed in params
        amount: Number(amount),
        currency: "KWD",
        payment_type: type,
        related_id: id,
        payment_method: method === 'paypal' ? 'paypal' : 'credit_card',
        status: 'completed',
        transaction_id: `TXN-${Date.now()}`
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success("تمت عملية الدفع بنجاح!");
      
      setTimeout(() => {
        navigate(createPageUrl("StudentDashboard"));
      }, 3000);

    } catch (error) {
      toast.error("فشلت عملية الدفع: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-12 pb-8 space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">تم الدفع بنجاح!</h2>
            <p className="text-gray-500">تم استلام المبلغ وتفعيل الخدمة فوراً.</p>
            <div className="bg-gray-50 p-4 rounded-lg mt-6 text-sm">
              <div className="flex justify-between mb-2">
                <span>رقم المعاملة</span>
                <span className="font-mono">TXN-{Date.now().toString().slice(-6)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>المبلغ المدفوع</span>
                <span>{amount} د.ك</span>
              </div>
            </div>
            <Button className="w-full mt-4 bg-green-600" onClick={() => navigate(createPageUrl("StudentDashboard"))}>
              العودة للوحة التحكم
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowRight className="w-4 h-4 ml-2" />
          عودة
        </Button>

        <Card className="shadow-lg overflow-hidden">
          <div className="bg-gray-900 p-6 text-white">
            <h1 className="text-xl font-bold mb-1">إتمام عملية الدفع</h1>
            <p className="text-gray-400 text-sm">أنت على وشك الدفع مقابل: {title}</p>
            <div className="mt-6 text-3xl font-bold">
              {amount} <span className="text-lg font-normal text-gray-400">د.ك</span>
            </div>
          </div>
          
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <Label className="text-base">اختر طريقة الدفع</Label>
              <RadioGroup value={method} onValueChange={setMethod} className="grid gap-4">
                <div className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${method === 'card' ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="cursor-pointer flex items-center gap-3">
                      <div className="p-2 bg-white rounded-md border shadow-sm">
                        <CreditCard className="w-5 h-5 text-gray-700" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">بطاقة بنكية / K-Net</div>
                        <div className="text-xs text-gray-500">دفع آمن ومباشر</div>
                      </div>
                    </Label>
                  </div>
                </div>

                <div className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${method === 'paypal' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal" className="cursor-pointer flex items-center gap-3">
                      <div className="p-2 bg-white rounded-md border shadow-sm">
                        {/* Simple PayPal Icon Representation */}
                        <span className="font-bold text-blue-800 italic">Pay</span><span className="font-bold text-cyan-600 italic">Pal</span>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">PayPal</div>
                        <div className="text-xs text-gray-500">الدفع السريع عالمياً</div>
                      </div>
                    </Label>
                  </div>
                </div>

                <div className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${method === 'wallet' ? 'border-yellow-600 bg-yellow-50 ring-1 ring-yellow-600' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <RadioGroupItem value="wallet" id="wallet" />
                    <Label htmlFor="wallet" className="cursor-pointer flex items-center gap-3">
                      <div className="p-2 bg-white rounded-md border shadow-sm">
                        <Wallet className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">المحفظة الإلكترونية</div>
                        <div className="text-xs text-gray-500">استخدم رصيدك الحالي</div>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg flex gap-3 items-start text-xs text-gray-500">
              <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
              <p>جميع المعاملات مشفرة ومؤمنة بالكامل بتقنية SSL. نحن لا نقوم بتخزين معلومات بطاقتك البنكية.</p>
            </div>
          </CardContent>
          
          <CardFooter className="p-6 pt-0">
            <Button 
              className="w-full h-12 text-lg bg-gray-900 hover:bg-gray-800" 
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <span>تأكيد الدفع ({amount} د.ك)</span>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}