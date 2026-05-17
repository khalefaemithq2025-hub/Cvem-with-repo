// ── Types ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'merchant' | 'delivery' | 'owner' | 'support';
  avatar?: string;
  addresses: Address[];
  createdAt: Date;
  merchantId?: string | number;
  deliveryId?: string | number;
}

export interface Address {
  id: string;
  label: string;
  city: string;
  district: string;
  street: string;
  building?: string;
  floor?: string;
  isDefault: boolean;
}

export interface Merchant {
  id: string;
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  logo: string;
  description: string;
  categories: string[];
  rating: number;
  reviewCount?: number;
  productCount: number;
  joinedAt: Date | string;
  isVerified: boolean;
  isDemo?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: 'phones' | 'tablets' | 'laptops' | 'accessories';
  brand: string;
  images: string[];
  specifications: Record<string, string>;
  merchantId: string;
  merchantName: string;
  price: number;
  oldPrice?: number;
  stock: number;
  colorVariants?: Array<{ color: string; qty: number }>;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isPending?: boolean;
  isUsed?: boolean;
  isDemo?: boolean;
  createdAt: Date | string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedStore: Merchant;
  deliveryType?: 'home' | 'office'; // ← جديد
}

export interface OrderItem {
  product: Product;
  quantity: number;
  store: Merchant;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  platformFee: number;
  deliveryFee: number;
  deliveryCompanyFee: number;
  merchantRevenue: number;
  total: number;
  status: OrderStatus;
  deliveryCompany?: string;
  deliveryCompanyId?: string;
  merchantId?: string;
  trackingNumber?: string;
  shippingAddress: Address;
  driverName?: string;
  driverPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

// ── SubOrder & MasterOrder (Problem 2 fix) ────────────────────────────────────
export interface SubOrder {
  id: string;
  merchantId: string;
  merchantName: string;
  deliveryCompanyId: string;
  deliveryCompanyName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  driverName?: string;
  driverPhone?: string;
  updatedAt?: Date | string;
}

export interface MasterOrder {
  id: string;
  customerId: string;
  customerName: string;
  subOrders: SubOrder[];
  shippingAddress: Address;
  totalSubtotal: number;
  totalDeliveryFee: number;
  grandTotal: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MandoubRep {
  id: string;
  name: string;
  phone: string;
  companyId: string;
  companyName: string;
  assignedOrderIds: string[];
  status: 'available' | 'busy' | 'offline';
  totalDeliveries: number;
  rating: number;
}

export const MOCK_MANDOUBS: MandoubRep[] = [
  { id: 'mnd-001', name: 'أحمد الورفلي', phone: '0912001001', companyId: 'del-001', companyName: 'برق للتوصيل', assignedOrderIds: [], status: 'available', totalDeliveries: 142, rating: 4.8 },
  { id: 'mnd-002', name: 'خالد الزروق', phone: '0923002002', companyId: 'del-001', companyName: 'برق للتوصيل', assignedOrderIds: [], status: 'busy', totalDeliveries: 98, rating: 4.6 },
  { id: 'mnd-003', name: 'محمد العريبي', phone: '0913003003', companyId: 'del-002', companyName: 'نجم التوصيل', assignedOrderIds: [], status: 'available', totalDeliveries: 213, rating: 4.9 },
  { id: 'mnd-004', name: 'يوسف الطرابلسي', phone: '0924004004', companyId: 'del-003', companyName: 'سرعة التوصيل', assignedOrderIds: [], status: 'available', totalDeliveries: 76, rating: 4.5 },
];

export interface DeliveryCompany {
  id: string;
  name: string;
  logo: string;
  description: string;
  fee: number;
  estimatedDays: string;
  isActive: boolean;
  coveredCities: string[];
  rates: Record<string, Record<string, number>>;
}

// ── Utility ───────────────────────────────────────────────────────────────────
export function formatPrice(price: number): string {
  return `${price.toLocaleString('ar-LY')} د.ل`;
}

/**
 * Platform commission tiers v2.5 (tiered by shop rank AND sales count):
 *  Shops  1-10 : 0-10 sales → 0% | 11-20 sales → 1% | 21+ sales → 3%
 *  Shops 11-50 : 0-10 sales → 1% | 11+ sales   → 3%
 *  Shops 51+   : Flat 3%
 */
export function calculatePlatformFee(subtotal: number, shopRank: number, salesCount: number = 0): number {
  let rate = 0;
  if (shopRank <= 10) {
    if (salesCount <= 10) rate = 0;
    else if (salesCount <= 20) rate = 0.01;
    else rate = 0.03;
  } else if (shopRank <= 50) {
    if (salesCount <= 10) rate = 0.01;
    else rate = 0.03;
  } else {
    rate = 0.03;
  }
  return Math.round(subtotal * rate * 100) / 100;
}

// ── 5 Libyan Stores ───────────────────────────────────────────────────────────
// 3 Mobile shops (phones) + 2 Computer shops (laptops/accessories)
export const MOCK_MERCHANTS: Merchant[] = [
  {
    id: 'm-ly-001',
    storeName: 'محل الأمين للجوالات',
    ownerName: 'علي محمد الأمين',
    email: 'amin@cvem.ly',
    phone: '0913001001',
    address: 'طرابلس، شارع عمر المختار',
    logo: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&h=200&fit=crop&crop=center',
    description: 'متخصصون في أحدث الهواتف الذكية من أبرز الماركات العالمية بأسعار تنافسية في قلب طرابلس. ضمان سنة على جميع الأجهزة.',
    categories: ['phones'],
    rating: 4.9,
    reviewCount: 182,
    productCount: 6,
    isVerified: true,
    isDemo: true,
    joinedAt: '2024-01-10',
  },
  {
    id: 'm-ly-002',
    storeName: 'فرسان الهواتف',
    ownerName: 'خالد عبدالله الفرساني',
    email: 'fursan@cvem.ly',
    phone: '0923002002',
    address: 'بنغازي، شارع الجلاء',
    logo: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=200&fit=crop&crop=center',
    description: 'أكبر محل متخصص في الهواتف الذكية ببنغازي. نوفر أحدث الأجهزة مع خدمة ما بعد البيع وتركيب الحماية مجاناً.',
    categories: ['phones'],
    rating: 4.85,
    reviewCount: 154,
    productCount: 6,
    isVerified: true,
    isDemo: true,
    joinedAt: '2024-01-15',
  },
  {
    id: 'm-ly-003',
    storeName: 'تقنية زليتن للجوالات',
    ownerName: 'محمد بشير الزليتني',
    email: 'zliten@cvem.ly',
    phone: '0913003003',
    address: 'زليتن، السوق المركزي',
    logo: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=200&h=200&fit=crop&crop=center',
    description: 'المرجع الأول للهواتف الذكية في مدينة زليتن. نقدم أسعاراً لا تُنافس مع ضمان رسمي وخدمة صيانة محلية.',
    categories: ['phones'],
    rating: 4.8,
    reviewCount: 136,
    productCount: 6,
    isVerified: true,
    isDemo: true,
    joinedAt: '2024-02-01',
  },
  {
    id: 'm-ly-004',
    storeName: 'مركز النخبة للحواسيب',
    ownerName: 'سعد عمر الجبري',
    email: 'nukhba@cvem.ly',
    phone: '0923004004',
    address: 'طرابلس، حي بن عاشور',
    logo: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&h=200&fit=crop&crop=center',
    description: 'مركزنا متخصص في الحواسيب المحمولة والإكسسوارات الاحترافية. نخدم الأفراد والشركات بأفضل الأسعار والدعم التقني المتكامل.',
    categories: ['laptops', 'accessories'],
    rating: 4.95,
    reviewCount: 218,
    productCount: 6,
    isVerified: true,
    isDemo: true,
    joinedAt: '2024-01-20',
  },
  {
    id: 'm-ly-005',
    storeName: 'الحاسوب الذهبي',
    ownerName: 'فتحي رجب المنتصر',
    email: 'golden@cvem.ly',
    phone: '0913005005',
    address: 'بنغازي، شارع التسعين',
    logo: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=200&h=200&fit=crop&crop=center',
    description: 'وجهتك الأولى للحواسيب المحمولة للألعاب والأعمال ببنغازي. مجموعة واسعة من أفضل الماركات بضمانات معتمدة.',
    categories: ['laptops', 'accessories'],
    rating: 4.82,
    reviewCount: 168,
    productCount: 6,
    isVerified: true,
    isDemo: true,
    joinedAt: '2024-01-25',
  },
];

// ── 30 Libyan Products (6 per store) ─────────────────────────────────────────
export const MOCK_PRODUCTS: Product[] = [
  // ── Store 1: محل الأمين للجوالات (طرابلس) ──────────────────────────────────
  {
    id: 'p-ly-001',
    name: 'آيفون 15 برو 256GB',
    description: 'أحدث إصدار من آبل بتصميم التيتانيوم الأنيق. شريحة A17 Pro الأقوى، كاميرا 48 ميجابكسل، وزر Action متعدد الوظائف. متوفر بضمان سنة.',
    category: 'phones',
    brand: 'Apple',
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600'],
    specifications: {
      'الشاشة': '6.1 بوصة Super Retina XDR',
      'المعالج': 'A17 Pro',
      'التخزين': '256GB',
      'الكاميرا': '48 + 12 + 12 ميجابكسل',
      'البطارية': '3274 مللي أمبير',
      'الألوان': 'تيتانيوم طبيعي، أسود، أبيض، أزرق',
    },
    merchantId: 'm-ly-001',
    merchantName: 'محل الأمين للجوالات',
    price: 6800,
    oldPrice: 7200,
    stock: 12,
    colorVariants: [{ color: 'تيتانيوم طبيعي', qty: 5 }, { color: 'أسود', qty: 4 }, { color: 'أبيض', qty: 3 }],
    rating: 4.95,
    reviewCount: 98,
    isFeatured: true,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-10',
  },
  {
    id: 'p-ly-002',
    name: 'سامسونج جالاكسي S24 Ultra',
    description: 'الهاتف الأقوى من سامسونج مع قلم S Pen مدمج، كاميرا 200 ميجابكسل، وشاشة Dynamic AMOLED 2X بحجم 6.8 بوصة. خيار مثالي للمحترفين.',
    category: 'phones',
    brand: 'Samsung',
    images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600', 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=600'],
    specifications: {
      'الشاشة': '6.8 بوصة Dynamic AMOLED 2X',
      'المعالج': 'Snapdragon 8 Gen 3',
      'التخزين': '256GB / 512GB',
      'الكاميرا': '200 + 50 + 12 + 10 ميجابكسل',
      'البطارية': '5000 مللي أمبير / 45 واط',
      'الأبعاد': '162.3 × 79 × 8.6 مم',
    },
    merchantId: 'm-ly-001',
    merchantName: 'محل الأمين للجوالات',
    price: 5200,
    oldPrice: 5700,
    stock: 8,
    colorVariants: [{ color: 'أسود تيتانيوم', qty: 4 }, { color: 'رمادي تيتانيوم', qty: 4 }],
    rating: 4.85,
    reviewCount: 74,
    isFeatured: true,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-12',
  },
  {
    id: 'p-ly-003',
    name: 'شاومي 14 Pro',
    description: 'هاتف شاومي الرائد بكاميرا Leica ثلاثية وشاشة LTPO AMOLED 2K. معالج Snapdragon 8 Gen 3 وشحن سريع 120 واط. قيمة استثنائية.',
    category: 'phones',
    brand: 'Xiaomi',
    images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600'],
    specifications: {
      'الشاشة': '6.73 بوصة LTPO AMOLED 2K',
      'المعالج': 'Snapdragon 8 Gen 3',
      'التخزين': '256GB / 512GB',
      'الكاميرا': '50 + 50 + 50 ميجابكسل Leica',
      'البطارية': '4880 مللي أمبير / 120 واط',
      'الشحن اللاسلكي': '50 واط',
    },
    merchantId: 'm-ly-001',
    merchantName: 'محل الأمين للجوالات',
    price: 3800,
    oldPrice: 4100,
    stock: 15,
    colorVariants: [{ color: 'أسود', qty: 8 }, { color: 'أبيض', qty: 7 }],
    rating: 4.7,
    reviewCount: 43,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-15',
  },
  {
    id: 'p-ly-004',
    name: 'ريلمي GT5 Pro',
    description: 'هاتف ريلمي GT5 Pro بمعالج Snapdragon 8 Gen 3 وشاشة AMOLED مقاس 6.78 بوصة. أداء احترافي بسعر في متناول الجميع.',
    category: 'phones',
    brand: 'Realme',
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'],
    specifications: {
      'الشاشة': '6.78 بوصة AMOLED 144Hz',
      'المعالج': 'Snapdragon 8 Gen 3',
      'التخزين': '256GB',
      'الكاميرا': '50 + 50 + 8 ميجابكسل',
      'البطارية': '5400 مللي أمبير / 100 واط',
    },
    merchantId: 'm-ly-001',
    merchantName: 'محل الأمين للجوالات',
    price: 2900,
    stock: 20,
    rating: 4.5,
    reviewCount: 28,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-18',
  },
  {
    id: 'p-ly-005',
    name: 'أوبو Reno 11 Pro',
    description: 'هاتف أوبو الأنيق بتصميم فريد وكاميرا بورتريه احترافية 50 ميجابكسل. شاشة AMOLED مقاس 6.74 بوصة وشحن سريع 80 واط.',
    category: 'phones',
    brand: 'OPPO',
    images: ['https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600'],
    specifications: {
      'الشاشة': '6.74 بوصة AMOLED 120Hz',
      'المعالج': 'MediaTek Dimensity 8200',
      'التخزين': '256GB',
      'الكاميرا': '50 + 32 + 8 ميجابكسل',
      'البطارية': '4600 مللي أمبير / 80 واط',
    },
    merchantId: 'm-ly-001',
    merchantName: 'محل الأمين للجوالات',
    price: 3200,
    stock: 10,
    rating: 4.4,
    reviewCount: 19,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-20',
  },
  {
    id: 'p-ly-006',
    name: 'تكنو Spark 20 Pro',
    description: 'هاتف تكنو اقتصادي بكاميرا 108 ميجابكسل وبطارية 5000 مللي أمبير. خيار مثالي لمن يبحث عن أداء جيد بأقل تكلفة.',
    category: 'phones',
    brand: 'Tecno',
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'],
    specifications: {
      'الشاشة': '6.78 بوصة AMOLED',
      'المعالج': 'MediaTek Helio G99 Ultimate',
      'التخزين': '256GB',
      'الكاميرا': '108 + 2 ميجابكسل',
      'البطارية': '5000 مللي أمبير / 33 واط',
    },
    merchantId: 'm-ly-001',
    merchantName: 'محل الأمين للجوالات',
    price: 1400,
    stock: 35,
    rating: 4.2,
    reviewCount: 52,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-22',
  },

