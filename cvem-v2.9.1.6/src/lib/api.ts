import { supabase, supabaseConfigured } from './supabase';
import { MOCK_MERCHANTS, MOCK_PRODUCTS, MOCK_PRODUCTS_ALL, deliveryCompanies as MOCK_DELIVERY } from '../data/mockData';

// ── SHA-256 via browser Web Crypto API ────────────────────────────────────────
async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function makeToken(user: any): string {
  return btoa(JSON.stringify({
    id: user.id,
    role: user.role,
    merchantId: user.merchant_id ?? null,
  }));
}

function mapUser(row: any) {
  return {
    id: row.id, name: row.name, email: row.email,
    role: row.role, phone: row.phone,
    merchantId: row.merchant_id ?? null,
    deliveryId: row.delivery_id ?? null,
    createdAt: row.created_at,
  };
}

function mapMerchant(row: any) {
  return {
    id: row.id, storeName: row.store_name, ownerName: row.owner_name,
    email: row.email, phone: row.phone, address: row.address,
    logo: row.logo, description: row.description,
    categories: row.categories ?? [],
    rating: Number(row.rating ?? 0),
    productCount: row.product_count ?? 0,
    isVerified: row.is_verified ?? false,
    isDemo: row.is_demo ?? false,
    joinedAt: row.joined_at,
  };
}

function mapProduct(row: any) {
  return {
    id: row.id, name: row.name, description: row.description,
    category: row.category, brand: row.brand,
    price: Number(row.price), stock: row.stock,
    colorVariants: row.color_variants ?? [],
    images: row.images ?? [],
    specifications: row.specifications ?? {},
    merchantId: row.merchant_id,
    merchantName: row.merchant_name,
    isPending: row.is_pending ?? true,
    isDemo: row.is_demo ?? false,
    isFeatured: row.is_featured ?? false,
    rating: Number(row.rating ?? 0),
    reviewCount: row.review_count ?? 0,
    createdAt: row.created_at,
  };
}

