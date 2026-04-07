import { Truck, Shield, RotateCcw, Headphones } from 'lucide-react';
import { STORE } from '@/lib/store-info';

const features = [
  {
    icon: Truck,
    title: 'Giao Hang Tan Noi',
    description: 'Mien phi van chuyen cho don hang tu 2 trieu. Giao hang nhanh trong 2-5 ngay lam viec.',
    color: 'bg-primary-50 text-primary-500',
  },
  {
    icon: Shield,
    title: 'Bao Hanh Chinh Hang',
    description: 'Tat ca san pham duoc bao hanh tu 12-36 thang. Cam ket san pham chinh hang 100%.',
    color: 'bg-secondary-50 text-secondary-500',
  },
  {
    icon: RotateCcw,
    title: 'Doi Tra De Dang',
    description: 'Doi tra hang trong vong 30 ngay neu san pham co loi. Thu tuc nhanh gon, don gian.',
    color: 'bg-accent-50 text-accent-500',
  },
  {
    icon: Headphones,
    title: 'Ho Tro 24/7',
    description: 'Doi ngu cham soc khach hang luon san sang tu van va ho tro ban bat cu luc nao.',
    color: 'bg-info-50 text-info-500',
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-12 lg:py-16 bg-surface-200">
      <div className="container-custom">
        <div className="text-center mb-10">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Tại Sao Chọn {STORE.name}?</h2>
          <p className="mt-2 text-gray-500">Cam kết mang đến trải nghiệm mua sắm tốt nhất cho bạn</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="flex flex-col items-center text-center p-6 rounded-xl bg-white border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow duration-300"
              >
                <div className={`h-14 w-14 rounded-2xl ${f.color} flex items-center justify-center mb-4`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