  // ── Store 2: فرسان الهواتف (بنغازي) ──────────────────────────────────────
  {
    id: 'p-ly-007',
    name: 'آيفون 14 Pro Max 512GB',
    description: 'جهاز آيفون 14 Pro Max بتخزين 512GB وجزيرة Dynamic Island. كاميرا 48 ميجابكسل ومعالج A16 Bionic مع ضمان رسمي كامل.',
    category: 'phones',
    brand: 'Apple',
    images: ['https://images.unsplash.com/photo-1591337676887-a217c6970a8a?w=600', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600'],
    specifications: {
      'الشاشة': '6.7 بوصة Super Retina XDR',
      'المعالج': 'A16 Bionic',
      'التخزين': '512GB',
      'الكاميرا': '48 + 12 + 12 ميجابكسل',
      'البطارية': '4323 مللي أمبير',
      'مقاومة الماء': 'IP68',
    },
    merchantId: 'm-ly-002',
    merchantName: 'فرسان الهواتف',
    price: 5900,
    oldPrice: 6400,
    stock: 7,
    colorVariants: [{ color: 'بنفسجي عميق', qty: 3 }, { color: 'ذهبي', qty: 2 }, { color: 'فضي', qty: 2 }],
    rating: 4.9,
    reviewCount: 73,
    isFeatured: true,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-15',
  },
  {
    id: 'p-ly-008',
    name: 'سامسونج جالاكسي A54 5G',
    description: 'هاتف سامسونج A54 بشاشة Super AMOLED مقاس 6.4 بوصة وكاميرا ثلاثية 50 ميجابكسل. يدعم شبكات 5G مع بطارية 5000 مللي أمبير.',
    category: 'phones',
    brand: 'Samsung',
    images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600'],
    specifications: {
      'الشاشة': '6.4 بوصة Super AMOLED 120Hz',
      'المعالج': 'Exynos 1380',
      'التخزين': '128GB / 256GB',
      'الكاميرا': '50 + 12 + 5 ميجابكسل',
      'البطارية': '5000 مللي أمبير / 25 واط',
      'الشبكة': '5G',
    },
    merchantId: 'm-ly-002',
    merchantName: 'فرسان الهواتف',
    price: 2500,
    stock: 18,
    rating: 4.6,
    reviewCount: 91,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-17',
  },
  {
    id: 'p-ly-009',
    name: 'شاومي Redmi Note 13 Pro+',
    description: 'شاومي Redmi Note 13 Pro+ بكاميرا 200 ميجابكسل وشحن Turbo 120 واط. شاشة AMOLED 1.5K وأداء سلس مع بطارية تدوم طويلاً.',
    category: 'phones',
    brand: 'Xiaomi',
    images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600'],
    specifications: {
      'الشاشة': '6.67 بوصة AMOLED 1.5K 120Hz',
      'المعالج': 'MediaTek Dimensity 7200 Ultra',
      'التخزين': '256GB / 512GB',
      'الكاميرا': '200 + 8 + 2 ميجابكسل',
      'البطارية': '5000 مللي أمبير / 120 واط',
    },
    merchantId: 'm-ly-002',
    merchantName: 'فرسان الهواتف',
    price: 2200,
    oldPrice: 2500,
    stock: 22,
    rating: 4.7,
    reviewCount: 67,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-19',
  },
  {
    id: 'p-ly-010',
    name: 'هواوي Nova 11 Pro',
    description: 'هاتف هواوي Nova 11 Pro بكاميرا أمامية 60 ميجابكسل وشاشة OLED مقاس 6.78 بوصة. شحن تكيفي 100 واط وتصميم زجاجي فاخر.',
    category: 'phones',
    brand: 'Huawei',
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'],
    specifications: {
      'الشاشة': '6.78 بوصة OLED 120Hz',
      'المعالج': 'Snapdragon 778G 4G',
      'التخزين': '256GB',
      'الكاميرا الخلفية': '50 + 8 + 2 ميجابكسل',
      'الكاميرا الأمامية': '60 ميجابكسل',
      'البطارية': '4500 مللي أمبير / 100 واط',
    },
    merchantId: 'm-ly-002',
    merchantName: 'فرسان الهواتف',
    price: 2800,
    stock: 11,
    rating: 4.5,
    reviewCount: 34,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-21',
  },
  {
    id: 'p-ly-011',
    name: 'فيفو V29 Pro 5G',
    description: 'هاتف فيفو V29 Pro بكاميرا بورتريه Aura Light مع LED دائري، شاشة AMOLED منحنية 120Hz، وشحن FlashCharge 80 واط.',
    category: 'phones',
    brand: 'Vivo',
    images: ['https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600'],
    specifications: {
      'الشاشة': '6.78 بوصة AMOLED 120Hz منحنية',
      'المعالج': 'Snapdragon 778G 5G',
      'التخزين': '256GB',
      'الكاميرا': '50 + 12 + 8 ميجابكسل',
      'البطارية': '4600 مللي أمبير / 80 واط',
    },
    merchantId: 'm-ly-002',
    merchantName: 'فرسان الهواتف',
    price: 3100,
    stock: 9,
    rating: 4.4,
    reviewCount: 21,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-23',
  },
  {
    id: 'p-ly-012',
    name: 'إنفينيكس Note 40 Pro+ 5G',
    description: 'إنفينيكس Note 40 Pro+ بشاشة AMOLED مقاس 6.78 بوصة وشاشة ثانوية جانبية. شحن MagCharge لاسلكي 20 واط وبطارية 5000 مللي أمبير.',
    category: 'phones',
    brand: 'Infinix',
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'],
    specifications: {
      'الشاشة': '6.78 بوصة AMOLED 120Hz',
      'المعالج': 'MediaTek Helio G99 Ultimate',
      'التخزين': '256GB',
      'الكاميرا': '108 + 2 ميجابكسل',
      'البطارية': '5000 مللي أمبير / 68 واط',
    },
    merchantId: 'm-ly-002',
    merchantName: 'فرسان الهواتف',
    price: 1600,
    stock: 28,
    rating: 4.3,
    reviewCount: 45,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-25',
  },

  // ── Store 3: تقنية زليتن للجوالات ──────────────────────────────────────────
  {
    id: 'p-ly-013',
    name: 'سامسونج جالاكسي S23 FE',
    description: 'سامسونج S23 Fan Edition بمعالج Snapdragon 8 Gen 1 وكاميرا ثلاثية رائعة. شاشة Dynamic AMOLED 2X ومقاومة للماء IP68.',
    category: 'phones',
    brand: 'Samsung',
    images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600'],
    specifications: {
      'الشاشة': '6.4 بوصة Dynamic AMOLED 2X',
      'المعالج': 'Snapdragon 8 Gen 1',
      'التخزين': '128GB / 256GB',
      'الكاميرا': '50 + 12 + 8 ميجابكسل',
      'البطارية': '4500 مللي أمبير / 25 واط',
      'مقاومة الماء': 'IP68',
    },
    merchantId: 'm-ly-003',
    merchantName: 'تقنية زليتن للجوالات',
    price: 3000,
    oldPrice: 3300,
    stock: 14,
    rating: 4.7,
    reviewCount: 58,
    isFeatured: true,
    isPending: false,
    isDemo: true,
    createdAt: '2024-02-01',
  },
  {
    id: 'p-ly-014',
    name: 'آيفون 13 128GB',
    description: 'آيفون 13 بتصميم مضغوط ومعالج A15 Bionic. كاميرا ثنائية بنظام Cinematic Mode ووضع Night Mode المحسّن. ضمان رسمي.',
    category: 'phones',
    brand: 'Apple',
    images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600', 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600'],
    specifications: {
      'الشاشة': '6.1 بوصة Super Retina XDR',
      'المعالج': 'A15 Bionic',
      'التخزين': '128GB',
      'الكاميرا': '12 + 12 ميجابكسل',
      'البطارية': '3227 مللي أمبير',
    },
    merchantId: 'm-ly-003',
    merchantName: 'تقنية زليتن للجوالات',
    price: 4500,
    oldPrice: 4900,
    stock: 6,
    colorVariants: [{ color: 'أزرق', qty: 2 }, { color: 'أخضر', qty: 2 }, { color: 'وردي', qty: 2 }],
    rating: 4.8,
    reviewCount: 112,
    isFeatured: true,
    isPending: false,
    isDemo: true,
    createdAt: '2024-02-03',
  },
  {
    id: 'p-ly-015',
    name: 'شاومي Redmi 13C',
    description: 'شاومي Redmi 13C هاتف ميزانية بكاميرا 50 ميجابكسل وشاشة 6.74 بوصة. يدعم شحن 18 واط وذاكرة رام قابلة للتوسعة.',
    category: 'phones',
    brand: 'Xiaomi',
    images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600'],
    specifications: {
      'الشاشة': '6.74 بوصة IPS LCD',
      'المعالج': 'MediaTek Helio G85',
      'التخزين': '128GB / 256GB',
      'الكاميرا': '50 + 2 ميجابكسل',
      'البطارية': '5000 مللي أمبير / 18 واط',
    },
    merchantId: 'm-ly-003',
    merchantName: 'تقنية زليتن للجوالات',
    price: 1100,
    stock: 40,
    rating: 4.2,
    reviewCount: 76,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-02-05',
  },
  {
    id: 'p-ly-016',
    name: 'أوبو A78 5G',
    description: 'أوبو A78 بشاشة AMOLED مقاس 6.56 بوصة وكاميرا 50 ميجابكسل مع نظام AI للتحسين. يدعم 5G وشحن SUPERVOOC 67 واط.',
    category: 'phones',
    brand: 'OPPO',
    images: ['https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600'],
    specifications: {
      'الشاشة': '6.56 بوصة AMOLED 90Hz',
      'المعالج': 'Snapdragon 695 5G',
      'التخزين': '128GB',
      'الكاميرا': '50 + 2 ميجابكسل',
      'البطارية': '5000 مللي أمبير / 67 واط',
    },
    merchantId: 'm-ly-003',
    merchantName: 'تقنية زليتن للجوالات',
    price: 1900,
    stock: 16,
    rating: 4.3,
    reviewCount: 31,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-02-07',
  },
  {
    id: 'p-ly-017',
    name: 'ريلمي C67 5G',
    description: 'ريلمي C67 بشاشة Super AMOLED مقاس 6.72 بوصة وكاميرا 108 ميجابكسل. أداء 5G ممتاز مع بطارية 5000 مللي أمبير.',
    category: 'phones',
    brand: 'Realme',
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'],
    specifications: {
      'الشاشة': '6.72 بوصة Super AMOLED 120Hz',
      'المعالج': 'Snapdragon 695 5G',
      'التخزين': '128GB / 256GB',
      'الكاميرا': '108 + 2 ميجابكسل',
      'البطارية': '5000 مللي أمبير / 33 واط',
    },
    merchantId: 'm-ly-003',
    merchantName: 'تقنية زليتن للجوالات',
    price: 1350,
    stock: 25,
    rating: 4.4,
    reviewCount: 48,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-02-09',
  },
  {
    id: 'p-ly-018',
    name: 'تكنو Camon 20 Pro 5G',
    description: 'تكنو Camon 20 Pro بكاميرا بورتريه 64 ميجابكسل وشاشة AMOLED مقاس 6.67 بوصة. يدعم 5G مع بطارية 5000 مللي أمبير وشحن 33 واط.',
    category: 'phones',
    brand: 'Tecno',
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'],
    specifications: {
      'الشاشة': '6.67 بوصة AMOLED 144Hz',
      'المعالج': 'MediaTek Dimensity 8050',
      'التخزين': '256GB',
      'الكاميرا': '64 + 2 ميجابكسل',
      'البطارية': '5000 مللي أمبير / 33 واط',
    },
    merchantId: 'm-ly-003',
    merchantName: 'تقنية زليتن للجوالات',
    price: 1700,
    stock: 19,
    rating: 4.1,
    reviewCount: 22,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-02-11',
  },

