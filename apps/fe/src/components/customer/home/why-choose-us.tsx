import { Truck, Shield, RotateCcw, Headphones } from 'lucide-react';
import { STORE } from '@/lib/store-info';

const features = [
  {
    icon: Truck,
    title: 'Giao Hàng Tận Nơi',
    description: 'Miễn phí vận chuyển cho đơn hàng từ 2 triệu. Giao hàng nhanh trong 2-5 ngày làm việc.',
    color: 'bg-primary-50 text-primary-500',
  },
  {
    icon: Shield,
    title: 'Bảo Hành Chính Hãng',
    description: 'Tất cả sản phẩm được bảo hành từ 12-36 tháng. Cam kết sản phẩm chính hãng 100%.',
    color: 'bg-secondary-50 text-secondary-500',
  },
  {
    icon: RotateCcw,
    title: 'Đổi Trả Dễ Dàng',
    description: 'Đổi trả hàng trong vòng 30 ngày nếu sản phẩm có lỗi. Thủ tục nhanh gọn, đơn giản.',
    color: 'bg-accent-50 text-accent-500',
  },
  {
    icon: Headphones,
    title: 'Hỗ Trợ 24/7',
    description: 'Đội ngũ chăm sóc khách hàng luôn sẵn sàng tư vấn và hỗ trợ bạn bất cứ lúc nào.',
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
