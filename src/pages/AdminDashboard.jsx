import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Settings } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">لوحة الإدارة</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-gray-500">المستخدمين</p>
              <h3 className="text-2xl font-bold">1,234</h3>
            </div>
          </CardContent>
        </Card>
        {/* More admin cards */}
      </div>
    </div>
  );
}