  // ── Tablets ───────────────────────────────────────────────────────────────
  {
    id: 'p-tab-001',
    name: 'آيباد برو 12.9 بوصة M2',
    description: 'آيباد برو بشريحة M2 وشاشة Liquid Retina XDR مقاس 12.9 بوصة. يدعم Apple Pencil من الجيل الثاني وكيبورد Magic Keyboard. الأداء الأقوى في فئة الأجهزة اللوحية.',
    category: 'tablets',
    brand: 'Apple',
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600'],
    specifications: {
      'الشاشة': '12.9 بوصة Liquid Retina XDR 120Hz',
      'المعالج': 'Apple M2',
      'التخزين': '256GB / 512GB / 1TB / 2TB',
      'الكاميرا': '12 ميجابكسل (خلفية) + 12 ميجابكسل Ultra Wide (أمامية)',
      'البطارية': 'حتى 10 ساعات',
      'الاتصال': 'Wi-Fi 6E + Bluetooth 5.3',
    },
    merchantId: 'm-ly-004',
    merchantName: 'مركز النخبة التقني',
    price: 9500,
    oldPrice: 10500,
    stock: 8,
    rating: 4.9,
    reviewCount: 47,
    isFeatured: true,
    isPending: false,
    isDemo: true,
    createdAt: '2024-03-01',
  },
  {
    id: 'p-tab-002',
    name: 'سامسونج جالاكسي Tab S9 Ultra',
    description: 'جالاكسي Tab S9 Ultra بشاشة Dynamic AMOLED 2X مقاس 14.6 بوصة وقلم S Pen في العلبة. المعالج Snapdragon 8 Gen 2 يقدم أداءً لا مثيل له في الأجهزة اللوحية.',
    category: 'tablets',
    brand: 'Samsung',
    images: ['https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600'],
    specifications: {
      'الشاشة': '14.6 بوصة Dynamic AMOLED 2X 120Hz',
      'المعالج': 'Snapdragon 8 Gen 2',
      'التخزين': '256GB / 512GB',
      'الذاكرة': '12GB / 16GB RAM',
      'البطارية': '11200 مللي أمبير / 45 واط',
      'الكاميرا': '13 + 8 ميجابكسل (خلفية)',
    },
    merchantId: 'm-ly-004',
    merchantName: 'مركز النخبة التقني',
    price: 8200,
    oldPrice: 9000,
    stock: 5,
    rating: 4.8,
    reviewCount: 34,
    isFeatured: true,
    isPending: false,
    isDemo: true,
    createdAt: '2024-03-05',
  },
  {
    id: 'p-tab-003',
    name: 'شاومي Pad 6 Pro',
    description: 'شاومي Pad 6 Pro بشاشة LCD 11 بوصة بدقة 2K وتحديث 144Hz. معالج Snapdragon 8+ Gen 1، كاميرا مزدوجة 50 ميغابكسل، وذاكرة تشغيل 12 جيجابايت. بطارية 8600 مللي أمبير تدعم شحن 67 واط.',
    category: 'tablets',
    brand: 'Xiaomi',
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600'],
    specifications: {
      'الشاشة': '11 بوصة LCD 2K 144Hz',
      'المعالج': 'Snapdragon 8+ Gen 1',
      'التخزين': '128GB / 256GB',
      'الذاكرة': '8GB / 12GB RAM',
      'البطارية': '8600 مللي أمبير / 67 واط',
      'الكاميرا': '50 ميجابكسل (خلفية)',
    },
    merchantId: 'm-ly-001',
    merchantName: 'محل الأمين للجوالات',
    price: 3200,
    oldPrice: 3700,
    stock: 12,
    rating: 4.6,
    reviewCount: 29,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-03-10',
  },
  {
    id: 'p-tab-004',
    name: 'هواوي MatePad Pro 11 بوصة 2024',
    description: 'هواوي MatePad Pro 11 الإصدار الأحدث بشاشة OLED مقاس 11 بوصة ودقة 2.5K. يدعم قلم M-Pencil الجيل الثاني وكيبورد Huawei Smart مع HarmonyOS 4.',
    category: 'tablets',
    brand: 'Huawei',
    images: ['https://images.unsplash.com/photo-1593642634524-b40b5baae6bb?w=600'],
    specifications: {
      'الشاشة': '11 بوصة OLED 2.5K 120Hz',
      'المعالج': 'Kirin 9000S',
      'التخزين': '256GB / 512GB',
      'الذاكرة': '8GB / 12GB RAM',
      'البطارية': '8300 مللي أمبير / 88 واط',
      'الكاميرا': '13 ميجابكسل (خلفية)',
    },
    merchantId: 'm-ly-002',
    merchantName: 'فرسان الهواتف',
    price: 4800,
    stock: 9,
    rating: 4.7,
    reviewCount: 18,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-03-15',
  },

