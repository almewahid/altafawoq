import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/components/SupabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TeacherGroups() {
  const navigate = useNavigate();
  const { data: groups = [] } = useQuery({
    queryKey: ['teacherGroups'],
    queryFn: async () => {
      const user = await supabase.auth.getCurrentUserWithProfile();
      if (!user) return [];
      const { data } = await supabase.from('study_groups').select('*').eq('teacher_email', user.email);
      return data || [];
    }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">مجموعاتي الدراسية</h1>
        <Button onClick={() => {}} className="bg-green-600">
          <Plus className="w-4 h-4 ml-2" />
          مجموعة جديدة
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {groups.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-gray-50 rounded-lg">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">لم تقم بإنشاء أي مجموعات بعد</p>
          </div>
        ) : (
          groups.map(group => (
            <Card key={group.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl("GroupDetails") + `?id=${group.id}`)}>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">{group.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{group.subject} - {group.stage}</p>
                <div className="flex justify-between text-sm">
                  <span>{group.students?.length || 0} طلاب</span>
                  <span className="text-green-600">{group.price_per_session} د.ك</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}