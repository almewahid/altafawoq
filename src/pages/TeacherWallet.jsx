import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export default function TeacherWallet() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">المحفظة</h1>
      
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 mb-1">الرصيد الحالي</p>
              <h2 className="text-4xl font-bold">1,250.00 د.ك</h2>
            </div>
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Wallet className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="flex gap-4 mt-8">
            <Button className="bg-white text-blue-600 hover:bg-blue-50 border-0">
              <ArrowUpRight className="w-4 h-4 ml-2" />
              سحب الرصيد
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white/10">
              <ArrowDownLeft className="w-4 h-4 ml-2" />
              إيداع
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سجل العمليات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">لا توجد عمليات حديثة</div>
        </CardContent>
      </Card>
    </div>
  );
}