'use client';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { STORE } from '@/lib/store-info';

const CONTACT_INFO = [
  { icon: Phone, label: 'Hotline', value: STORE.phone || '039 465 5656', href: `tel:${(STORE.phone || '').replace(/\s/g, '')}` },
  { icon: Mail, label: 'Email', value: STORE.email || 'nguyenngochuyen27031998@gmail.com', href: `mailto:${STORE.email || ''}` },
  { icon: MapPin, label: 'Địa chỉ', value: STORE.address },
  { icon: Clock, label: 'Giờ làm việc', value: 'T2 - CN: 8:00 - 21:00' },
];

export default function ContactPage() {
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Da gui tin nhan! Chung toi se lien he lai ban som.');
    (e.target as HTMLFormElement).reset();
    setSending(false);
  };

  return (
    <div className="container-custom py-8 lg:py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Lien He Voi Chung Toi</h1>
        <p className="text-gray-500 mt-2">Ban can ho tro? Hay lien he voi chung toi qua cac kenh ben duoi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
        {/* Contact info */}
        <div className="lg:col-span-2 space-y-4">
          {CONTACT_INFO.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-card"
            >
              <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                <item.icon className="h-5 w-5 text-primary-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{item.label}</p>
                {item.href ? (
                  <a href={item.href} className="font-medium text-gray-900 hover:text-primary-600">
                    {item.value}
                  </a>
                ) : (
                  <p className="font-medium text-gray-900">{item.value}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-card p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Gui Tin Nhan</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ho ten *</Label>
                <Input required placeholder="Nguyen Van A" />
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" required placeholder="email@example.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>So dien thoai</Label>
              <Input type="tel" placeholder="0912 345 678" />
            </div>
            <div className="space-y-1.5">
              <Label>Noi dung *</Label>
              <Textarea required rows={4} placeholder="Noi dung can ho tro..." />
            </div>
            <Button type="submit" className="gap-2" disabled={sending}>
              <Send className="h-4 w-4" />
              {sending ? 'Dang gui...' : 'Gui tin nhan'}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