  // ── Store 4: مركز النخبة للحواسيب (طرابلس) ────────────────────────────────
  {
    id: 'p-ly-019',
    name: 'ماك بوك برو 14 بوصة M3 Pro',
    description: 'أحدث ماك بوك برو بشريحة M3 Pro، شاشة Liquid Retina XDR 14.2 بوصة، و18GB ذاكرة موحدة. أداء استثنائي لأعمال الفيديو والتصميم.',
    category: 'laptops',
    brand: 'Apple',
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600', 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600'],
    specifications: {
      'الشاشة': '14.2 بوصة Liquid Retina XDR',
      'المعالج': 'Apple M3 Pro (11 نواة)',
      'الذاكرة': '18GB موحدة',
      'التخزين': '512GB SSD',
      'البطارية': 'حتى 18 ساعة',
      'المنافذ': '3x Thunderbolt 4, HDMI, SD Card',
    },
    merchantId: 'm-ly-004',
    merchantName: 'مركز النخبة للحواسيب',
    price: 12000,
    oldPrice: 13000,
    stock: 5,
    rating: 4.9,
    reviewCount: 38,
    isFeatured: true,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-20',
  },
  {
    id: 'p-ly-020',
    name: 'Dell XPS 15 9530',
    description: 'حاسوب Dell XPS 15 الفاخر بشاشة OLED 3.5K مقاس 15.6 بوصة ومعالج Intel Core i9-13900H. يناسب المصممين والمطورين المحترفين.',
    category: 'laptops',
    brand: 'Dell',
    images: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600'],
    specifications: {
      'الشاشة': '15.6 بوصة OLED 3.5K 60Hz',
      'المعالج': 'Intel Core i9-13900H',
      'الذاكرة': '32GB DDR5',
      'التخزين': '1TB SSD',
      'كرت الشاشة': 'NVIDIA RTX 4060 8GB',
      'البطارية': 'حتى 13 ساعة',
    },
    merchantId: 'm-ly-004',
    merchantName: 'مركز النخبة للحواسيب',
    price: 9800,
    stock: 4,
    rating: 4.8,
    reviewCount: 27,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-22',
  },
  {
    id: 'p-ly-021',
    name: 'HP Envy x360 15',
    description: 'حاسوب HP Envy قابل للتحويل بشاشة OLED 15.6 بوصة وقلم HP. يدعم 360 درجة مع معالج Intel Core i7 وبطارية تدوم 17 ساعة.',
    category: 'laptops',
    brand: 'HP',
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600'],
    specifications: {
      'الشاشة': '15.6 بوصة OLED 2.8K 120Hz',
      'المعالج': 'Intel Core i7-1355U',
      'الذاكرة': '16GB LPDDR5',
      'التخزين': '1TB SSD',
      'القلم': 'HP MPP 2.0 مرفق',
      'البطارية': 'حتى 17 ساعة',
    },
    merchantId: 'm-ly-004',
    merchantName: 'مركز النخبة للحواسيب',
    price: 7500,
    oldPrice: 8000,
    stock: 7,
    rating: 4.7,
    reviewCount: 41,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-24',
  },
  {
    id: 'p-ly-022',
    name: 'Lenovo ThinkPad E15 Gen 4',
    description: 'حاسوب Lenovo ThinkPad للأعمال بمعالج Intel Core i5-1235U وذاكرة 16GB. موثوق ومقاوم بشاشة IPS 15.6 بوصة Full HD.',
    category: 'laptops',
    brand: 'Lenovo',
    images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600'],
    specifications: {
      'الشاشة': '15.6 بوصة IPS FHD',
      'المعالج': 'Intel Core i5-1235U',
      'الذاكرة': '16GB DDR4',
      'التخزين': '512GB SSD',
      'البطارية': 'حتى 10 ساعات',
      'الأمان': 'قارئ بصمة + TPM 2.0',
    },
    merchantId: 'm-ly-004',
    merchantName: 'مركز النخبة للحواسيب',
    price: 5800,
    stock: 9,
    rating: 4.6,
    reviewCount: 53,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-26',
  },
  {
    id: 'p-ly-023',
    name: 'ماوس لوجيتك MX Master 3S',
    description: 'ماوس لوجيتك الاحترافي بدقة 8000 DPI وعجلة تمرير MagSpeed الصامتة. يتصل بثلاثة أجهزة ويعمل 70 يوماً بشحنة واحدة.',
    category: 'accessories',
    brand: 'Logitech',
    images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600'],
    specifications: {
      'الدقة': '8000 DPI',
      'الاتصال': 'Bluetooth + Logi Bolt',
      'الأجهزة': 'حتى 3 أجهزة',
      'البطارية': '70 يوماً',
      'الأزرار': '7 أزرار قابلة للبرمجة',
    },
    merchantId: 'm-ly-004',
    merchantName: 'مركز النخبة للحواسيب',
    price: 480,
    stock: 30,
    rating: 4.9,
    reviewCount: 168,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-28',
  },
  {
    id: 'p-ly-024',
    name: 'كيبورد Keychron K2 Pro',
    description: 'كيبورد ميكانيكي لاسلكي Keychron K2 Pro بمفاتيح Gateron Pro وإضاءة RGB. يدعم Mac وWindows مع توصيل Bluetooth لثلاثة أجهزة.',
    category: 'accessories',
    brand: 'Keychron',
    images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600'],
    specifications: {
      'النوع': 'ميكانيكي 75%',
      'المفاتيح': 'Gateron Pro Red/Brown/Blue',
      'الاتصال': 'Bluetooth 5.1 + USB-C',
      'الإضاءة': 'RGB للمفاتيح',
      'التوافق': 'Mac / Windows / iOS / Android',
    },
    merchantId: 'm-ly-004',
    merchantName: 'مركز النخبة للحواسيب',
    price: 620,
    stock: 20,
    rating: 4.8,
    reviewCount: 94,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-30',
  },

