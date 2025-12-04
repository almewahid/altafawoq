import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/components/SupabaseClient";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Browse() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");

  const { data: items = [] } = useQuery({
    queryKey: ['browse', type, search],
    queryFn: async () => {
      let query = supabase.from('study_groups').select('*');
      if (search) query = query.ilike('name', `%${search}%`);
      const { data } = await query;
      return data || [];
    }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">تصفح المجموعات والمعلمين</h1>
      
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="ابحث عن مادة، معلم، أو مجموعة..." 
            className="pr-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 ml-2" />
          تصفية
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="cursor-pointer hover:shadow-md" onClick={() => navigate(createPageUrl("GroupDetails") + `?id=${item.id}`)}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.subject}</p>
                </div>
                <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                  {item.stage}
                </div>
              </div>
              <p className="text-gray-600 text-sm line-clamp-2 mb-4">{item.description}</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                عرض التفاصيل
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}