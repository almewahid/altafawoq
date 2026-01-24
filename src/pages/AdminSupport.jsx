import { useEffect, useState } from 'react';
import { supabase } from '@/components/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Calendar,
  MessageSquare,
  Trash2,
  CheckCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function AdminSupport() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ContactRequest')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'pending') query = query.eq('status', 'معلق');
      if (filter === 'replied') query = query.eq('status', 'تم الرد');
      if (filter === 'closed') query = query.eq('status', 'مغلق');

      const { data, error } = await query;
      if (error) throw error;

      setRequests(data || []);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('ContactRequest')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      fetchRequests();
    } catch {
      alert('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const removeRequest = async (id) => {
    if (!confirm('هل أنت متأكد من حذف الرسالة؟')) return;

    try {
      const { error } = await supabase
        .from('ContactRequest')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchRequests();
    } catch {
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const statusBadge = (status) => {
    const map = {
      'معلق': { color: 'bg-amber-100 text-amber-800', icon: Clock },
      'تم الرد': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'مغلق': { color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
    };

    const Item = map[status] || map['معلق'];
    const Icon = Item.icon;

    return (
      <Badge className={`${Item.color} flex gap-1 items-center`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const filters = [
    { label: 'الكل', value: 'all' },
    { label: 'معلق', value: 'pending' },
    { label: 'تم الرد', value: 'replied' },
    { label: 'مغلق', value: 'closed' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-emerald-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-emerald-50 to-amber-50" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">إدارة رسائل الدعم</h1>
              <p className="text-slate-600">عدد الرسائل: {requests.length}</p>
            </div>

            <Link to={createPageUrl('Admin')}>
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                لوحة الإدارة
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Requests */}
        {requests.length === 0 ? (
          <Card className="text-center p-12">
            <MessageSquare className="w-14 h-14 mx-auto text-gray-300 mb-4" />
            <p>لا توجد رسائل</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((req, i) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{req.name}</CardTitle>
                        {statusBadge(req.status)}
                      </div>
                    </div>

                    <div className="flex gap-4 text-sm text-slate-500 mt-2">
                      <span className="flex gap-1 items-center">
                        <Mail className="w-4 h-4" />
                        {req.email}
                      </span>
                      <span className="flex gap-1 items-center">
                        <Calendar className="w-4 h-4" />
                        {formatDate(req.created_at)}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="mb-4 whitespace-pre-wrap">{req.message}</p>

                    <div className="flex gap-2 flex-wrap">
                      {req.status !== 'تم الرد' && (
                        <Button size="sm" onClick={() => changeStatus(req.id, 'تم الرد')}>
                          تم الرد
                        </Button>
                      )}

                      {req.status !== 'مغلق' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => changeStatus(req.id, 'مغلق')}
                        >
                          إغلاق
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => removeRequest(req.id)}
                      >
                        <Trash2 className="w-4 h-4 ml-1" />
                        حذف
                      </Button>

                      <a
                        href={`mailto:${req.email}`}
                        className="px-3 py-2 border rounded-md text-sm"
                      >
                        الرد عبر البريد
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