  // ── Store 5: الحاسوب الذهبي (بنغازي) ─────────────────────────────────────
  {
    id: 'p-ly-025',
    name: 'ASUS ROG Strix G16 2024',
    description: 'حاسوب ASUS ROG للألعاب بمعالج Intel Core i9-14900HX وكرت شاشة RTX 4080. شاشة 165Hz مقاس 16 بوصة لتجربة ألعاب لا مثيل لها.',
    category: 'laptops',
    brand: 'ASUS',
    images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600'],
    specifications: {
      'الشاشة': '16 بوصة QHD+ 240Hz',
      'المعالج': 'Intel Core i9-14900HX',
      'الذاكرة': '32GB DDR5',
      'التخزين': '1TB SSD NVMe',
      'كرت الشاشة': 'NVIDIA RTX 4080 12GB',
      'البطارية': 'حتى 8 ساعات (الاستخدام العادي)',
    },
    merchantId: 'm-ly-005',
    merchantName: 'الحاسوب الذهبي',
    price: 11000,
    oldPrice: 12000,
    stock: 3,
    rating: 4.9,
    reviewCount: 29,
    isFeatured: true,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-25',
  },
  {
    id: 'p-ly-026',
    name: 'MSI Thin GF63 15',
    description: 'حاسوب MSI للألعاب نحيف وخفيف بمعالج Intel Core i7 وكرت RTX 4050. يجمع بين الأداء العالي والتصميم الأنيق المناسب للنقل.',
    category: 'laptops',
    brand: 'MSI',
    images: ['https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600'],
    specifications: {
      'الشاشة': '15.6 بوصة FHD 144Hz',
      'المعالج': 'Intel Core i7-13620H',
      'الذاكرة': '16GB DDR5',
      'التخزين': '512GB SSD',
      'كرت الشاشة': 'NVIDIA RTX 4050 6GB',
      'الوزن': '1.86 كيلوجرام',
    },
    merchantId: 'm-ly-005',
    merchantName: 'الحاسوب الذهبي',
    price: 8200,
    stock: 6,
    rating: 4.7,
    reviewCount: 47,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-27',
  },
  {
    id: 'p-ly-027',
    name: 'Acer Aspire 5 A515',
    description: 'حاسوب Acer Aspire 5 المثالي للطلاب والأعمال. يوفر أداء معتدل بمعالج Intel Core i5-1235U وبطارية تدوم 10 ساعات بسعر مناسب.',
    category: 'laptops',
    brand: 'Acer',
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600'],
    specifications: {
      'الشاشة': '15.6 بوصة IPS FHD',
      'المعالج': 'Intel Core i5-1235U',
      'الذاكرة': '8GB DDR4 (قابلة للتوسعة)',
      'التخزين': '512GB SSD',
      'البطارية': 'حتى 10 ساعات',
      'المنافذ': 'USB-C, USB-A x2, HDMI, SD Card',
    },
    merchantId: 'm-ly-005',
    merchantName: 'الحاسوب الذهبي',
    price: 5400,
    stock: 12,
    rating: 4.5,
    reviewCount: 82,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-29',
  },
  {
    id: 'p-ly-028',
    name: 'HP Pavilion 15 EH3',
    description: 'حاسوب HP Pavilion 15 بمعالج AMD Ryzen 7 7730U وذاكرة 16GB. شاشة FHD مقاس 15.6 بوصة وتصميم أنيق مناسب للأعمال والترفيه.',
    category: 'laptops',
    brand: 'HP',
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600'],
    specifications: {
      'الشاشة': '15.6 بوصة IPS FHD',
      'المعالج': 'AMD Ryzen 7 7730U',
      'الذاكرة': '16GB DDR4',
      'التخزين': '512GB SSD',
      'البطارية': 'حتى 8 ساعات',
      'الكاميرا': 'HP True Vision 720p HD',
    },
    merchantId: 'm-ly-005',
    merchantName: 'الحاسوب الذهبي',
    price: 4900,
    stock: 10,
    rating: 4.6,
    reviewCount: 65,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-01-31',
  },
  {
    id: 'p-ly-029',
    name: 'سماعة سوني WH-1000XM5',
    description: 'سماعة سوني الرائدة بإلغاء ضوضاء احترافي وصوت Hi-Res مذهل. بطارية تدوم 30 ساعة مع شحن سريع 3 دقائق لـ 3 ساعات استماع.',
    category: 'accessories',
    brand: 'Sony',
    images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600'],
    specifications: {
      'النوع': 'فوق الأذن (Over-ear)',
      'إلغاء الضوضاء': 'نشط — 8 ميكروفونات',
      'الاتصال': 'Bluetooth 5.2 + NFC',
      'البطارية': '30 ساعة (ANC مفعّل)',
      'الشحن': 'USB-C / 3 دقائق = 3 ساعات',
      'الوزن': '250 جرام',
    },
    merchantId: 'm-ly-005',
    merchantName: 'الحاسوب الذهبي',
    price: 1900,
    oldPrice: 2200,
    stock: 8,
    rating: 4.9,
    reviewCount: 203,
    isFeatured: true,
    isPending: false,
    isDemo: true,
    createdAt: '2024-02-02',
  },
  {
    id: 'p-ly-030',
    name: 'باور بانك Anker 737 26800mAh',
    description: 'باور بانك Anker 737 بسعة 26800mAh وشحن ثنائي الاتجاه 140 واط. يشحن ماك بوك من 0% إلى 100% في أقل من ساعة واحدة.',
    category: 'accessories',
    brand: 'Anker',
    images: ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600'],
    specifications: {
      'السعة': '26800mAh',
      'الشحن الصادر': '140 واط (USB-C)',
      'الشحن الوارد': '100 واط',
      'المنافذ': '2x USB-C, 1x USB-A',
      'الوزن': '708 جرام',
    },
    merchantId: 'm-ly-005',
    merchantName: 'الحاسوب الذهبي',
    price: 450,
    stock: 22,
    rating: 4.8,
    reviewCount: 137,
    isFeatured: false,
    isPending: false,
    isDemo: true,
    createdAt: '2024-02-04',
  },
];

