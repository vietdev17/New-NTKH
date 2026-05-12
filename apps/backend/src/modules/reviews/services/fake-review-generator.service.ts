import { Injectable } from '@nestjs/common';
import { ProductDocument } from '../../products/schemas/product.schema';
import { CategoryDocument } from '../../categories/schemas/category.schema';

const FAKE_REVIEWER_NAMES = [
  'Ngọc Anh', 'Minh Châu', 'Khánh Linh', 'Quỳnh Như', 'Bảo Trâm', 'Mai Phương', 'Thu Hà', 'Tú Anh',
  'Gia Hân', 'Thanh Huyền', 'Lan Chi', 'Hà My', 'Minh Khang', 'Quốc Bảo', 'Tuấn Hưng', 'Đức Mạnh',
  'Hoàng Nam', 'Anh Khoa', 'Minh Triết', 'Gia Bảo', 'Nhật Minh', 'Thiên Phúc', 'Khả Hân', 'Bích Ngọc',
  'Thảo Vy', 'Yến Nhi', 'Phương Linh', 'Mỹ Duyên', 'Trúc Anh', 'Bảo Ngân', 'Kiều Oanh', 'Hải Yến',
];

const FAKE_REVIEWER_AVATARS = [
  'https://i.pravatar.cc/150?img=11',
  'https://i.pravatar.cc/150?img=12',
  'https://i.pravatar.cc/150?img=13',
  'https://i.pravatar.cc/150?img=14',
  'https://i.pravatar.cc/150?img=15',
  'https://i.pravatar.cc/150?img=16',
  'https://i.pravatar.cc/150?img=17',
  'https://i.pravatar.cc/150?img=18',
  'https://i.pravatar.cc/150?img=19',
  'https://i.pravatar.cc/150?img=20',
  'https://i.pravatar.cc/150?img=21',
  'https://i.pravatar.cc/150?img=22',
];

const REVIEW_TEMPLATES = {
  5: [
    'Mẫu {productType} này đẹp hơn mong đợi, chất liệu {material} nhìn rất sang và hoàn thiện chỉn chu.',
    'Đặt {productType} cho {space} mà lên tổng thể rất ưng, màu sắc hài hòa và dùng thấy chắc chắn.',
    '{brandPart}Gia đình mình khá hài lòng với {productName}, nhìn thực tế đẹp và cảm giác sử dụng rất tốt.',
    'Phần {highlight} của {productName} làm mình ấn tượng nhất, nhìn kỹ vẫn thấy hoàn thiện đẹp.',
    '{productName} phối với nội thất sẵn có rất dễ, đúng kiểu mình đang tìm cho {space}.',
  ],
  4: [
    '{productName} nhìn ổn, dùng thực tế khá tốt và hợp với {space}, chỉ là giao tới chậm hơn dự kiến một chút.',
    'Tổng thể {productType} này đáng tiền, chất liệu {material} ổn và ngồi/đặt sử dụng thoải mái.',
    '{brandPart}Mẫu này lên hình đẹp, ngoài thực tế vẫn ổn, phù hợp cho ai thích kiểu {style}.',
    'Mình đánh giá khá tốt cho {productName}, hoàn thiện ổn và kích thước hợp lý cho {space}.',
  ],
  3: [
    '{productName} dùng được, kiểu dáng ổn nhưng phần hoàn thiện chưa thật sự nổi bật như kỳ vọng.',
    'Sản phẩm ở mức khá, hợp với tầm giá nhưng vẫn còn vài chi tiết có thể làm tốt hơn.',
    '{productType} này nhìn ổn trong {space}, tuy nhiên trải nghiệm thực tế chưa tạo cảm giác quá khác biệt.',
  ],
  2: [
    'Mẫu {productType} này tạm ổn nhưng màu thực tế chưa đẹp như mình nghĩ, phần hoàn thiện còn hơi thô.',
    '{productName} không tệ nhưng chưa tương xứng lắm với kỳ vọng ban đầu, nhất là ở phần {highlight}.',
    'Dùng vẫn được nhưng cảm giác tổng thể của {productName} chưa thật sự thuyết phục.',
  ],
  1: [
    'Mình khá thất vọng với {productName}, phần hoàn thiện và trải nghiệm thực tế chưa như mong đợi.',
    '{productType} này chưa hợp với nhu cầu của mình, nhìn ngoài thực tế không ưng bằng mô tả.',
  ],
} as const;

const REVIEW_TITLES = {
  5: ['Rất đáng tiền', 'Hoàn thiện rất tốt', 'Đẹp và chắc chắn', 'Cực kỳ hài lòng'],
  4: ['Khá hài lòng', 'Ổn trong tầm giá', 'Đẹp như kỳ vọng', 'Dùng tốt'],
  3: ['Tạm ổn', 'Ở mức khá', 'Chưa quá nổi bật'],
  2: ['Chưa ưng lắm', 'Kỳ vọng nhiều hơn'],
  1: ['Khá thất vọng', 'Chưa đúng kỳ vọng'],
} as const;

interface SyntheticReviewInput {
  product: ProductDocument;
  category?: CategoryDocument | null;
}

interface SyntheticReviewPayload {
  rating: number;
  title: string;
  comment: string;
  reviewerName: string;
  reviewerAvatar: string;
  helpfulCount: number;
  unhelpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  status: 'approved';
  isSynthetic: true;
  source: 'system_fake';
  images: string[];
  helpfulVotes: [];
  adminNote: null;
  isDeleted: false;
}

