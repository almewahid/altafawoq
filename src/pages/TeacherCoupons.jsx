import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Tag, Trash2, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";

export default function TeacherCouponsPage() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['teacherCoupons', user?.email],
    queryFn: () => base44.entities.Coupon.filter({ teacher_email: user?.email }),
    enabled: !!user?.email,
  });

  const [formData, setFormData] = useState({
    code: "",
    discount_percentage: 0,
    discount_amount: 0,
    valid_from: "",
    valid_until: "",
    max_uses: 0,
    is_active: true
  });

  const createCouponMutation = useMutation({
    mutationFn: (data) => base44.entities.Coupon.create({
      ...data,
      teacher_email: user?.email,
      current_uses: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacherCoupons']);
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: (id) => base44.entities.Coupon.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacherCoupons']);
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      discount_percentage: 0,
      discount_amount: 0,
      valid_from: "",
      valid_until: "",
      max_uses: 0,
      is_active: true
    });
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({...formData, code});
  };

  const handleSaveCoupon = () => {
    createCouponMutation.mutate(formData);
  };

  const handleDelete = (id) => {
    if (confirm("هل أنت متأكد من حذف هذا الكوبون؟")) {
      deleteCouponMutation.mutate(id);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الكوبونات</h1>
            <p className="text-gray-600">أنشئ كوبونات خصم لجذب المزيد من الطلاب</p>
          </div>

          <Dialog open={showDialog} onOpenChange={(open) => {
            setShowDialog(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 ml-2" />
                كوبون جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl">إنشاء كوبون جديد</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div>
                  <Label>كود الكوبون *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="SAVE20"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={generateRandomCode}>
                      توليد
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>نسبة الخصم (%)</Label>
                    <Input
                      type="number"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({...formData, discount_percentage: parseFloat(e.target.value), discount_amount: 0})}
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <Label>قيمة الخصم (دينار)</Label>
                    <Input
                      type="number"
                      value={formData.discount_amount}
                      onChange={(e) => setFormData({...formData, discount_amount: parseFloat(e.target.value), discount_percentage: 0})}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>بداية الصلاحية</Label>
                    <Input
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label>نهاية الصلاحية</Label>
                    <Input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label>الحد الأقصى للاستخدام (0 = غير محدود)</Label>
                  <Input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({...formData, max_uses: parseInt(e.target.value)})}
                    placeholder="0"
                  />
                </div>

                <Button 
                  onClick={handleSaveCoupon} 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={createCouponMutation.isPending || !formData.code}
                >
                  {createCouponMutation.isPending ? "جاري الحفظ..." : "إنشاء الكوبون"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري التحميل...</p>
          </div>
        ) : coupons.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Tag className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد كوبونات بعد</h3>
              <p className="text-gray-600 mb-6">أنشئ كوبونات خصم لجذب المزيد من الطلاب</p>
              <Button 
                onClick={() => setShowDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 ml-2" />
                إنشاء كوبون جديد
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon) => (
              <Card key={coupon.id} className="border-0 shadow-lg hover:shadow-xl transition-all">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white font-bold text-lg tracking-wider">
                          {coupon.code}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(coupon.code)}
                        >
                          {copiedCode === coupon.code ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                        {coupon.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">الخصم</span>
                      <span className="font-bold text-green-600 text-lg">
                        {coupon.discount_percentage > 0 
                          ? `${coupon.discount_percentage}%` 
                          : `${coupon.discount_amount} د.ك`}
                      </span>
                    </div>

                    {coupon.valid_from && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">يبدأ من</span>
                        <span className="font-semibold">
                          {format(new Date(coupon.valid_from), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    )}

                    {coupon.valid_until && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">ينتهي في</span>
                        <span className="font-semibold">
                          {format(new Date(coupon.valid_until), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">الاستخدامات</span>
                      <span className="font-semibold">
                        {coupon.current_uses || 0} / {coupon.max_uses || '∞'}
                      </span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(coupon.id)}
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف الكوبون
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}