// Keep legacy arrays pointing to new Libyan data for backward compatibility
export const merchants = MOCK_MERCHANTS;
export const products = MOCK_PRODUCTS;

export const deliveryCompanies: DeliveryCompany[] = [
  {
    id: 'dc-001',
    name: 'شركة السريع',
    logo: 'https://ui-avatars.com/api/?name=السريع&background=e74c3c&color=fff&size=100',
    description: 'توصيل سريع لجميع مناطق ليبيا خلال 24-48 ساعة',
    fee: 15,
    estimatedDays: '1-2 أيام',
    isActive: true,
    coveredCities: ['طرابلس', 'بنغازي', 'زليتن', 'مصراتة', 'سبها', 'الزاوية'],
    rates: {
      'طرابلس': { 'طرابلس': 8, 'بنغازي': 25, 'زليتن': 20, 'مصراتة': 15, 'سبها': 35, 'الزاوية': 10 },
      'بنغازي': { 'طرابلس': 25, 'بنغازي': 8, 'زليتن': 30, 'مصراتة': 28, 'سبها': 40, 'الزاوية': 27 },
      'زليتن':  { 'طرابلس': 20, 'بنغازي': 30, 'زليتن': 6, 'مصراتة': 12, 'سبها': 38, 'الزاوية': 22 },
      'مصراتة': { 'طرابلس': 15, 'بنغازي': 28, 'زليتن': 12, 'مصراتة': 6, 'سبها': 36, 'الزاوية': 18 },
      'سبها':   { 'طرابلس': 35, 'بنغازي': 40, 'زليتن': 38, 'مصراتة': 36, 'سبها': 8, 'الزاوية': 37 },
      'الزاوية': { 'طرابلس': 10, 'بنغازي': 27, 'زليتن': 22, 'مصراتة': 18, 'سبها': 37, 'الزاوية': 5 },
    },
  },
  {
    id: 'dc-002',
    name: 'الأمانة للشحن',
    logo: 'https://ui-avatars.com/api/?name=أمانة&background=2ecc71&color=fff&size=100',
    description: 'شحن آمن وموثوق بأسعار منافسة لجميع المدن',
    fee: 12,
    estimatedDays: '2-3 أيام',
    isActive: true,
    coveredCities: ['طرابلس', 'بنغازي', 'مصراتة', 'سبها'],
    rates: {
      'طرابلس': { 'طرابلس': 7, 'بنغازي': 22, 'مصراتة': 14, 'سبها': 32 },
      'بنغازي': { 'طرابلس': 22, 'بنغازي': 7, 'مصراتة': 25, 'سبها': 38 },
      'مصراتة': { 'طرابلس': 14, 'بنغازي': 25, 'مصراتة': 5, 'سبها': 33 },
      'سبها':   { 'طرابلس': 32, 'بنغازي': 38, 'مصراتة': 33, 'سبها': 7 },
    },
  },
  {
    id: 'dc-003',
    name: 'برق إكسبريس',
    logo: 'https://ui-avatars.com/api/?name=برق&background=f39c12&color=fff&size=100',
    description: 'الأسرع في التوصيل داخل طرابلس وبنغازي',
    fee: 20,
    estimatedDays: '24 ساعة',
    isActive: true,
    coveredCities: ['طرابلس', 'بنغازي'],
    rates: {
      'طرابلس': { 'طرابلس': 10, 'بنغازي': 30 },
      'بنغازي': { 'طرابلس': 30, 'بنغازي': 10 },
    },
  },
];

