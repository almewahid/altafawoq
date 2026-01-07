import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TeacherCoupons() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">كوبونات الخصم</h1>
        <Button onClick={() => navigate(createPageUrl("CreateCoupon"))} className="bg-green-600">
          <Plus className="w-4 h-4 ml-2" />
          كوبون جديد
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Tag className="w-12 h-12 mb-2 opacity-20" />
            <p>لا توجد كوبونات نشطة</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}