import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/components/SupabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle } from "lucide-react";

export default function StudentAssignments() {
  const { data: assignments = [] } = useQuery({
    queryKey: ['studentAssignmentsPage'],
    queryFn: async () => {
      // Mock data
      return [
        { id: 1, title: "واجب الرياضيات #3", status: "pending", dueDate: "2024-12-10", group: "مجموعة أستاذي" },
        { id: 2, title: "تقرير الفيزياء", status: "submitted", dueDate: "2024-12-05", group: "الفيزياء الحديثة" },
      ];
    }
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">الواجبات والمهام</h1>
      
      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${assignment.status === 'submitted' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                  {assignment.status === 'submitted' ? <CheckCircle className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{assignment.title}</h3>
                  <p className="text-sm text-gray-500">{assignment.group}</p>
                </div>
              </div>
              <div className="text-left">
                <Badge variant={assignment.status === 'submitted' ? 'default' : 'outline'}>
                  {assignment.status === 'submitted' ? 'تم التسليم' : 'قيد الانتظار'}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">تاريخ التسليم: {assignment.dueDate}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}