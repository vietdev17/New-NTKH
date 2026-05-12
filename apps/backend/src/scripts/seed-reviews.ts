import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vanviet:admin@cluster0.bmk9n.mongodb.net/furniture-store';

// ===== DATA =====

const NAMES = [
  'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Nam', 'Phạm Thị Cúc',
  'Hoàng Văn Đức', 'Đặng Thị Lan', 'Vũ Minh Tuấn', 'Bùi Thanh Hà',
  'Đỗ Quốc Hùng', 'Ngô Thị Hương', 'Lý Thị Mai', 'Trịnh Văn Phú',
  'Phan Thị Ngọc', 'Vương Đình Quang', 'Lê Thị Thuỳ', 'Huỳnh Văn Khoa',
  'Cao Thị Diệu', 'Dương Văn Sơn', 'Lý Thị Hạnh', 'Ngô Minh Tuấn',
  'Phạm Hoàng Anh', 'Trần Thị Kiều', 'Lê Văn Phong', 'Nguyễn Thị Oanh',
  'Vũ Thị Phương', 'Hoàng Đức Minh', 'Bùi Thị Quỳnh', 'Đặng Văn Tài',
  'Ngô Thị Thu', 'Trần Minh Quân', 'Lê Thị Uyên', 'Phạm Văn Khải',
  'Hoàng Thị Yến', 'Vũ Đức Anh', 'Bùi Minh Chương', 'Đặng Thị Sen',
  'Nguyễn Thu Hà', 'Trịnh Quốc Bảo', 'Cao Thị Dung', 'Lý Văn Thắng',
];

const REVIEWS_5_STAR = [
  'Sản phẩm chất lượng tuyệt vời, đóng gói cẩn thận, giao hàng nhanh. Rất hài lòng!',
  'Mua lần 2 rồi, chất lượng vẫn rất tốt. Khuyên mọi người nên mua.',
  'Đúng như mô tả, giá cả hợp lý so với chất lượng. 5 sao!',
  'Giao hàng nhanh, sản phẩm đẹp, đóng gói chắc chắn. Sẽ quay lại mua tiếp.',
  'Gia đình tôi rất thích, ngồi êm thoải mái, màu sắc đẹp như hình.',
  'Shop uy tín, phản hồi nhanh. Sản phẩm đúng chất lượng, worth every dong!',
  'Mua cho phòng khách, ai cũng khen. Sẽ giới thiệu cho bạn bè.',
  'Rất hài lòng với sản phẩm này, xứng đồng tiền bát!',
  'Chất liệu tốt, hoàn thiện chỉn chu, nhân viên tư vấn nhiệt tình.',
  'Giao hàng đúng hẹn, sản phẩm không bị trầy xước. 5 sao không bàn cãi!',
  'Shop rất chuyên nghiệp, từ khâu tư vấn đến giao hàng đều rất tốt.',
];

const REVIEWS_4_STAR = [
  'Sản phẩm khá tốt, chất lượng ổn, đóng gói đẹp. Chỉ hơi chậm 1 ngày so với dự kiến.',
  'Nói chung hài lòng, giá cả hợp lý. Chỉ có 1 chi tiết nhỏ hơi không ưng ý.',
  'Sản phẩm đẹp, ngồi thoải mái. Giao hàng đúng hẹn. Recommend!',
  'Chất lượng tốt, phù hợp với không gian. Khá recommend cho ai đang tìm.',
  'Nhìn hình đẹp hơn thực tế một chút nhưng tổng thể vẫn ổn. 4 sao.',
  'Mua cho mẹ, bà thích. Giao hàng nhanh, đóng gói kỹ.',
];

const REVIEWS_3_STAR = [
  'Sản phẩm tạm ổn, chất lượng ở mức khá. Có vài điểm cần cải thiện.',
  'Nhìn đẹp nhưng chất lượng chưa tới mức mong đợi. Cần cải thiện thêm.',
  'OK, giá rẻ nhưng chất lượng cũng tương đối. Được 3 sao thôi.',
  'Sản phẩm dùng được, không có vấn đề lớn. Nhưng chưa thực sự ấn tượng.',
  'Giao hàng bình thường, đóng gói tạm được. Chất lượng tương đương giá.',
];

const REVIEWS_2_STAR = [
  'Sản phẩm nhận được hơi khác với hình, màu sắc không đều lắm. Chưa ưng ý lắm.',
  'Chất lượng chưa thực sự tốt, có vài chỗ hơi lỏng. Cần cải thiện nhiều.',
  'Giao hàng hơi chậm, đóng gói chưa kỹ. Sản phẩm tạm ổn.',
  'Không giống lắm với mô tả, hơi thất vọng. Giá hơi cao so với chất lượng.',
];

const REVIEWS_1_STAR = [
  'Rất thất vọng, sản phẩm nhận bị lỗi, đóng gói kém. Liên hệ shop rất lâu mới xử lý.',
  'Chất lượng kém, khác xa với hình. Không recommend, nên tránh.',
  'Sản phẩm không đúng như quảng cáo. Đã liên hệ đổi trả nhưng phiền phức.',
];