@Injectable()
export class FakeReviewGeneratorService {
  generateForProduct({ product, category }: SyntheticReviewInput): SyntheticReviewPayload[] {
    const reviewCount = this.randomInt(4, 8);
    const names = this.pickUniqueNames(reviewCount);
    const usedComments = new Set<string>();

    return names.map((reviewerName, index) => {
      const rating = this.weightedRandomRating();
      const title = this.pickRandom(REVIEW_TITLES[rating]);
      const comment = this.buildUniqueComment({ product, category, rating, usedComments, seed: index });

      return {
        rating,
        title,
        comment,
        reviewerName,
        reviewerAvatar: FAKE_REVIEWER_AVATARS[index % FAKE_REVIEWER_AVATARS.length],
        helpfulCount: this.randomInt(0, 18),
        unhelpfulCount: rating >= 4 ? this.randomInt(0, 2) : this.randomInt(0, 4),
        createdAt: this.randomDate(120),
        updatedAt: new Date(),
        status: 'approved',
        isSynthetic: true,
        source: 'system_fake',
        images: [],
        helpfulVotes: [],
        adminNote: null,
        isDeleted: false,
      };
    });
  }

  private buildUniqueComment({
    product,
    category,
    rating,
    usedComments,
    seed,
  }: {
    product: ProductDocument;
    category?: CategoryDocument | null;
    rating: number;
    usedComments: Set<string>;
    seed: number;
  }): string {
    const templates = [...REVIEW_TEMPLATES[rating]];
    const categoryName = category?.name?.toLowerCase() || 'sản phẩm';
    const productType = this.describeProductType(product, categoryName);
    const material = product.material?.toLowerCase() || 'ổn';
    const brandPart = product.brand ? `${product.brand} làm mình yên tâm hơn khi chọn. ` : '';
    const space = this.pickRandom(['phòng khách', 'phòng ngủ', 'căn hộ', 'nhà mới', 'góc làm việc']);
    const style = this.pickRandom(['hiện đại', 'ấm cúng', 'tối giản', 'sang nhẹ']);
    const highlight = this.pickRandom(this.collectHighlights(product));

    while (templates.length > 0) {
      const template = templates.splice(this.randomInt(0, templates.length - 1), 1)[0];
      const comment = template
        .replace(/\{productName\}/g, product.name)
        .replace(/\{productType\}/g, productType)
        .replace(/\{material\}/g, material)
        .replace(/\{brandPart\}/g, brandPart)
        .replace(/\{space\}/g, space)
        .replace(/\{style\}/g, style)
        .replace(/\{highlight\}/g, highlight);

      const uniqueComment = `${comment} ${this.commentEnding(rating, seed)}`.trim();
      if (!usedComments.has(uniqueComment)) {
        usedComments.add(uniqueComment);
        return uniqueComment;
      }
    }

    const fallback = `${product.name} ${this.commentEnding(rating, seed)} ${seed + 1}`;
    usedComments.add(fallback);
    return fallback;
  }

  private collectHighlights(product: ProductDocument): string[] {
    const highlights = ['độ hoàn thiện', 'chất liệu', 'màu sắc'];
    if (product.dimensions?.length) highlights.push('kích thước');
    if (product.colors?.length) highlights.push('phối màu');
    if (product.shortDescription) highlights.push('thiết kế tổng thể');
    return highlights;
  }

  private describeProductType(product: ProductDocument, categoryName: string): string {
    const raw = categoryName || product.name;
    const lower = raw.toLowerCase();
    if (lower.includes('sofa')) return 'sofa';
    if (lower.includes('bàn')) return 'bàn';
    if (lower.includes('ghế')) return 'ghế';
    if (lower.includes('giường')) return 'giường';
    if (lower.includes('tủ')) return 'tủ';
    if (lower.includes('kệ')) return 'kệ';
    return 'mẫu nội thất';
  }

  private commentEnding(rating: number, seed: number): string {
    if (rating >= 5) return this.pickRandom(['Rất đáng mua.', 'Nhìn chung rất hài lòng.', 'Sẽ giới thiệu thêm cho bạn bè.']);
    if (rating === 4) return this.pickRandom(['Vẫn khá đáng cân nhắc.', 'Tổng thể mình vẫn hài lòng.', 'Khá phù hợp với nhu cầu hiện tại.']);
    if (rating === 3) return this.pickRandom(['Chấm mức khá thôi.', 'Tạm ổn trong tầm giá.', 'Cần cải thiện thêm một chút.']);
    if (rating === 2) return this.pickRandom(['Hy vọng shop cải thiện thêm.', `Trải nghiệm lần này chưa tốt lắm ${seed + 1}.`]);
    return this.pickRandom(['Cá nhân mình chưa hài lòng.', 'Có lẽ mình sẽ cân nhắc mẫu khác.']);
  }

  private weightedRandomRating(): 1 | 2 | 3 | 4 | 5 {
    const r = Math.random();
    if (r < 0.46) return 5;
    if (r < 0.78) return 4;
    if (r < 0.91) return 3;
    if (r < 0.97) return 2;
    return 1;
  }

  private pickUniqueNames(count: number): string[] {
    const pool = [...FAKE_REVIEWER_NAMES].sort(() => Math.random() - 0.5);
    const picked = pool.slice(0, count);
    while (picked.length < count) {
      picked.push(`Khách hàng ${picked.length + 1}`);
    }
    return picked;
  }

  private randomDate(daysBack: number): Date {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * daysBack);
    const hoursAgo = Math.floor(Math.random() * 24);
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(d.getHours() - hoursAgo);
    return d;
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private pickRandom<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}