export const categories = [
  {
    id: 'phones',
    name: 'الهواتف الذكية',
    icon: 'Smartphone',
    count: MOCK_PRODUCTS.filter(p => p.category === 'phones').length,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
  },
  {
    id: 'tablets',
    name: 'الأجهزة اللوحية',
    icon: 'Tablet',
    count: MOCK_PRODUCTS.filter(p => p.category === 'tablets').length,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop',
  },
  {
    id: 'laptops',
    name: 'الحواسيب المحمولة',
    icon: 'Laptop',
    count: MOCK_PRODUCTS.filter(p => p.category === 'laptops').length,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop',
  },
  {
    id: 'accessories',
    name: 'الإكسسوارات',
    icon: 'Headphones',
    count: MOCK_PRODUCTS.filter(p => p.category === 'accessories').length,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
  },
];

// ── Used / Refurbished Products ───────────────────────────────────────────────
const USED_PRODUCTS: Product[] = [
  {
    id: 'used-p-001', name: 'آيفون 13 مستعمل — حالة ممتازة', description: 'آيفون 13 مستعمل بحالة ممتازة، لا توجد خدوش ظاهرة، البطارية 91٪. يأتي مع الشاحن الأصلي.', category: 'phones', brand: 'Apple',
    images: ['https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=400&h=400&fit=crop'],
    specifications: { 'الشاشة': '6.1 بوصة OLED', 'المعالج': 'A15 Bionic', 'البطارية': '91٪', 'التخزين': '128 GB' },
    merchantId: 'm-ly-001', merchantName: 'محل الأمين للجوالات', price: 3500, oldPrice: 5200, stock: 1,
    rating: 4.5, reviewCount: 3, isFeatured: false, isPending: false, isUsed: true,
  },
  {
    id: 'used-p-002', name: 'سامسونج S22 مستعمل — 128 جيجا', description: 'سامسونج جالاكسي S22 مستعمل بحالة جيدة جداً، شاشة بدون كسور، يعمل بكفاءة عالية.', category: 'phones', brand: 'Samsung',
    images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop'],
    specifications: { 'الشاشة': '6.1 بوصة AMOLED', 'المعالج': 'Snapdragon 8 Gen 1', 'البطارية': '86٪', 'التخزين': '128 GB' },
    merchantId: 'm-ly-002', merchantName: 'فرسان الهواتف', price: 2000, oldPrice: 3400, stock: 2,
    rating: 4.2, reviewCount: 5, isFeatured: false, isPending: false, isUsed: true,
  },
  {
    id: 'used-p-003', name: 'شاومي 12 مستعمل — حالة جيدة', description: 'شاومي 12 مستعمل بحالة جيدة، شاشة AMOLED سليمة، يأتي مع الكرتونة الأصلية والشاحن السريع.', category: 'phones', brand: 'Xiaomi',
    images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop'],
    specifications: { 'الشاشة': '6.28 بوصة AMOLED', 'المعالج': 'Snapdragon 8 Gen 1', 'البطارية': '89٪', 'التخزين': '256 GB' },
    merchantId: 'm-ly-003', merchantName: 'تقنية زليتن', price: 1500, oldPrice: 2800, stock: 1,
    rating: 4.0, reviewCount: 2, isFeatured: false, isPending: false, isUsed: true,
  },
  {
    id: 'used-p-004', name: 'هواوي P50 Pro مستعمل', description: 'هواوي P50 Pro مستعمل بحالة ممتازة، كاميرا ليكا بجودة عالية، الجهاز نظيف ومعه الشاحن.', category: 'phones', brand: 'Huawei',
    images: ['https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400&h=400&fit=crop'],
    specifications: { 'الشاشة': '6.6 بوصة OLED', 'المعالج': 'Kirin 9000', 'البطارية': '88٪', 'التخزين': '256 GB' },
    merchantId: 'm-ly-002', merchantName: 'فرسان الهواتف', price: 1800, oldPrice: 3200, stock: 1,
    rating: 4.3, reviewCount: 4, isFeatured: false, isPending: false, isUsed: true,
  },
  {
    id: 'used-p-005', name: 'أوبو Find X5 مستعمل', description: 'أوبو Find X5 مستعمل بحالة جيدة جداً، شاشة ProXDR سليمة تماماً. مثالي لمن يريد جهاز قوي بسعر مناسب.', category: 'phones', brand: 'OPPO',
    images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop'],
    specifications: { 'الشاشة': '6.55 بوصة AMOLED', 'المعالج': 'Snapdragon 8 Gen 1', 'البطارية': '84٪', 'التخزين': '256 GB' },
    merchantId: 'm-ly-001', merchantName: 'محل الأمين للجوالات', price: 2200, oldPrice: 3600, stock: 1,
    rating: 4.1, reviewCount: 2, isFeatured: false, isPending: false, isUsed: true,
  },
  {
    id: 'used-p-006', name: 'سامسونج A52 مستعمل', description: 'سامسونج A52 مستعمل في حالة جيدة، شاشة سليمة بدون خدوش، مناسب للاستخدام اليومي.', category: 'phones', brand: 'Samsung',
    images: ['https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=400&fit=crop'],
    specifications: { 'الشاشة': '6.5 بوصة SuperAMOLED', 'المعالج': 'Snapdragon 720G', 'البطارية': '82٪', 'التخزين': '128 GB' },
    merchantId: 'm-ly-003', merchantName: 'تقنية زليتن', price: 1200, oldPrice: 2000, stock: 2,
    rating: 3.9, reviewCount: 6, isFeatured: false, isPending: false, isUsed: true,
  },
  {
    id: 'used-p-007', name: 'ديل XPS 15 مستعمل — Core i7', description: 'لابتوب ديل XPS 15 مستعمل بحالة ممتازة، شاشة OLED 4K سليمة، مناسب للمصممين والمطورين.', category: 'laptops', brand: 'Dell',
    images: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=400&fit=crop'],
    specifications: { 'المعالج': 'Intel Core i7-12th', 'الرام': '16 GB', 'الشاشة': '15.6 بوصة OLED 4K', 'التخزين': '512 GB NVMe' },
    merchantId: 'm-ly-004', merchantName: 'مركز النخبة التقني', price: 2800, oldPrice: 5000, stock: 1,
    rating: 4.6, reviewCount: 3, isFeatured: false, isPending: false, isUsed: true,
  },
  {
    id: 'used-p-008', name: 'HP EliteBook 840 مستعمل', description: 'HP EliteBook 840 مستعمل بحالة جيدة جداً، متين ومثالي للعمل، يأتي بضمان 3 أشهر من المحل.', category: 'laptops', brand: 'HP',
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop'],
    specifications: { 'المعالج': 'Intel Core i5-11th', 'الرام': '8 GB', 'الشاشة': '14 بوصة FHD', 'التخزين': '256 GB SSD' },
    merchantId: 'm-ly-005', merchantName: 'الحاسوب الذهبي', price: 2200, oldPrice: 3800, stock: 2,
    rating: 4.3, reviewCount: 5, isFeatured: false, isPending: false, isUsed: true,
  },
  {
    id: 'used-p-009', name: 'لينوفو ThinkPad T14 مستعمل', description: 'لينوفو ThinkPad T14 مستعمل بحالة جيدة، لابتوب تجاري موثوق، شاشة IPS واضحة.', category: 'laptops', brand: 'Lenovo',
    images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=400&fit=crop'],
    specifications: { 'المعالج': 'AMD Ryzen 5 Pro', 'الرام': '16 GB', 'الشاشة': '14 بوصة IPS FHD', 'التخزين': '512 GB SSD' },
    merchantId: 'm-ly-004', merchantName: 'مركز النخبة التقني', price: 1800, oldPrice: 3200, stock: 1,
    rating: 4.4, reviewCount: 4, isFeatured: false, isPending: false, isUsed: true,
  },
  {
    id: 'used-p-010', name: 'آسوس VivoBook 15 مستعمل', description: 'آسوس VivoBook 15 مستعمل بحالة جيدة، مناسب للطلاب والاستخدام اليومي، خفيف الوزن.', category: 'laptops', brand: 'ASUS',
    images: ['https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=400&fit=crop'],
    specifications: { 'المعالج': 'Intel Core i5-10th', 'الرام': '8 GB', 'الشاشة': '15.6 بوصة FHD', 'التخزين': '512 GB SSD' },
    merchantId: 'm-ly-005', merchantName: 'الحاسوب الذهبي', price: 1400, oldPrice: 2400, stock: 3,
    rating: 4.0, reviewCount: 7, isFeatured: false, isPending: false, isUsed: true,
  },
];