function mapOrder(row: any) {
  return {
    id: row.id, customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerAddress: row.customer_address,
    items: row.items ?? [], total: Number(row.total),
    status: row.status,
    deliveryCompanyId: row.delivery_company_id,
    merchantId: row.merchant_id ?? undefined,
    notes: row.notes, isDemo: row.is_demo,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function mapDelivery(row: any) {
  return {
    id: row.id, name: row.name, logo: row.logo,
    description: row.description,
    fee: Number(row.fee ?? 0),
    estimatedDays: row.estimated_days,
    isActive: row.is_active,
  };
}

function throwIf(error: any, msg?: string) {
  if (error) throw new Error(msg || error.message || 'خطأ في قاعدة البيانات');
}

// ── Mock data filter helpers ───────────────────────────────────────────────────
function filterMockProducts(params?: Record<string, string>) {
  let r = MOCK_PRODUCTS_ALL.filter(p => !p.isPending);
  if (params?.used === 'true') {
    r = r.filter(p => p.isUsed === true);
  } else if (!params?.includeUsed) {
    r = r.filter(p => !p.isUsed);
  }
  if (params?.merchantId) r = r.filter(p => p.merchantId === params.merchantId);
  if (params?.category)   r = r.filter(p => p.category === params.category);
  if (params?.search) {
    const q = params.search.toLowerCase();
    r = r.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  }
  if (params?.featured === 'true') r = r.filter(p => p.isFeatured);
  return r;
}

// ── API object ────────────────────────────────────────────────────────────────
export const api = {

  // ── Auth ───────────────────────────────────────────────────────────────────
  login: async (email: string, password: string) => {
    if (!supabaseConfigured) {
      if ((email === 'owner@cvem.ly' && password === 'owner123') || (email === '123' && password === '123')) {
        const user = { id: 'owner-001', name: 'مالك المنصة', email: 'owner@cvem.ly', role: 'owner', phone: '0910000000', merchantId: null, deliveryId: null, createdAt: new Date().toISOString() };
        return { user, token: btoa(JSON.stringify({ id: user.id, role: user.role, merchantId: null })) };
      }
      if ((email === 'متجر الأمين' || email === 'محل الأمين للجوالات' || email === 'merchant@cvem.ly') && password === '123') {
        const user = { id: 'm-user-001', name: 'محل الأمين للجوالات', email: 'merchant@cvem.ly', role: 'merchant', phone: '0913001001', merchantId: 'm-ly-001', deliveryId: null, createdAt: new Date().toISOString() };
        return { user, token: btoa(JSON.stringify({ id: user.id, role: user.role, merchantId: 'm-ly-001' })) };
      }
      if ((email === 'فرسان الهواتف' || email === 'fursan@cvem.ly') && password === '123') {
        const user = { id: 'm-user-002', name: 'فرسان الهواتف', email: 'fursan@cvem.ly', role: 'merchant', phone: '0923002002', merchantId: 'm-ly-002', deliveryId: null, createdAt: new Date().toISOString() };
        return { user, token: btoa(JSON.stringify({ id: user.id, role: user.role, merchantId: 'm-ly-002' })) };
      }
      if ((email === 'زبون تجريبي 1' || email === 'customer@cvem.ly') && password === '123') {
        const user = { id: 'cust-001', name: 'زبون تجريبي 1', email: 'customer@cvem.ly', role: 'customer', phone: '0913009009', merchantId: null, deliveryId: null, createdAt: new Date().toISOString() };
        return { user, token: btoa(JSON.stringify({ id: user.id, role: user.role, merchantId: null })) };
      }
      if ((email === 'زبون تجريبي 2' || email === 'customer2@cvem.ly') && password === '123') {
        const user = { id: 'cust-002', name: 'زبون تجريبي 2', email: 'customer2@cvem.ly', role: 'customer', phone: '0923009009', merchantId: null, deliveryId: null, createdAt: new Date().toISOString() };
        return { user, token: btoa(JSON.stringify({ id: user.id, role: user.role, merchantId: null })) };
      }
      if (email === 'موظف دعم 1' && password === '123') {
        const user = { id: 'support-001', name: 'موظف دعم 1', email: 'support1@cvem.ly', role: 'support', phone: '0910000011', merchantId: null, deliveryId: null, createdAt: new Date().toISOString() };
        return { user, token: btoa(JSON.stringify({ id: user.id, role: user.role, merchantId: null })) };
      }
      if (email === 'موظف دعم 2' && password === '123') {
        const user = { id: 'support-002', name: 'موظف دعم 2', email: 'support2@cvem.ly', role: 'support', phone: '0910000022', merchantId: null, deliveryId: null, createdAt: new Date().toISOString() };
        return { user, token: btoa(JSON.stringify({ id: user.id, role: user.role, merchantId: null })) };
      }
      if ((email === 'شركة السريع' || email === 'del-saree') && password === '123') {
        const user = { id: 'del-saree', name: 'شركة السريع', email: 'saree@cvem.ly', role: 'delivery', phone: '0913111111', merchantId: null, deliveryId: 'dc-001', createdAt: new Date().toISOString() };
        return { user, token: btoa(JSON.stringify({ id: user.id, role: user.role, merchantId: null })) };
      }
      if ((email === 'الأمانة للشحن' || email === 'del-amanah') && password === '123') {
        const user = { id: 'del-amanah', name: 'الأمانة للشحن', email: 'amanah@cvem.ly', role: 'delivery', phone: '0923222222', merchantId: null, deliveryId: 'dc-002', createdAt: new Date().toISOString() };
        return { user, token: btoa(JSON.stringify({ id: user.id, role: user.role, merchantId: null })) };
      }
      throw new Error('بيانات الدخول غير صحيحة');
    }
    const hash = await sha256(password);
    const { data, error } = await supabase
      .from('users').select('*')
      .eq('email', email).eq('password_hash', hash).maybeSingle();
    if (error) throwIf(error);
    if (!data) throw new Error('بيانات الدخول غير صحيحة');
    return { user: mapUser(data), token: makeToken(data) };
  },

  register: async (name: string, email: string, phone: string, password: string) => {
    if (!supabaseConfigured) throw new Error('التسجيل يتطلب اتصال قاعدة البيانات');
    const { data: exists } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (exists) throw new Error('البريد الإلكتروني مسجل مسبقاً');
    const hash = await sha256(password);
    const id = `u-${Date.now()}`;
    const { data, error } = await supabase.from('users')
      .insert({ id, name, email, phone, password_hash: hash, role: 'customer' })
      .select().single();
    throwIf(error);
    return { user: mapUser(data), token: makeToken(data) };
  },

  merchantRegister: async (body: any) => {
    if (!supabaseConfigured) throw new Error('التسجيل يتطلب اتصال قاعدة البيانات');
    const { data: exists } = await supabase.from('users').select('id').eq('email', body.email).maybeSingle();
    if (exists) throw new Error('البريد الإلكتروني مسجل مسبقاً');
    const hash = await sha256(body.password);
    const merchantId = `m-${Date.now()}`;
    const userId = `u-m-${Date.now() + 1}`;
    const logo = `https://ui-avatars.com/api/?name=${encodeURIComponent(body.storeName || body.name)}&background=0070c8&color=fff&size=200`;
    const { error: merr } = await supabase.from('shops').insert({
      id: merchantId, store_name: body.storeName || body.name,
      owner_name: body.name || body.storeName,
      email: body.email, phone: body.phone,
      address: body.address || 'غير محدد', logo,
      description: body.description || `متجر ${body.storeName || body.name}`,
      categories: body.categories || [],
      rating: 0, product_count: 0, is_verified: false, is_demo: false,
    });
    throwIf(merr, 'فشل تسجيل المحل');
    const { data: userData, error: uerr } = await supabase.from('users').insert({
      id: userId, name: body.name || body.storeName,
      email: body.email, phone: body.phone,
      password_hash: hash, role: 'merchant', merchant_id: merchantId,
    }).select().single();
    throwIf(uerr, 'فشل إنشاء حساب التاجر');
    const user = mapUser(userData);
    return { user: { ...user, merchantId }, token: makeToken(userData) };
  },

  // ── Products ───────────────────────────────────────────────────────────────
  getProducts: async (params?: Record<string, string>) => {
    if (!supabaseConfigured) return filterMockProducts(params) as any[];
    let q = supabase.from('products').select('*');
    if (params?.merchantId) q = q.eq('merchant_id', params.merchantId);
    if (params?.category)   q = q.eq('category', params.category);
    if (params?.search)     q = q.or(`name.ilike.%${params.search}%,brand.ilike.%${params.search}%`);
    if (params?.featured === 'true') {
      q = q.eq('is_featured', true).eq('is_pending', false);
    } else if (!params?.merchantId) {
      q = q.eq('is_pending', false);
    }
    const { data, error } = await q.order('created_at', { ascending: false });
    throwIf(error);
    return (data ?? []).map(mapProduct);
  },

  getProduct: async (id: string) => {
    if (!supabaseConfigured) {
      const p = MOCK_PRODUCTS.find(p => p.id === id);
      if (!p) throw new Error('المنتج غير موجود');
      return p as any;
    }
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    throwIf(error);
    return mapProduct(data);
  },

  createProduct: async (body: any) => {
    if (!supabaseConfigured) throw new Error('إضافة المنتجات يتطلب اتصال قاعدة البيانات');
    const colorVariants: Array<{ color: string; qty: number }> = body.colorVariants || [];
    const computedStock = colorVariants.length > 0
      ? colorVariants.reduce((s: number, cv: any) => s + (Number(cv.qty) || 0), 0)
      : (Number(body.stock) || 0);
    const id = `p-${Date.now()}`;
    const { data, error } = await supabase.from('products').insert({
      id, name: body.name, description: body.description || '',
      category: body.category, brand: body.brand || '', price: body.price,
      stock: computedStock, color_variants: colorVariants,
      images: body.images || [], specifications: body.specifications || {},
      merchant_id: body.merchantId, merchant_name: body.merchantName || '',
      is_pending: true, is_demo: false, is_featured: false, rating: 0, review_count: 0,
    }).select().single();
    throwIf(error);
    if (body.merchantId) {
      const { count } = await supabase.from('products')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', body.merchantId).eq('is_pending', false);
      await supabase.from('shops').update({ product_count: count || 0 }).eq('id', body.merchantId);
    }
    return mapProduct(data);
  },

  updateProduct: async (id: string, body: any) => {
    if (!supabaseConfigured) throw new Error('تعديل المنتجات يتطلب اتصال قاعدة البيانات');
    const colorVariants = body.colorVariants ?? [];
    const computedStock = colorVariants.length > 0
      ? colorVariants.reduce((s: number, cv: any) => s + (Number(cv.qty) || 0), 0)
      : (Number(body.stock) ?? 0);
    const { data, error } = await supabase.from('products').update({
      name: body.name, description: body.description, category: body.category,
      brand: body.brand, price: body.price, stock: computedStock,
      color_variants: colorVariants, images: body.images || [],
      specifications: body.specifications || {},
      is_pending: body.isPending ?? true, is_featured: body.isFeatured ?? false,
    }).eq('id', id).select().single();
    throwIf(error);
    return mapProduct(data);
  },

  deleteProduct: async (id: string) => {
    if (!supabaseConfigured) throw new Error('حذف المنتجات يتطلب اتصال قاعدة البيانات');
    const { data: prod } = await supabase.from('products').select('merchant_id').eq('id', id).maybeSingle();
    const { error } = await supabase.from('products').delete().eq('id', id);
    throwIf(error);
    if (prod?.merchant_id) {
      const { count } = await supabase.from('products')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', prod.merchant_id).eq('is_pending', false);
      await supabase.from('shops').update({ product_count: count || 0 }).eq('id', prod.merchant_id);
    }
    return { ok: true };
  },

  // ── Shops ──────────────────────────────────────────────────────────────────
  getMerchants: async () => {
    if (!supabaseConfigured) return MOCK_MERCHANTS as any[];
    const { data, error } = await supabase.from('shops').select('*').order('joined_at', { ascending: false });
    throwIf(error);
    return (data ?? []).map(mapMerchant);
  },

  getMerchant: async (id: string) => {
    if (!supabaseConfigured) {
      const m = MOCK_MERCHANTS.find(m => m.id === id);
      if (!m) throw new Error('المحل غير موجود');
      return m as any;
    }
    const { data, error } = await supabase.from('shops').select('*').eq('id', id).single();
    throwIf(error);
    return mapMerchant(data);
  },

  updateMerchant: async (id: string, body: any) => {
    if (!supabaseConfigured) throw new Error('تعديل المحلات يتطلب اتصال قاعدة البيانات');
    const updates: Record<string, any> = {};
    if (body.storeName  !== undefined) updates.store_name  = body.storeName;
    if (body.ownerName  !== undefined) updates.owner_name  = body.ownerName;
    if (body.phone      !== undefined) updates.phone       = body.phone;
    if (body.address    !== undefined) updates.address     = body.address;
    if (body.description!== undefined) updates.description = body.description;
    if (body.isVerified !== undefined) updates.is_verified = body.isVerified;
    const { data, error } = await supabase.from('shops').update(updates).eq('id', id).select().single();
    throwIf(error);
    return mapMerchant(data);
  },

  // ── Delivery ───────────────────────────────────────────────────────────────
  getDeliveryCompanies: async () => {
    if (!supabaseConfigured) return MOCK_DELIVERY.filter(d => d.isActive) as any[];
    const { data, error } = await supabase.from('delivery_companies')
      .select('*').eq('is_active', true).order('id');
    throwIf(error);
    return (data ?? []).map(mapDelivery);
  },

  // ── Orders ─────────────────────────────────────────────────────────────────
  createOrder: async (body: any) => {
    if (!supabaseConfigured) {
      const existing = JSON.parse(localStorage.getItem('mock_orders') || '[]');
      existing.unshift(body);
      localStorage.setItem('mock_orders', JSON.stringify(existing));
      return body;
    }
    const id = body.id || `ORD-${Date.now()}`;
    const { data, error } = await supabase.from('orders').insert({
      id, customer_id: body.customerId || null,
      customer_name: body.customerName || '', customer_phone: body.customerPhone || '',
      customer_address: body.customerAddress || '', items: body.items || [],
      total: body.total || 0, status: body.status || 'pending',
      delivery_company_id: body.deliveryCompanyId || null,
      merchant_id: body.merchantId || null,
      notes: body.notes || '', is_demo: false,
    }).select().single();
    throwIf(error);
    return mapOrder(data);
  },

  getOrder: async (id: string) => {
    if (!supabaseConfigured) throw new Error('يتطلب اتصال قاعدة البيانات');
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
    throwIf(error);
    return mapOrder(data);
  },

  getOrders: async (params?: Record<string, string>) => {
    if (!supabaseConfigured) return [];
    let q = supabase.from('orders').select('*');
    if (params?.customerId) q = q.eq('customer_id', params.customerId);
    const { data, error } = await q.order('created_at', { ascending: false });
    throwIf(error);
    return (data ?? []).map(mapOrder);
  },

  updateOrderStatus: async (id: string, status: string) => {
    if (!supabaseConfigured) throw new Error('يتطلب اتصال قاعدة البيانات');
    const { data, error } = await supabase.from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    throwIf(error);
    return mapOrder(data);
  },

  // ── Stats ──────────────────────────────────────────────────────────────────
  getPublicStats: async () => {
    if (!supabaseConfigured) {
      return {
        totalMerchants: MOCK_MERCHANTS.length,
        totalProducts:  MOCK_PRODUCTS.filter(p => !p.isPending).length,
        totalOrders: 0, totalCustomers: 0,
        deliveryCount: MOCK_DELIVERY.filter(d => d.isActive).length,
        totalRevenue: 0,
      };
    }
    const [mc, pc, oc, uc, dc, revR] = await Promise.all([
      supabase.from('shops').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_pending', false),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase.from('delivery_companies').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('orders').select('total'),
    ]);
    const totalRevenue = revR.data?.reduce((s, r) => s + Number(r.total), 0) ?? 0;
    return { totalMerchants: mc.count ?? 0, totalProducts: pc.count ?? 0, totalOrders: oc.count ?? 0, totalCustomers: uc.count ?? 0, deliveryCount: dc.count ?? 0, totalRevenue };
  },

  getOwnerStats: async () => {
    if (!supabaseConfigured) {
      return {
        totalMerchants:   MOCK_MERCHANTS.length,
        totalProducts:    MOCK_PRODUCTS.filter(p => !p.isPending).length,
        totalOrders: 0, totalRevenue: 0, platformEarnings: 0, deliveryEarnings: 0,
        activeMerchants:  MOCK_MERCHANTS.filter(m => m.isVerified).length,
        pendingMerchants: MOCK_MERCHANTS.filter(m => !m.isVerified).length,
      };
    }
    const [mc, pc, oc, revR, amc, pmc] = await Promise.all([
      supabase.from('shops').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_pending', false),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('total'),
      supabase.from('shops').select('id', { count: 'exact', head: true }).eq('is_verified', true),
      supabase.from('shops').select('id', { count: 'exact', head: true }).eq('is_verified', false),
    ]);
    const totalRevenue = revR.data?.reduce((s, r) => s + Number(r.total), 0) ?? 0;
    return { totalMerchants: mc.count ?? 0, totalProducts: pc.count ?? 0, totalOrders: oc.count ?? 0, totalRevenue, platformEarnings: totalRevenue, deliveryEarnings: 0, activeMerchants: amc.count ?? 0, pendingMerchants: pmc.count ?? 0 };
  },

  getOwnerOrders: async () => {
    if (!supabaseConfigured) return [];
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    throwIf(error);
    return (data ?? []).map(mapOrder);
  },

  getPendingProducts: async () => {
    if (!supabaseConfigured) return [];
    const { data, error } = await supabase.from('products').select('*')
      .eq('is_pending', true).order('created_at', { ascending: false });
    throwIf(error);
    return (data ?? []).map(mapProduct);
  },

  getMerchantStats: async (id: string | number) => {
    if (!supabaseConfigured) {
      const mid = String(id);
      const prods = MOCK_PRODUCTS.filter(p => p.merchantId === mid && !p.isPending);
      return { totalOrders: 0, totalSales: 0, productCount: prods.length, pendingOrders: 0 };
    }
    const mid = String(id);
    const { data: allOrders } = await supabase.from('orders').select('*');
    const merchantOrders = (allOrders ?? []).filter(
      (o: any) => Array.isArray(o.items) && o.items.some((item: any) => item.merchantId === mid)
    );
    const totalSales = merchantOrders.reduce((s: number, o: any) => s + Number(o.total), 0);
    const pendingOrders = merchantOrders.filter((o: any) => o.status === 'pending').length;
    const { count: productCount } = await supabase.from('products')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', mid).eq('is_pending', false);
    return { totalOrders: merchantOrders.length, totalSales, productCount: productCount ?? 0, pendingOrders };
  },

  getMerchantOrders: async (id: string | number) => {
    if (!supabaseConfigured) {
      const mid = String(id);
      try {
        const saved = JSON.parse(localStorage.getItem('orders') || '[]');
        return saved.filter((o: any) =>
          Array.isArray(o.items) && o.items.some((item: any) =>
            item.store?.id === mid || item.product?.merchantId === mid || item.merchantId === mid
          )
        );
      } catch { return []; }
    }
    const mid = String(id);
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    throwIf(error);
    return (data ?? [])
      .filter((o: any) => Array.isArray(o.items) && o.items.some((item: any) => item.merchantId === mid))
      .map(mapOrder);
  },

  deleteDemoData: async () => {
    if (!supabaseConfigured) return { ok: true, message: 'تم حذف البيانات التجريبية (وضع تجريبي)' };
    await Promise.all([
      supabase.from('products').delete().eq('is_demo', true),
      supabase.from('orders').delete().eq('is_demo', true),
      supabase.from('shops').delete().eq('is_demo', true),
    ]);
    return { ok: true, message: 'تم حذف البيانات التجريبية بنجاح' };
  },
};
