import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/components/SupabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Users, Mail, BookOpen, TrendingUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function TeacherStudents() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => supabase.auth.getCurrentUserWithProfile(),
  });

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['teacherStudents', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      // 1. Get all groups for this teacher
      const { data: groups } = await supabase
        .from('study_groups')
        .select('id, name, students')
        .eq('teacher_email', user.email);

      if (!groups) return [];

      // 2. Collect unique student emails
      const studentMap = new Map(); // email -> { details, groups: [] }

      groups.forEach(group => {
        if (group.students && Array.isArray(group.students)) {
          group.students.forEach(email => {
            if (!studentMap.has(email)) {
              studentMap.set(email, { email, groups: [] });
            }
            studentMap.get(email).groups.push(group.name);
          });
        }
      });

      const emails = Array.from(studentMap.keys());
      if (emails.length === 0) return [];

      // 3. Fetch profiles for these students
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .in('email', emails);

      // 4. Merge data
      return emails.map(email => {
        const profile = profiles?.find(p => p.email === email) || { full_name: "طالب غير مسجل", email };
        const studentData = studentMap.get(email);
        return {
          ...profile,
          enrolledGroups: studentData.groups
        };
      });
    },
    enabled: !!user?.email
  });

  const filteredStudents = students.filter(student => 
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">طلابي</h1>
          <p className="text-gray-500">إدارة ومتابعة الطلاب المسجلين في مجموعاتك</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="بحث عن طالب..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12">جاري تحميل الطلاب...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">لا يوجد طلاب حالياً</h3>
            <p className="text-gray-500">لم ينضم أي طلاب إلى مجموعاتك الدراسية بعد</p>
          </div>
        ) : (
          filteredStudents.map((student, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 border-2 border-green-100">
                      <AvatarImage src={student.avatar_url} />
                      <AvatarFallback>{student.full_name?.charAt(0) || 'S'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-gray-900">{student.full_name}</h3>
                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <Mail className="w-3 h-3" />
                        {student.email}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">المجموعات المسجل بها:</label>
                    <div className="flex flex-wrap gap-2">
                      {student.enrolledGroups.map((g, i) => (
                        <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-2" 
                    variant="outline"
                    onClick={() => navigate(createPageUrl("StudentProgressDetail") + `?email=${student.email}`)}
                  >
                    <TrendingUp className="w-4 h-4 ml-2" />
                    عرض تقدم الطالب
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}