import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Product, Merchant, CartItem, Order, OrderStatus, User, MasterOrder, SubOrder, MERCHANT_DELIVERY_MAP } from '../data/mockData';

export interface CustomerFeedback {
  id: string;
  masterOrderId: string;   // الطلب الرئيسي
  subOrderId: string;      // الطلبية الفرعية المحددة
  orderId: string;         // يُبقى للتوافق مع التقييمات القديمة
  customerId: string;
  customerName: string;
  merchantId: string;
  merchantName: string;
  deliveryCompanyId: string;
  deliveryCompanyName: string;
  storeRating: number;
  storeComment: string;
  logisticsRating: number;
  logisticsComment: string;
  productRatings?: { productId: string; productName: string; rating: number; comment?: string }[];
  createdAt: string;
}

interface StoreContextType {
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, merchant: Merchant, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  updateDeliveryType: (merchantId: string, type: 'home' | 'office') => void;

  // User
  user: User | null;
  setUser: (user: User | null) => void;
  isLoggedIn: boolean;

  // Orders
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  setOrderDriverInfo: (orderId: string, driverName: string, driverPhone: string) => void;

  // Master Orders (multi-merchant support)
  masterOrders: MasterOrder[];
  addMasterOrder: (masterOrder: MasterOrder) => void;
  updateSubOrderStatus: (masterOrderId: string, subOrderId: string, status: OrderStatus) => void;
  setSubOrderDriverInfo: (masterOrderId: string, subOrderId: string, driverName: string, driverPhone: string) => void;
  merchantNotifications: { id: string; title: string; body: string; read: boolean; createdAt: Date }[];
  pushMerchantNotification: (title: string, body: string, targetMerchantId?: string) => void;
  deliveryNotifications: { id: string; title: string; body: string; read: boolean; createdAt: Date }[];
  pushDeliveryNotification: (title: string, body: string, targetCompanyId?: string) => void;
  pushCustomerNotification: (userId: string, title: string, body: string) => void;

  // Active order tracking (car icon)
  activeOrderId: string | null;
  setActiveOrderId: (id: string | null) => void;

  // Customer feedback
  customerFeedbacks: CustomerFeedback[];
  addCustomerFeedback: (feedback: CustomerFeedback) => void;

