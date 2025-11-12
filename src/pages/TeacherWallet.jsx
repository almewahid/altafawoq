import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wallet,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Download,
  Plus
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function TeacherWalletPage() {
  const queryClient = useQueryClient();
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: 0,
    bank_name: "",
    account_number: "",
    account_holder: "",
    iban: ""
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: wallet } = useQuery({
    queryKey: ['teacherWallet', user?.email],
    queryFn: async () => {
      const wallets = await base44.entities.Wallet.filter({ user_email: user?.email });
      if (wallets.length > 0) return wallets[0];
      
      // Create wallet if doesn't exist
      return await base44.entities.Wallet.create({
        user_email: user?.email,
        balance: 0,
        currency: 'KWD',
        total_earnings: 0,
        total_withdrawn: 0,
        pending_amount: 0
      });
    },
    enabled: !!user?.email,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['teacherPayments', user?.email],
    queryFn: () => base44.entities.Payment.filter({ 
      teacher_email: user?.email,
      status: 'completed'
    }),
    enabled: !!user?.email,
  });

  const { data: withdrawalRequests = [] } = useQuery({
    queryKey: ['withdrawalRequests', user?.email],
    queryFn: () => base44.entities.WithdrawalRequest.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const requestWithdrawalMutation = useMutation({
    mutationFn: (data) => base44.entities.WithdrawalRequest.create({
      ...data,
      user_email: user?.email,
      currency: wallet?.currency || 'KWD',
      status: 'pending'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['withdrawalRequests']);
      setShowWithdrawDialog(false);
      setWithdrawForm({
        amount: 0,
        bank_name: "",
        account_number: "",
        account_holder: "",
        iban: ""
      });
    },
  });

  const handleWithdraw = () => {
    if (withdrawForm.amount <= 0 || withdrawForm.amount > (wallet?.balance || 0)) {
      alert("المبلغ غير صحيح");
      return;
    }

    requestWithdrawalMutation.mutate({
      amount: withdrawForm.amount,
      bank_account: {
        bank_name: withdrawForm.bank_name,
        account_number: withdrawForm.account_number,
        account_holder: withdrawForm.account_holder,
        iban: withdrawForm.iban
      }
    });
  };

  const getCurrencySymbol = (currency) => {
    const symbols = {
      'KWD': 'د.ك',
      'SAR': 'ر.س',
      'AED': 'د.إ',
      'EGP': 'ج.م',
      'USD': '$',
      'EUR': '€'
    };
    return symbols[currency] || 'د.ك';
  };

  const stats = [
    {
      title: "الرصيد المتاح",
      value: `${(wallet?.balance || 0).toFixed(2)} ${getCurrencySymbol(wallet?.currency)}`,
      icon: Wallet,
      color: "green",
      description: "قابل للسحب"
    },
    {
      title: "إجمالي الأرباح",
      value: `${(wallet?.total_earnings || 0).toFixed(2)} ${getCurrencySymbol(wallet?.currency)}`,
      icon: TrendingUp,
      color: "blue",
      description: "منذ البداية"
    },
    {
      title: "المبلغ المعلق",
      value: `${(wallet?.pending_amount || 0).toFixed(2)} ${getCurrencySymbol(wallet?.currency)}`,
      icon: Clock,
      color: "orange",
      description: "قيد المعالجة"
    },
    {
      title: "إجمالي السحوبات",
      value: `${(wallet?.total_withdrawn || 0).toFixed(2)} ${getCurrencySymbol(wallet?.currency)}`,
      icon: Download,
      color: "purple",
      description: "مكتملة"
    },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">المحفظة</h1>
            <p className="text-gray-600">إدارة أرباحك وطلبات السحب</p>
          </div>

          <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
            <DialogTrigger asChild>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                disabled={(wallet?.balance || 0) < 10}
              >
                <Download className="w-4 h-4 ml-2" />
                طلب سحب
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>طلب سحب أرباح</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">الرصيد المتاح</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(wallet?.balance || 0).toFixed(2)} {getCurrencySymbol(wallet?.currency)}
                  </p>
                </div>

                <div>
                  <Label>المبلغ المطلوب سحبه</Label>
                  <Input
                    type="number"
                    value={withdrawForm.amount}
                    onChange={(e) => setWithdrawForm({...withdrawForm, amount: parseFloat(e.target.value)})}
                    placeholder="0"
                    max={wallet?.balance || 0}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    الحد الأدنى للسحب: 10 {getCurrencySymbol(wallet?.currency)}
                  </p>
                </div>

                <div>
                  <Label>اسم البنك</Label>
                  <Input
                    value={withdrawForm.bank_name}
                    onChange={(e) => setWithdrawForm({...withdrawForm, bank_name: e.target.value})}
                    placeholder="البنك الأهلي الكويتي"
                  />
                </div>

                <div>
                  <Label>رقم الحساب</Label>
                  <Input
                    value={withdrawForm.account_number}
                    onChange={(e) => setWithdrawForm({...withdrawForm, account_number: e.target.value})}
                    placeholder="1234567890"
                  />
                </div>

                <div>
                  <Label>اسم صاحب الحساب</Label>
                  <Input
                    value={withdrawForm.account_holder}
                    onChange={(e) => setWithdrawForm({...withdrawForm, account_holder: e.target.value})}
                    placeholder="الاسم الكامل"
                  />
                </div>

                <div>
                  <Label>رقم IBAN (اختياري)</Label>
                  <Input
                    value={withdrawForm.iban}
                    onChange={(e) => setWithdrawForm({...withdrawForm, iban: e.target.value})}
                    placeholder="KW..."
                  />
                </div>

                <Button
                  onClick={handleWithdraw}
                  disabled={!withdrawForm.amount || !withdrawForm.bank_name || !withdrawForm.account_number || !withdrawForm.account_holder || requestWithdrawalMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {requestWithdrawalMutation.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                  <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Payments */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>آخر المدفوعات</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">لا توجد مدفوعات بعد</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>صافي الربح</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.slice(0, 10).map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {format(new Date(payment.created_date), 'dd MMM yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        {payment.payment_type === 'enrollment' ? 'اشتراك' : 
                         payment.payment_type === 'service' ? 'خدمة' : 'جلسة'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {payment.amount} {getCurrencySymbol(payment.currency)}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {payment.teacher_earnings} {getCurrencySymbol(payment.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">مكتمل</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal Requests */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>طلبات السحب</CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawalRequests.length === 0 ? (
              <div className="text-center py-8">
                <Download className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">لا توجد طلبات سحب</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>البنك</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawalRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        {format(new Date(request.created_date), 'dd MMM yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {request.amount} {getCurrencySymbol(request.currency)}
                      </TableCell>
                      <TableCell>{request.bank_account?.bank_name}</TableCell>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}