export const MOCK_PRODUCTS_ALL = [...MOCK_PRODUCTS, ...USED_PRODUCTS];

// ── Merchant ↔ Exclusive Delivery Company mapping ────────────────────────────
export const MERCHANT_DELIVERY_MAP: Record<string, string> = {
  'm-ly-001': 'dc-001', // محل الأمين للجوالات → شركة السريع
  'm-ly-002': 'dc-002', // فرسان الهواتف → الأمانة للشحن
  'm-ly-003': 'dc-001', // تقنية زليتن → شركة السريع
  'm-ly-004': 'dc-001', // مركز النخبة → شركة السريع
  'm-ly-005': 'dc-002', // الحاسوب الذهبي → الأمانة للشحن
};

// delivery-company-id → delivery-user-id mapping
export const DELIVERY_COMPANY_USER_MAP: Record<string, string> = {
  'dc-001': 'del-saree',
  'dc-002': 'del-amanah',
};

export const brands = [
  'Apple',
  'Samsung',
  'Xiaomi',
  'OnePlus',
  'Huawei',
  'Dell',
  'HP',
  'ASUS',
  'Lenovo',
  'MSI',
  'Acer',
  'Logitech',
  'OPPO',
  'Realme',
  'Vivo',
  'Infinix',
  'Tecno',
  'Sony',
  'Anker',
  'Keychron',
];