const REVIEW_POOL = [].concat(
  REVIEWS_5_STAR, REVIEWS_5_STAR, REVIEWS_5_STAR,
  REVIEWS_4_STAR, REVIEWS_4_STAR, REVIEWS_4_STAR,
  REVIEWS_3_STAR, REVIEWS_3_STAR,
  REVIEWS_2_STAR, REVIEWS_2_STAR,
  REVIEWS_1_STAR,
);

function weightedRandomRating(): number {
  const r = Math.random();
  if (r < 0.50) return 5;
  if (r < 0.78) return 4;
  if (r < 0.92) return 3;
  if (r < 0.97) return 2;
  return 1;
}

function randomDate(daysBack: number): Date {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * daysBack);
  const hoursAgo = Math.floor(Math.random() * 24);
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedReviews() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const db = mongoose.connection.db;

  const products = await db.collection('products').find(
    { isDeleted: false },
    { projection: { _id: 1, name: 1, rating: 1 } },
  ).toArray();

  console.log(`Found ${products.length} products`);

  const users = await db.collection('users').find(
    { role: 'customer', isDeleted: false },
    { projection: { _id: 1, fullName: 1 } },
  ).toArray();

  console.log(`Found ${users.length} customer users`);

  if (users.length === 0) {
    console.error('No customer users found! Cannot create reviews without users.');
    process.exit(1);
  }

  const reviewsCollection = db.collection('reviews');

  // Check existing reviews to avoid duplicates
  const existingCount = await reviewsCollection.countDocuments({ isDeleted: false });
  console.log(`Existing reviews: ${existingCount}`);

  // Shuffle products and users for random distribution
  const shuffledProducts = [...products].sort(() => Math.random() - 0.5);

  const reviewsToInsert: any[] = [];

  for (const product of shuffledProducts) {
    // Random 1-6 reviews per product
    const numReviews = Math.floor(Math.random() * 6) + 1;

    // Pick random users, ensure no user reviews same product twice in this batch
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
    const usedUserIds = new Set<string>();

    for (let i = 0; i < numReviews && i < shuffledUsers.length; i++) {
      const user = shuffledUsers[i];
      if (usedUserIds.has(user._id.toString())) {
        // Try next user
        const remaining = shuffledUsers.filter((u) => !usedUserIds.has(u._id.toString()));
        if (remaining.length === 0) break;
        continue;
      }

      usedUserIds.add(user._id.toString());

      const rating = weightedRandomRating();
      let comment: string;

      if (rating === 5) comment = pickRandom(REVIEWS_5_STAR);
      else if (rating === 4) comment = pickRandom(REVIEWS_4_STAR);
      else if (rating === 3) comment = pickRandom(REVIEWS_3_STAR);
      else if (rating === 2) comment = pickRandom(REVIEWS_2_STAR);
      else comment = pickRandom(REVIEWS_1_STAR);

      // Personalize review slightly with product context
      const productNames = product.name.split(' ').slice(0, 2);
      if (Math.random() < 0.3 && rating >= 4) {
        comment = `${productNames.join(' ')} rất tốt, ${comment.toLowerCase()}`;
      }

      reviewsToInsert.push({
        productId: product._id,
        userId: user._id,
        orderId: null, // Seed data, bypass order constraint
        orderItemSku: null,
        rating,
        title: null,
        comment,
        images: [],
        status: 'approved', // Approved immediately so they show up
        helpfulCount: Math.floor(Math.random() * 20),
        unhelpfulCount: Math.floor(Math.random() * 5),
        helpfulVotes: [],
        adminNote: null,
        isDeleted: false,
        createdAt: randomDate(90), // Within last 90 days
        updatedAt: new Date(),
      });
    }
  }

  // Check for duplicate (same userId + productId)
  const uniqueReviews = reviewsToInsert.filter((r, i) =>
    reviewsToInsert.findIndex((r2, j) =>
      r.userId.toString() === r2.userId.toString() &&
      r.productId.toString() === r2.productId.toString() &&
      j < i
    ) === -1
  );

  console.log(`Total reviews to insert: ${uniqueReviews.length}`);

  if (uniqueReviews.length === 0) {
    console.log('No new reviews to insert (all combinations already exist).');
    await mongoose.disconnect();
    return;
  }

  // Insert in batches
  const BATCH = 100;
  for (let i = 0; i < uniqueReviews.length; i += BATCH) {
    const batch = uniqueReviews.slice(i, i + BATCH);
    await reviewsCollection.insertMany(batch);
    console.log(`Inserted ${i + batch.length}/${uniqueReviews.length}...`);
  }

  // Update product rating counts
  console.log('\nUpdating product rating counts...');
  for (const product of products) {
    const pId = product._id;
    const stats = await reviewsCollection.aggregate([
      { $match: { productId: pId, status: 'approved', isDeleted: false } },
      { $group: { _id: null, totalReviews: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
    ]).toArray();

    if (stats.length > 0) {
      const { totalReviews, avgRating } = stats[0];
      await db.collection('products').updateOne(
        { _id: pId },
        {
          $set: {
            'rating.average': Math.round(avgRating * 10) / 10,
            'rating.count': totalReviews,
          },
        },
      );
    }
  }

  const finalCount = await reviewsCollection.countDocuments({ isDeleted: false });
  console.log(`\nDone! Total reviews in DB: ${finalCount}`);
  await mongoose.disconnect();
}

seedReviews().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