  // Toast
  showToast: boolean;
  toastMessage: string;
  toastType: 'success' | 'error' | 'info';
  toastKey: number;
  showToastMessage: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('orders');
      if (!saved) return [];
      const parsed: Order[] = JSON.parse(saved);
      // v2.9.1.6: تنظيف الطلبات الميتة — أي طلب عمره أكثر من 7 أيام وما زال pending
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const cleaned = parsed.filter((o: any) => {
        const age = now - new Date(o.createdAt).getTime();
        if (age > SEVEN_DAYS && (o.status === 'pending' || o.status === 'confirmed')) {
          return false; // حذف الطلبات العالقة
        }
        return true;
      });
      if (cleaned.length !== parsed.length) {
        localStorage.setItem('orders', JSON.stringify(cleaned));
      }
      return cleaned;
    } catch { return []; }
  });

  const [masterOrders, setMasterOrders] = useState<MasterOrder[]>(() => {
    try {
      const saved = localStorage.getItem('masterOrders');
      if (!saved) return [];
      const parsed: MasterOrder[] = JSON.parse(saved);
      // v2.9.1.6: تنظيف الطلبات الرئيسية الميتة
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const cleaned = parsed.filter((mo: any) => {
        const age = now - new Date(mo.createdAt).getTime();
        // إذا كل الطلبات الفرعية عالقة على pending لأكثر من 7 أيام → حذف
        if (age > SEVEN_DAYS) {
          const allStuck = mo.subOrders?.every((sub: any) =>
            sub.status === 'pending' || sub.status === 'confirmed'
          );
          if (allStuck) return false;
        }
        return true;
      });
      if (cleaned.length !== parsed.length) {
        localStorage.setItem('masterOrders', JSON.stringify(cleaned));
      }
      return cleaned;
    } catch { return []; }
  });

  const [merchantNotifications, setMerchantNotifications] = useState<{ id: string; title: string; body: string; read: boolean; createdAt: Date }[]>(() => {
    const saved = localStorage.getItem('merchantNotifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [deliveryNotifications, setDeliveryNotifications] = useState<{ id: string; title: string; body: string; read: boolean; createdAt: Date }[]>(() => {
    const saved = localStorage.getItem('deliveryNotifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeOrderId, setActiveOrderIdState] = useState<string | null>(() => {
    return localStorage.getItem('activeOrderId') || null;
  });

  const [customerFeedbacks, setCustomerFeedbacks] = useState<CustomerFeedback[]>(() => {
    try {
      const all: CustomerFeedback[] = JSON.parse(localStorage.getItem('customerFeedbacks') || '[]');
      // v2.8.1: discard legacy feedbacks that have no merchantId — they can never match any dashboard filter
      // v2.9.1.6: حذف التقييمات المرتبطة بطلبات تجريبية قديمة (عمرها أكثر من 30 يوم)
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const cleaned = all.filter((f: CustomerFeedback) => {
        if (!f.merchantId || f.merchantId.trim() === '') return false;
        // حذف تقييمات قديمة جداً بدون معرف طلب رئيسي صالح
        if (f.createdAt) {
          const age = now - new Date(f.createdAt).getTime();
          if (age > THIRTY_DAYS && !f.masterOrderId) return false;
        }
        return true;
      });
      if (cleaned.length !== all.length) {
        localStorage.setItem('customerFeedbacks', JSON.stringify(cleaned));
      }
      return cleaned;
    } catch { return []; }
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [toastKey, setToastKey] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('masterOrders', JSON.stringify(masterOrders)); }, [masterOrders]);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'masterOrders' && e.newValue) {
        try { setMasterOrders(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'orders' && e.newValue) {
        try { setOrders(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  useEffect(() => { localStorage.setItem('merchantNotifications', JSON.stringify(merchantNotifications)); }, [merchantNotifications]);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'merchantNotifications' && e.newValue) {
        try { setMerchantNotifications(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  useEffect(() => { localStorage.setItem('deliveryNotifications', JSON.stringify(deliveryNotifications)); }, [deliveryNotifications]);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'deliveryNotifications' && e.newValue) {
        try { setDeliveryNotifications(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  useEffect(() => {
    if (activeOrderId) localStorage.setItem('activeOrderId', activeOrderId);
    else localStorage.removeItem('activeOrderId');
  }, [activeOrderId]);
  useEffect(() => { localStorage.setItem('customerFeedbacks', JSON.stringify(customerFeedbacks)); }, [customerFeedbacks]);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'customerFeedbacks' && e.newValue) {
        try { setCustomerFeedbacks(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setActiveOrderId = (id: string | null) => setActiveOrderIdState(id);

  const addCustomerFeedback = (feedback: CustomerFeedback) => {
    setCustomerFeedbacks(prev => [feedback, ...prev]);
  };

  const addToCart = (product: Product, merchant: Merchant, quantity = 1) => {
    // ── منع الإضافة عند وجود طلبية جارية ──────────────────────────────────
    if (user?.role === 'customer' && user?.id) {
      const TWO_DAYS = 48 * 60 * 60 * 1000;
      const now = Date.now();
      const hasActiveMaster = masterOrders.some((mo: any) => {
        if (mo.customerId !== user.id) return false;
        const hasActiveSubOrder = mo.subOrders.some((sub: any) =>
          sub.status !== 'delivered' && sub.status !== 'cancelled'
        );
        if (!hasActiveSubOrder) return false;
        // v2.9.1.6: إذا كل الطلبات الفرعية عالقة على pending لأكثر من 48 ساعة → اعتبرها ميتة
        const age = now - new Date(mo.createdAt).getTime();
        if (age > TWO_DAYS) {
          const allStuckOnPending = mo.subOrders.every((sub: any) =>
            sub.status === 'pending' || sub.status === 'delivered' || sub.status === 'cancelled'
          );
          // إذا كل الفرعيات إما pending أو مكتملة — تحقق أن المعلقة كلها pending فقط
          const pendingOnly = mo.subOrders.filter((sub: any) =>
            sub.status !== 'delivered' && sub.status !== 'cancelled'
          );
          const allPending = pendingOnly.every((sub: any) => sub.status === 'pending');
          if (allPending && age > TWO_DAYS) return false; // طلب ميت، لا يمنع الشراء
        }
        return true;
      });
      const hasActiveSingle = orders.some((o: any) => {
        if (o.customerId !== user.id) return false;
        if (o.status === 'delivered' || o.status === 'cancelled') return false;
        // تجاهل الطلب إذا كان له masterOrder مقابل (masterOrders هو المرجع)
        const hasMaster = masterOrders.some((mo: any) => mo.id === o.id);
        if (hasMaster) return false;
        // v2.9.1.6: طلب عالق على pending لأكثر من 48 ساعة = ميت
        const age = now - new Date(o.createdAt).getTime();
        if (o.status === 'pending' && age > TWO_DAYS) return false;
        return true;
      });
      if (hasActiveMaster || hasActiveSingle) {
        showToastMessage(
          'لديك طلبية جارية لم يتم استلامها بعد — لا يمكنك إضافة منتجات جديدة. يمكنك الشراء مجدداً بعد استلام كل طلبياتك بنجاح.',
          'error',
          6000
        );
        return;
      }
    }
    // تحقق من الحد الأقصى للمجموعات (3 مجموعات كحد أقصى — المجموعة = متجر + شركة توصيل)
    const getCurrentGroups = (cartItems: CartItem[]) => {
      const groups = new Set<string>();
      for (const item of cartItems) {
        const dcId = MERCHANT_DELIVERY_MAP[item.selectedStore.id] || 'unknown';
        groups.add(`${item.selectedStore.id}|${dcId}`);
      }
      return groups;
    };
    const newDcId = MERCHANT_DELIVERY_MAP[merchant.id] || 'unknown';
    const newGroupKey = `${merchant.id}|${newDcId}`;
    const currentGroups = getCurrentGroups(cart);
    if (!currentGroups.has(newGroupKey) && currentGroups.size >= 3) {
      showToastMessage('الحد الأقصى 3 محلات في الطلب الواحد — أتمم طلبك الحالي أولاً', 'error');
      return;
    }
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.selectedStore.id === merchant.id
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.selectedStore.id === merchant.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, selectedStore: merchant, deliveryType: 'home' }];
    });
    showToastMessage('أضفناه إلى السلة', 'success');
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToastMessage('تم حذف المنتج من السلة', 'info');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setCart((prev) =>
      prev.map((item) => item.product.id === productId ? { ...item, quantity } : item)
    );
  };

  const clearCart = () => setCart([]);
  const getCartTotal = () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const getCartItemsCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  const updateDeliveryType = (merchantId: string, type: 'home' | 'office') => {
    setCart((prev) =>
      prev.map((item) =>
        item.selectedStore.id === merchantId ? { ...item, deliveryType: type } : item
      )
    );
  };

  const addOrder = (order: Order) => setOrders((prev) => [order, ...prev]);

  const addMasterOrder = (masterOrder: MasterOrder) => {
    setMasterOrders((prev) => [masterOrder, ...prev]);
  };

  const updateSubOrderStatus = (masterOrderId: string, subOrderId: string, status: OrderStatus) => {
    setMasterOrders((prev) =>
      prev.map((mo) => {
        if (mo.id !== masterOrderId) return mo;
        const updatedSubOrders = mo.subOrders.map((so) => {
          if (so.id !== subOrderId) return so;
          if (status === 'delivered' && mo.customerId) {
            pushCustomerNotification(
              mo.customerId,
              'طلبك وصل ✓',
              `الطلب الفرعي ${so.id} من ${so.merchantName} تم توصيله بنجاح — شكراً لتسوقك معنا!`
            );
          }
          return { ...so, status, updatedAt: new Date().toISOString() };
        });
        return { ...mo, subOrders: updatedSubOrders, updatedAt: new Date() };
      })
    );
  };

  const setSubOrderDriverInfo = (masterOrderId: string, subOrderId: string, driverName: string, driverPhone: string) => {
    setMasterOrders((prev) =>
      prev.map((mo) => {
        if (mo.id !== masterOrderId) return mo;
        return {
          ...mo,
          subOrders: mo.subOrders.map((so) =>
            so.id === subOrderId ? { ...so, driverName, driverPhone } : so
          ),
          updatedAt: new Date(),
        };
      })
    );
  };


  const pushCustomerNotification = (userId: string, title: string, body: string) => {
    const notif = {
      id: `cnotif-${Date.now()}`,
      title,
      body,
      read: false,
      createdAt: new Date().toISOString(),
      type: 'order' as const,
    };
    const key = `customer_notifications_${userId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([notif, ...existing].slice(0, 50)));
    // إذا كان المستخدم الحالي هو نفسه المستهدف، حدّث cvem_notifications مباشرة
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (currentUser?.id === userId) {
      const globalExisting = JSON.parse(localStorage.getItem('cvem_notifications') || '[]');
      localStorage.setItem('cvem_notifications', JSON.stringify([notif, ...globalExisting].slice(0, 50)));
    }
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    // تحقق مما إذا كان هذا الـ orderId هو masterOrder — في هذه الحالة
    // updateSubOrderStatus ستُرسل إشعاراً أدق للعميل، فلا نرسل إشعاراً مزدوجاً هنا
    const hasMasterOrder = masterOrders.some((mo) => mo.id === orderId);

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          // أرسل إشعاراً فقط إذا لم يكن هناك masterOrder يحمل نفس ID (تجنب الإشعار المزدوج)
          if (status === 'delivered' && o.customerId && !hasMasterOrder) {
            pushCustomerNotification(
              o.customerId,
              'طلبك وصل ✓',
              `طلب ${o.id} تم توصيله بنجاح — شكراً لتسوقك معنا!`
            );
          }
          return { ...o, status, updatedAt: new Date() };
        }
        return o;
      })
    );
  };

  const setOrderDriverInfo = (orderId: string, driverName: string, driverPhone: string) => {
    setOrders((prev) =>
      prev.map((o) => o.id === orderId ? { ...o, driverName, driverPhone, updatedAt: new Date() } : o)
    );
  };

  const pushMerchantNotification = (title: string, body: string, targetMerchantId?: string) => {
    const newNotif = { id: `notif-${Date.now()}`, title, body, read: false, createdAt: new Date() };
    setMerchantNotifications((prev) => [newNotif, ...prev].slice(0, 50));
    if (targetMerchantId) {
      const key = `merchant_notifications_${targetMerchantId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([{ ...newNotif, createdAt: new Date().toISOString() }, ...existing].slice(0, 50)));
    }
    showToastMessage(title, 'info');
  };

  const pushDeliveryNotification = (title: string, body: string, targetCompanyId?: string) => {
    const newNotif = { id: `dnotif-${Date.now()}`, title, body, companyId: targetCompanyId || '', read: false, createdAt: new Date().toISOString() };
    if (targetCompanyId) {
      // مفتاح خاص بالشركة
      const key = `delivery_notifications_${targetCompanyId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([newNotif, ...existing].slice(0, 50)));
    }
    // v2.8.4: كتابة أيضاً إلى المفتاح العام الذي يقرأ منه StoreProvider عند التهيئة
    const allExisting = JSON.parse(localStorage.getItem('deliveryNotifications') || '[]');
    localStorage.setItem('deliveryNotifications', JSON.stringify([newNotif, ...allExisting].slice(0, 50)));
    setDeliveryNotifications((prev) => [newNotif, ...prev].slice(0, 50));
    showToastMessage(title, 'info');
  };

  const showToastMessage = (message: string, type: 'success' | 'error' | 'info' = 'success', duration = 2000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(message);
    setToastType(type);
    setToastKey(k => k + 1);
    setShowToast(true);
    toastTimer.current = setTimeout(() => setShowToast(false), duration);
  };

  const value: StoreContextType = {
    cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartItemsCount,
    user, setUser, isLoggedIn: !!user,
    orders, addOrder, updateOrderStatus, setOrderDriverInfo,
    masterOrders, addMasterOrder, updateSubOrderStatus, setSubOrderDriverInfo,
    merchantNotifications, pushMerchantNotification,
    deliveryNotifications, pushDeliveryNotification,
    pushCustomerNotification,
    activeOrderId, setActiveOrderId,
    customerFeedbacks, addCustomerFeedback,
    updateDeliveryType,
    showToast, toastMessage, toastType, toastKey, showToastMessage,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error('useStore must be used within a StoreProvider');
  return context;
}
