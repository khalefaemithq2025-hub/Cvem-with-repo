import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Package, Settings, LogOut, MapPin, Clock,
  CheckCircle, ChevronRight, Phone, Zap, DollarSign, Edit3, Save, X, Menu,
  MessageSquare, Send, Headphones, Home, Building2, AlertTriangle, Star,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { deliveryCompanies, formatPrice, MERCHANT_DELIVERY_MAP } from '../data/mockData';

const CITIES = ['طرابلس', 'بنغازي', 'زليتن', 'مصراتة', 'سبها'];

const DEFAULT_RATES: Record<string, Record<string, number>> = {
  'طرابلس': { 'طرابلس': 8, 'بنغازي': 25, 'زليتن': 20, 'مصراتة': 15, 'سبها': 35 },
  'بنغازي': { 'طرابلس': 25, 'بنغازي': 8, 'زليتن': 30, 'مصراتة': 28, 'سبها': 40 },
  'زليتن': { 'طرابلس': 20, 'بنغازي': 30, 'زليتن': 6, 'مصراتة': 12, 'سبها': 38 },
  'مصراتة': { 'طرابلس': 15, 'بنغازي': 28, 'زليتن': 12, 'مصراتة': 6, 'سبها': 36 },
  'سبها': { 'طرابلس': 35, 'بنغازي': 40, 'زليتن': 38, 'مصراتة': 36, 'سبها': 8 },
};

const INITIAL_ORDERS = [
  { id: 'DEL-001', orderId: 'ORD-1234', customer: 'أحمد الورفلي', from: 'طرابلس', to: 'طرابلس، السياحية', status: 'picked_up', earnings: 25, date: '2026-05-04' },
  { id: 'DEL-002', orderId: 'ORD-1235', customer: 'فاطمة المنفي', from: 'بنغازي', to: 'بنغازي، الصابري', status: 'ready_for_pickup', earnings: 30, date: '2026-05-04' },
  { id: 'DEL-003', orderId: 'ORD-1236', customer: 'خالد الزروق', from: 'مصراتة', to: 'مصراتة، الكورنيش', status: 'delivered', earnings: 25, date: '2026-05-03' },
  { id: 'DEL-004', orderId: 'ORD-1237', customer: 'سارة الطرابلسي', from: 'طرابلس', to: 'زليتن، المدينة', status: 'delivered', earnings: 20, date: '2026-05-03' },
  { id: 'DEL-005', orderId: 'ORD-1238', customer: 'محمد العريبي', from: 'مصراتة', to: 'طرابلس، وسط المدينة', status: 'ready_for_pickup', earnings: 15, date: '2026-05-02' },
];

function getStatusConfig(status: string) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    ready_for_pickup: { label: 'جاهز للاستلام', bg: 'rgba(99,102,241,0.15)', color: '#818cf8' },
    picked_up:        { label: 'استلمته',        bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
    in_transit:       { label: 'جاري التوصيل',   bg: 'rgba(6,182,212,0.15)',  color: '#22d3ee' },
    delivered:        { label: 'تم التوصيل',     bg: 'rgba(22,163,74,0.15)',  color: '#4ade80' },
    pending:          { label: 'جديد',           bg: 'rgba(37,99,235,0.15)',  color: '#60a5fa' },
    in_progress:      { label: 'قيد التوصيل',    bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
    completed:        { label: 'مكتمل',          bg: 'rgba(22,163,74,0.15)',  color: '#4ade80' },
  };
  return map[status] || map.pending;
}

export default function DeliveryDashboard() {
  const { showToastMessage, setUser, user, orders: allOrders, masterOrders: allMasterOrders, updateOrderStatus, updateSubOrderStatus, setOrderDriverInfo, setSubOrderDriverInfo, customerFeedbacks, deliveryNotifications } = useStore();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [rates, setRates] = useState<Record<string, Record<string, number>>>(() => {
    try {
      const saved = localStorage.getItem('delivery_rates');
      return saved ? JSON.parse(saved) : DEFAULT_RATES;
    } catch { return DEFAULT_RATES; }
  });
  const [editingCell, setEditingCell] = useState<{ from: string; to: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [mandoubOrders, setMandoubOrders] = useState(INITIAL_ORDERS);
  const [confirmAcceptId, setConfirmAcceptId] = useState<string | null>(null);
  const [confirmDeliverId, setConfirmDeliverId] = useState<string | null>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [driverModalOrderId, setDriverModalOrderId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [feedbackBadge, setFeedbackBadge] = useState<number>(() => {
    const myId = user?.deliveryId ?? null;
    if (!myId) return 0;
    const fbs = JSON.parse(localStorage.getItem('customerFeedbacks') || '[]').filter((f: any) => f.deliveryCompanyId && f.deliveryCompanyId === myId);
    const lastSeen = parseInt(localStorage.getItem(`last_seen_feedback_${user?.id || 'anon'}`) || '0');
    return Math.max(0, fbs.length - lastSeen);
  });

  const myDeliveryCompanyId = user?.deliveryId ?? null;

  // SubOrders from MasterOrders belonging to this delivery company ONLY
  // لا نستخدم allOrders لأنه يحتوي على MasterOrder كامل بجميع شركات التوصيل
  const contextSubOrders = React.useMemo(() => {
    if (!myDeliveryCompanyId) return [];
    const result: any[] = [];
    for (const mo of allMasterOrders) {
      for (const sub of mo.subOrders) {
        if (sub.deliveryCompanyId === myDeliveryCompanyId) {
          result.push({
            id: `SUB-${sub.id}`,
            orderId: sub.id,
            masterOrderId: mo.id,
            subOrderId: sub.id,
            customer: mo.customerName || 'عميل',
            merchantName: sub.merchantName,
            from: sub.merchantName,
            to: mo.shippingAddress ? `${mo.shippingAddress.city}، ${mo.shippingAddress.district}` : 'غير محدد',
            status: sub.status === 'ready' ? 'ready_for_pickup' : sub.status === 'pending' ? 'ready_for_pickup' : sub.status === 'shipped' ? 'picked_up' : sub.status,
            earnings: sub.deliveryFee ?? 25,
            date: new Date(mo.createdAt).toLocaleDateString('ar-LY'),
            _isSubOrder: true,
            driverName: sub.driverName,
            driverPhone: sub.driverPhone,
          });
        }
      }
    }
    return result;
  }, [allMasterOrders, myDeliveryCompanyId]);

  // allMandoubOrders = SubOrders فقط (مفلترة بدقة لهذه الشركة وحدها)
  const allMandoubOrders = React.useMemo(() => {
    return contextSubOrders;
  }, [contextSubOrders]);

  const advanceOrderStatus = (id: string) => {
    const order = allMandoubOrders.find(o => o.id === id);
    if (!order) return;
    if (order.status === 'ready_for_pickup') {
      setConfirmAcceptId(id);
      return;
    }
    if (order.status === 'picked_up') {
      setDriverModalOrderId(id);
      setShowDriverModal(true);
      setDriverName('');
      setDriverPhone('');
      return;
    }
    if (order.status === 'in_transit') {
      setConfirmDeliverId(id);
      return;
    }
  };

  const doAdvanceStatus = (id: string) => {
    const order = allMandoubOrders.find(o => o.id === id);
    if (!order) return;
    const next: Record<string, string> = { ready_for_pickup: 'picked_up', in_transit: 'delivered' };
    const nextStatus = next[order.status];
    if (!nextStatus) return;
    if ((order as any)._isSubOrder) {
      const ctxStatus = nextStatus === 'picked_up' ? 'shipped' : 'delivered';
      updateSubOrderStatus((order as any).masterOrderId, (order as any).subOrderId, ctxStatus as any);
    } else if ((order as any)._contextOrderId) {
      const ctxStatus = nextStatus === 'picked_up' ? 'shipped' : 'delivered';
      updateOrderStatus((order as any)._contextOrderId, ctxStatus as any);
    } else {
      setMandoubOrders(prev => prev.map(o => o.id === id ? { ...o, status: nextStatus } : o));
    }
    showToastMessage(nextStatus === 'picked_up' ? 'تم تأكيد استلام الطلب' : 'تم تأكيد توصيل الطلب للعميل', 'success');
  };

  const doDriverModalConfirm = () => {
    if (!driverModalOrderId) return;
    if (!driverName.trim() || !driverPhone.trim()) {
      showToastMessage('يرجى إدخال اسم السائق ورقم هاتفه', 'error');
      return;
    }
    const order = allMandoubOrders.find(o => o.id === driverModalOrderId);
    if (!order) return;
    if ((order as any)._isSubOrder) {
      updateSubOrderStatus((order as any).masterOrderId, (order as any).subOrderId, 'in_transit' as any);
      setSubOrderDriverInfo((order as any).masterOrderId, (order as any).subOrderId, driverName.trim(), driverPhone.trim());
    } else if ((order as any)._contextOrderId) {
      updateOrderStatus((order as any)._contextOrderId, 'in_transit' as any);
      setOrderDriverInfo((order as any)._contextOrderId, driverName.trim(), driverPhone.trim());
    } else {
      setMandoubOrders(prev => prev.map(o => o.id === driverModalOrderId ? { ...o, status: 'in_transit' } : o));
    }
    setShowDriverModal(false);
    setDriverModalOrderId(null);
    setDriverName('');
    setDriverPhone('');
    showToastMessage('جاري التوصيل — تم تعيين السائق بنجاح', 'success');
  };
  const [cellDeliveryTypes, setCellDeliveryTypes] = useState<Record<string, 'home'|'office'>>(() => {
    const allHome: Record<string, 'home'|'office'> = {};
    for (const from of CITIES) for (const to of CITIES) allHome[`${from}→${to}`] = 'home';
    try {
      const saved = JSON.parse(localStorage.getItem(`delivery_cell_types_${user?.id || 'delivery-1'}`) || '{}');
      return { ...allHome, ...saved };
    } catch { return allHome; }
  });
  const saveCellType = (from: string, to: string, type: 'home'|'office') => {
    const key = `${from}→${to}`;
    const updated = { ...cellDeliveryTypes, [key]: type };
    setCellDeliveryTypes(updated);
    localStorage.setItem(`delivery_cell_types_${user?.id || 'delivery-1'}`, JSON.stringify(updated));
    showToastMessage(`${from} → ${to}: ${type === 'home' ? 'توصيل للمنزل' : 'توصيل للمكتب'}`, 'success');
  };

  const companyName = user?.name || deliveryCompanies[0]?.name || 'شركة التوصيل';
  const deliveryId = user?.id || 'delivery-1';
  const stats = { totalDeliveries: 1250, completedToday: 23, inProgress: 5, earnings: 4560 };

  const [supportChatMsg, setSupportChatMsg] = useState('');
  const [supportChatRefresh, setSupportChatRefresh] = useState(0);
  const [deliveryMerchantReply, setDeliveryMerchantReply] = useState('');
  const [deliveryTypeMode, setDeliveryTypeMode] = useState<'home'|'office'|''>(() => {
    try { return (localStorage.getItem(`delivery_type_${user?.id || 'delivery-1'}`) as 'home'|'office'|'') || ''; } catch { return ''; }
  });
  const [officeLocation, setOfficeLocation] = useState(() => {
    try { return localStorage.getItem(`delivery_office_${user?.id || 'delivery-1'}`) || ''; } catch { return ''; }
  });
  const [violations, setViolations] = useState(() => {
    try { return parseInt(localStorage.getItem(`delivery_violations_${user?.id || 'delivery-1'}`) || '0'); } catch { return 0; }
  });
  React.useEffect(() => {
    if (activeTab === 'feedback') {
      const myId = myDeliveryCompanyId;
      const matchesDelivery = (f: any) =>
        f.deliveryCompanyId && f.deliveryCompanyId === myId;
      // أعد قراءة من localStorage عند فتح التبويب لضمان رؤية أحدث البيانات
      let latestFbs = customerFeedbacks;
      try {
        const fromStorage = JSON.parse(localStorage.getItem('customerFeedbacks') || '[]');
        if (fromStorage.length >= customerFeedbacks.length) latestFbs = fromStorage;
      } catch {}
      const fbs = latestFbs.filter(matchesDelivery);
      localStorage.setItem(`last_seen_feedback_${user?.id || 'anon'}`, String(fbs.length));
      setFeedbackBadge(0);
    }
  }, [activeTab]);

  const getDeliverySupportChat = () => {
    try {
      const key = `delivery_support_chat_${deliveryId}`;
      return JSON.parse(localStorage.getItem(key) || 'null') || { deliveryId, deliveryName: companyName, messages: [], lastAt: new Date().toISOString() };
    } catch { return { deliveryId, deliveryName: companyName, messages: [], lastAt: new Date().toISOString() }; }
  };

  const sendDeliverySupportMsg = () => {
    const text = supportChatMsg.trim();
    if (!text) return;
    const key = `delivery_support_chat_${deliveryId}`;
    const data = getDeliverySupportChat();
    data.deliveryName = companyName;
    data.messages.push({ id: `msg-${Date.now()}`, from: 'delivery', text, at: new Date().toISOString(), name: companyName });
    data.lastAt = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(data));
    setSupportChatMsg('');
    setSupportChatRefresh(r => r + 1);
    showToastMessage('تم إرسال رسالتك لفريق الدعم', 'success');
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = () => {
    localStorage.setItem('logging_out', '1');
    setShowLogoutModal(false);
    navigate('/', { replace: true });
    localStorage.removeItem('token');
    setUser(null);
    showToastMessage('تم تسجيل الخروج', 'info');
    setTimeout(() => localStorage.removeItem('logging_out'), 1000);
  };

  const saveDeliveryType = (type: 'home'|'office') => {
    setDeliveryTypeMode(type);
    localStorage.setItem(`delivery_type_${deliveryId}`, type);
    showToastMessage('تم حفظ نوع التوصيل', 'success');
  };
  const saveOffice = () => {
    localStorage.setItem(`delivery_office_${deliveryId}`, officeLocation);
    showToastMessage('تم حفظ موقع المكتب', 'success');
  };

  const handleRateEdit = (from: string, to: string) => {
    setEditingCell({ from, to });
    setEditValue(String(rates[from][to]));
  };

  const handleRateSave = () => {
    if (!editingCell) return;
    const val = parseInt(editValue);
    if (isNaN(val) || val < 0) { showToastMessage('أدخل قيمة صحيحة', 'error'); return; }
    const updated = { ...rates, [editingCell.from]: { ...rates[editingCell.from], [editingCell.to]: val } };
    setRates(updated);
    localStorage.setItem('delivery_rates', JSON.stringify(updated));
    setEditingCell(null);
    showToastMessage('تم تحديث السعر', 'success');
  };

  const filteredOrders = orderFilter === 'all' ? allMandoubOrders : allMandoubOrders.filter(o => o.status === orderFilter);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const readyForPickupCount = allMandoubOrders.filter(o => o.status === 'ready_for_pickup').length;

  const menuItems = [
    { id: 'dashboard',       label: 'لوحة التحكم',       icon: LayoutDashboard },
    { id: 'deliveries',      label: 'التوصيلات',          icon: Truck,       badge: readyForPickupCount },
    { id: 'rates',           label: 'أسعار الشحن',        icon: DollarSign },
    { id: 'user-messages',   label: 'رسائل المستخدمين',   icon: MessageSquare },
    { id: 'earnings',        label: 'الأرباح',             icon: Package },
    { id: 'feedback',        label: 'تعليقات الزبائن',    icon: Star, badge: feedbackBadge },
    { id: 'contact-support', label: 'تواصل مع الدعم',     icon: Headphones },
    { id: 'settings',        label: 'الإعدادات',           icon: Settings },
  ];

  const sidebarBg = 'linear-gradient(180deg, #020817 0%, #0a1628 60%, #0c1a2e 100%)';
  const mainBg = isLight ? '#f8fafc' : '#080e1c';
  const cardBg = isLight ? '#fff' : '#0d1526';
  const cardBorder = isLight ? '#e5e7eb' : 'rgba(0,176,255,0.12)';
  const textPrimary = isLight ? '#0d2a4a' : '#e0f2fe';
  const textMuted = isLight ? '#6b7280' : 'rgba(224,242,254,0.5)';

  const sidebarCard = { background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: '1.25rem' };

  return (
    <div className="flex flex-col md:flex-row" style={{ minHeight: '100vh', background: mainBg, direction: 'rtl', fontFamily: 'Tajawal, sans-serif' }}>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: '#020817', borderBottom: '1px solid rgba(0,176,255,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(0,176,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,176,255,0.3)' }}>
            <Truck style={{ width: 18, height: 18, color: '#67e8f9' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e0f2fe' }}>بوابة التوصيل</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(p => !p)} style={{ background: 'rgba(0,176,255,0.12)', border: '1px solid rgba(0,176,255,0.25)', borderRadius: 9, padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          {isMobileMenuOpen ? <X style={{ width: 22, height: 22, color: '#67e8f9' }} /> : <Menu style={{ width: 22, height: 22, color: '#67e8f9' }} />}
        </button>
      </div>

      {/* Mobile Dropdown Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden flex-shrink-0" style={{ background: '#0a1020', borderBottom: '1px solid rgba(0,176,255,0.18)', padding: '0.6rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {menuItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.85rem', borderRadius: 10, background: activeTab === item.id ? 'rgba(0,176,255,0.2)' : 'transparent', color: activeTab === item.id ? '#67e8f9' : 'rgba(224,242,254,0.75)', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 600, fontSize: '0.88rem', textAlign: 'right', transition: 'background 0.15s' }}>
              <item.icon style={{ width: 17, height: 17, flexShrink: 0 }} />
              <span>{item.label}</span>
            </button>
          ))}
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.85rem', borderRadius: 10, background: 'transparent', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 600, fontSize: '0.88rem', textAlign: 'right', marginTop: '0.25rem' }}>
            <LogOut style={{ width: 17, height: 17, flexShrink: 0 }} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      )}

      {/* Sidebar — desktop only */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0"
        style={{ width: 240, background: sidebarBg, borderLeft: '1px solid rgba(0,176,255,0.15)', boxShadow: '2px 0 24px rgba(0,176,255,0.08)' }}>
        <Link to="/" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,176,255,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'rgba(0,176,255,0.15)', border: '1px solid rgba(0,176,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(0,176,255,0.18)' }}>
            <Zap style={{ width: 24, height: 24, color: '#67e8f9' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#e0f2fe' }}>CyberVolt e-Mall</div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(224,242,254,0.45)', marginTop: 1 }}>مجمع سايبر فولت الإلكتروني</div>
          </div>
        </Link>

        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'rgba(0,176,255,0.12)', border: '1px solid rgba(0,176,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck style={{ width: 22, height: 22, color: '#67e8f9' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e0f2fe' }}>{companyName}</div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(224,242,254,0.5)', marginTop: 1 }}>شركة التوصيل</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '1rem' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {menuItems.map(item => (
              <li key={item.id}>
                <button
                  data-nav-menu-item
                  tabIndex={0}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  onKeyDown={e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const btns = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-menu-item]')); const idx = btns.indexOf(e.currentTarget); const next = e.key === 'ArrowDown' ? btns[idx + 1] : btns[idx - 1]; if (next) next.focus(); } }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 12, background: activeTab === item.id ? 'rgba(0,176,255,0.18)' : 'transparent', color: activeTab === item.id ? '#67e8f9' : 'rgba(224,242,254,0.65)', border: activeTab === item.id ? '1px solid rgba(0,176,255,0.3)' : '1px solid transparent', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.15s', textAlign: 'right' }}
                  onMouseEnter={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                  onMouseLeave={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'transparent'; }}>
                  <item.icon style={{ width: 19, height: 19, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {(item as any).badge > 0 && (
                    <span style={{ minWidth: 20, height: 20, borderRadius: 10, background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.7)', color: '#fff', fontSize: '0.68rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                      {(item as any).badge > 9 ? '9+' : (item as any).badge}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 12, background: 'transparent', color: '#fca5a5', border: '1px solid transparent', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 600, fontSize: '0.88rem', transition: 'background 0.15s', textAlign: 'right' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <LogOut style={{ width: 19, height: 19, flexShrink: 0 }} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', minWidth: 0 }}>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: textPrimary, margin: 0 }}>لوحة التحكم</h1>
              <p style={{ color: textMuted, marginTop: 4 }}>مرحباً بك في لوحة تحكم {companyName}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'إجمالي التوصيلات', value: stats.totalDeliveries, icon: Package, color: '#60a5fa', bg: 'rgba(37,99,235,0.12)' },
                { label: 'مكتملة اليوم', value: stats.completedToday, icon: CheckCircle, color: '#4ade80', bg: 'rgba(22,163,74,0.12)' },
                { label: 'قيد التوصيل', value: stats.inProgress, icon: Truck, color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
                { label: 'الأرباح (د.ل)', value: formatPrice(stats.earnings), icon: DollarSign, color: '#a78bfa', bg: 'rgba(124,58,237,0.12)' },
              ].map((s, i) => (
                <div key={i} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: '1.25rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                    <s.icon style={{ width: 22, height: 22, color: s.color }} />
                  </div>
                  <p style={{ fontSize: '1.4rem', fontWeight: 800, color: textPrimary, margin: 0 }}>{s.value}</p>
                  <p style={{ color: textMuted, fontSize: '0.82rem', marginTop: 2 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Notifications panel — v2.8.3 */}
            {deliveryNotifications.length > 0 && (
              <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(0,176,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Star style={{ width: 16, height: 16, color: '#67e8f9' }} />
                  </div>
                  <h3 style={{ fontWeight: 700, color: textPrimary, margin: 0, fontSize: '1rem' }}>الإشعارات</h3>
                  <span style={{ fontSize: '0.75rem', color: '#67e8f9', background: 'rgba(0,176,255,0.12)', borderRadius: 20, padding: '0.1rem 0.55rem', fontWeight: 700 }}>
                    {deliveryNotifications.filter(n => !n.read).length} جديد
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {deliveryNotifications.slice(0, 5).map(n => (
                    <div key={n.id} style={{ padding: '0.75rem 1rem', borderRadius: 12, background: n.read ? (isLight ? '#f8fafc' : 'rgba(0,176,255,0.03)') : (isLight ? '#f0f9ff' : 'rgba(0,176,255,0.08)'), border: `1px solid ${n.read ? cardBorder : 'rgba(0,176,255,0.25)'}` }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: textPrimary }}>{n.title}</div>
                      <div style={{ fontSize: '0.8rem', color: textMuted, marginTop: '0.2rem' }}>{n.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent orders */}
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 700, color: textPrimary, margin: 0, fontSize: '1rem' }}>التوصيلات الأخيرة</h3>
                <button onClick={() => setActiveTab('deliveries')} style={{ fontSize: '0.82rem', color: '#67e8f9', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>عرض الكل</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {allMandoubOrders.slice(0, 3).map(order => {
                  const st = getStatusConfig(order.status);
                  return (
                    <div key={order.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: 12, background: isLight ? '#f8fafc' : 'rgba(0,176,255,0.04)', border: `1px solid ${cardBorder}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,176,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Truck style={{ width: 18, height: 18, color: '#67e8f9' }} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: textPrimary, margin: 0, fontSize: '0.88rem' }}>{order.customer}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: 2 }}>
                            <MapPin style={{ width: 11, height: 11, color: textMuted }} />
                            <span style={{ fontSize: '0.75rem', color: textMuted }}>{order.to}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: textPrimary }}>{formatPrice(order.earnings)}</span>
                        <span style={{ padding: '0.25rem 0.65rem', borderRadius: 20, background: st.bg, color: st.color, fontSize: '0.75rem', fontWeight: 600 }}>{st.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Promo banner */}
            <div style={{ borderRadius: 16, padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, rgba(0,176,255,0.15), rgba(124,58,237,0.12))', border: '1px solid rgba(0,176,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontWeight: 700, color: '#e0f2fe', margin: 0, fontSize: '1rem' }}>شركة توصيل موثوقة</h3>
                <p style={{ color: 'rgba(224,242,254,0.6)', fontSize: '0.82rem', marginTop: 4 }}>انضم إلى شبكة التوصيل في CyberVolt — بدون رسوم انضمام</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#67e8f9', margin: 0 }}>0%</p>
                <p style={{ fontSize: '0.75rem', color: 'rgba(224,242,254,0.5)', margin: 0 }}>رسوم الانضمام</p>
              </div>
            </div>
          </div>
        )}

        {/* Deliveries Tab */}
        {activeTab === 'deliveries' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: textPrimary, margin: 0 }}>التوصيلات</h1>
                <p style={{ color: textMuted, marginTop: 4, fontSize: '0.875rem' }}>جميع طلبات التوصيل ومتابعتها</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'all',              label: 'الكل' },
                  { id: 'ready_for_pickup', label: 'جاهز للاستلام' },
                  { id: 'picked_up',        label: 'استلمته' },
                  { id: 'in_transit',       label: 'جاري التوصيل' },
                  { id: 'delivered',        label: 'تم التوصيل' },
                ].map(f => (
                  <button key={f.id} onClick={() => setOrderFilter(f.id)}
                    style={{ padding: '0.4rem 0.9rem', borderRadius: 20, border: `1.5px solid ${orderFilter === f.id ? '#00B0FF' : cardBorder}`, background: orderFilter === f.id ? 'rgba(0,176,255,0.15)' : 'transparent', color: orderFilter === f.id ? '#67e8f9' : textMuted, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredOrders.map(order => {
                const st = getStatusConfig(order.status);
                return (
                  <div key={order.id} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,176,255,0.1)', border: '1px solid rgba(0,176,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Truck style={{ width: 22, height: 22, color: '#67e8f9' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 700, color: textPrimary, margin: 0, fontSize: '0.9rem' }}>{order.customer}</p>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: 20, background: st.bg, color: st.color, fontSize: '0.72rem', fontWeight: 600 }}>{st.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: 4, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin style={{ width: 12, height: 12, color: textMuted }} />
                          <span style={{ fontSize: '0.78rem', color: textMuted }}>{order.to}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock style={{ width: 12, height: 12, color: textMuted }} />
                          <span style={{ fontSize: '0.78rem', color: textMuted }}>{order.date}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <p style={{ fontWeight: 800, color: '#4ade80', margin: 0, fontSize: '1rem' }}>{formatPrice(order.earnings)}</p>
                      <p style={{ color: textMuted, fontSize: '0.72rem', margin: 0 }}>{order.orderId}</p>
                    </div>
                    {order.status === 'ready_for_pickup' && (
                      <button onClick={() => advanceOrderStatus(order.id)} style={{ padding: '0.45rem 0.9rem', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#818cf8)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        استلمت الطلب
                      </button>
                    )}
                    {order.status === 'picked_up' && (
                      <button onClick={() => advanceOrderStatus(order.id)} style={{ padding: '0.45rem 0.9rem', borderRadius: 10, background: 'linear-gradient(135deg,#0284c7,#22d3ee)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        جاري التوصيل
                      </button>
                    )}
                    {order.status === 'in_transit' && (
                      <button onClick={() => advanceOrderStatus(order.id)} style={{ padding: '0.45rem 0.9rem', borderRadius: 10, background: 'linear-gradient(135deg,#16a34a,#4ade80)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        سلّمت للعميل
                      </button>
                    )}
                  </div>
                );
              })}
              {filteredOrders.length === 0 && (
                <div style={{ ...sidebarCard, textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: textMuted }}>لا توجد توصيلات بهذه الحالة</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rates Tab */}
        {activeTab === 'rates' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: textPrimary, margin: 0 }}>أسعار الشحن</h1>
              <p style={{ color: textMuted, marginTop: 4, fontSize: '0.875rem' }}>جدول أسعار الشحن بين المدن (بالدينار الليبي) — اضغط على أي سعر لتعديله</p>
            </div>

            {/* Instruction banner above table */}
            <div style={{ marginBottom: '0.75rem', padding: '0.85rem 1.1rem', borderRadius: 12, background: isLight ? 'rgba(0,112,200,0.06)' : 'rgba(0,176,255,0.08)', border: `1px solid ${isLight ? 'rgba(0,112,200,0.2)' : 'rgba(0,176,255,0.25)'}`, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Zap style={{ width: 17, height: 17, color: '#00B0FF', flexShrink: 0 }} />
              <p style={{ color: isLight ? '#0d3a6e' : '#bae6fd', fontSize: '0.84rem', margin: 0, lineHeight: 1.8 }}>
                النوع محدد على التوصيل للمنزل&nbsp;
                <Home style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'middle', color: '#22c55e' }} />&nbsp;
                تلقائياً لجميع الخانات. لتغيير خانة للمكتب&nbsp;
                <Building2 style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'middle', color: '#f59e0b' }} />&nbsp;
                اضغط على رمز المكتب تحت السعر.
              </p>
            </div>

            {/* Fraud warning above table */}
            <div style={{ marginBottom: '1rem', padding: '0.85rem 1.1rem', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.22)', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <AlertTriangle style={{ width: 17, height: 17, color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
              <p style={{ color: isLight ? '#991b1b' : '#fca5a5', fontSize: '0.82rem', margin: 0, lineHeight: 1.7 }}>
                <strong>تحذير:</strong> الادعاء بالتوصيل للمنزل مع التوصيل الفعلي لمكتب مخالفة صريحة — يتم خصم فرق السعر تلقائياً. <strong>3 مخالفات = تعليق دائم.</strong>
              </p>
            </div>

            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Tajawal, sans-serif' }}>
                  <thead>
                    <tr style={{ background: isLight ? '#f0f7ff' : 'rgba(0,176,255,0.08)' }}>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontSize: '0.82rem', fontWeight: 700, color: textMuted, borderBottom: `1px solid ${cardBorder}` }}>من ↓ \ إلى →</th>
                      {CITIES.map(city => (
                        <th key={city} style={{ padding: '0.85rem 1rem', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700, color: textMuted, borderBottom: `1px solid ${cardBorder}`, whiteSpace: 'nowrap' }}>{city}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CITIES.map((from, ri) => {
                      return (
                      <tr key={from} style={{ background: ri % 2 === 0 ? 'transparent' : (isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)') }}>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 700, color: textPrimary, borderBottom: `1px solid ${cardBorder}`, whiteSpace: 'nowrap' }}>{from}</td>
                        {CITIES.map(to => {
                          const isEditing = editingCell?.from === from && editingCell?.to === to;
                          const isSelf = from === to;
                          const cellKey = `${from}→${to}`;
                          const cellType = cellDeliveryTypes[cellKey] || '';
                          return (
                            <td key={to} style={{ padding: '0.4rem 0.35rem', textAlign: 'center', borderBottom: `1px solid ${cardBorder}`, minWidth: 90 }}>
                              {isSelf ? (
                                <span style={{ fontSize: '0.8rem', color: textMuted }}>—</span>
                              ) : isEditing ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                  <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)}
                                    style={{ width: 52, padding: '0.25rem 0.35rem', borderRadius: 8, border: '1.5px solid #00B0FF', background: isLight ? '#fff' : '#080e1c', color: textPrimary, fontFamily: 'Tajawal, sans-serif', fontSize: '0.8rem', outline: 'none', textAlign: 'center' }}
                                    autoFocus onKeyDown={e => { if (e.key === 'Enter') handleRateSave(); if (e.key === 'Escape') setEditingCell(null); }} />
                                  <button onClick={handleRateSave} style={{ padding: 3, borderRadius: 6, background: 'rgba(22,163,74,0.15)', border: 'none', cursor: 'pointer', color: '#4ade80', display: 'flex' }}><Save style={{ width: 13, height: 13 }} /></button>
                                  <button onClick={() => setEditingCell(null)} style={{ padding: 3, borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', color: '#fca5a5', display: 'flex' }}><X style={{ width: 13, height: 13 }} /></button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                                  {/* Price */}
                                  <button onClick={() => handleRateEdit(from, to)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: 7, background: isLight ? '#f0f7ff' : 'rgba(0,176,255,0.06)', border: `1px solid ${cardBorder}`, cursor: 'pointer', color: textPrimary, fontFamily: 'Tajawal, sans-serif', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#00B0FF'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = cardBorder; }}>
                                    {rates[from]?.[to] ?? '--'}
                                    <Edit3 style={{ width: 10, height: 10, opacity: 0.5 }} />
                                  </button>
                                  {/* Delivery type buttons per cell */}
                                  <div style={{ display: 'flex', gap: '0.15rem' }}>
                                    {(['home', 'office'] as const).map(t => (
                                      <button key={t} onClick={() => saveCellType(from, to, t)}
                                        title={t === 'home' ? 'توصيل للمنزل' : 'توصيل للمكتب'}
                                        style={{ padding: '0.15rem 0.3rem', borderRadius: 5, border: `1.5px solid ${cellType === t ? '#00B0FF' : cardBorder}`, background: cellType === t ? 'rgba(0,176,255,0.15)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                        {t === 'home' ? <Home style={{ width: 10, height: 10, color: cellType === t ? '#67e8f9' : textMuted }} /> : <Building2 style={{ width: 10, height: 10, color: cellType === t ? '#67e8f9' : textMuted }} />}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '0.75rem 1rem', background: isLight ? '#f8fafc' : 'rgba(0,176,255,0.04)', borderTop: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 style={{ width: 14, height: 14, color: textMuted }} />
                <span style={{ fontSize: '0.78rem', color: textMuted }}>اضغط على أي خلية لتعديل السعر. القطري (نفس المدينة) غير قابل للتعديل.</span>
              </div>
            </div>
          </div>
        )}

        {/* User Messages Tab */}
        {activeTab === 'user-messages' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: textPrimary, margin: 0 }}>رسائل المستخدمين</h1>
              <p style={{ color: textMuted, marginTop: 4, fontSize: '0.875rem' }}>الرسائل الواردة من العملاء عبر صفحة شركات التوصيل</p>
            </div>
            {(() => {
              let msgs: any[] = [];
              try { msgs = JSON.parse(localStorage.getItem(`delivery_company_messages_${myDeliveryCompanyId || ''}`) || '[]'); } catch {}
              if (msgs.length === 0) return (
                <div style={{ background: cardBg, borderRadius: 20, padding: '3rem', textAlign: 'center', border: `1px solid ${cardBorder}` }}>
                  <MessageSquare style={{ width: 56, height: 56, color: isLight ? '#e2e8f0' : 'rgba(0,176,255,0.2)', margin: '0 auto 1rem' }} />
                  <p style={{ color: textMuted, fontWeight: 600 }}>لا توجد رسائل بعد</p>
                  <p style={{ color: isLight ? '#cbd5e1' : 'rgba(224,242,254,0.3)', fontSize: '0.85rem' }}>ستظهر هنا رسائل المستخدمين المرسلة من صفحة شركات التوصيل</p>
                </div>
              );
              const singleOrderCustomers = allOrders
                .filter((o: any) => o.deliveryCompanyId === myDeliveryCompanyId && o.status === 'delivered')
                .map((o: any) => o.customerId);
              const masterOrderCustomers = allMasterOrders
                .filter((mo: any) =>
                  mo.subOrders.some((sub: any) =>
                    sub.deliveryCompanyId === myDeliveryCompanyId && sub.status === 'delivered'
                  )
                )
                .map((mo: any) => mo.customerId);
              const customerIds = new Set([...singleOrderCustomers, ...masterOrderCustomers].filter(Boolean));
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 720 }}>
                  {msgs.map((msg: any) => {
                    const isCustomer = customerIds.has(msg.senderId);
                    return (
                      <div key={msg.id} style={{ background: isCustomer ? (isLight ? '#ecfdf5' : 'rgba(34,197,94,0.08)') : cardBg, border: `1px solid ${isCustomer ? (isLight ? '#bbf7d0' : 'rgba(34,197,94,0.2)') : cardBorder}`, borderRadius: 14, padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: textPrimary }}>{msg.senderName || 'مستخدم'}</span>
                          {isCustomer && (
                            <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: 8, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 700, border: '1px solid rgba(34,197,94,0.3)' }}>زبون</span>
                          )}
                          <span style={{ fontSize: '0.7rem', color: textMuted, marginRight: 'auto' }}>{new Date(msg.createdAt).toLocaleDateString('ar-LY', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p style={{ color: textPrimary, fontSize: '0.875rem', margin: 0, lineHeight: 1.7 }}>{msg.text}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: textPrimary, marginBottom: '1.5rem' }}>الأرباح</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'أرباح هذا الشهر', value: formatPrice(4560), color: '#4ade80' },
                { label: 'أرباح هذا الأسبوع', value: formatPrice(980), color: '#60a5fa' },
                { label: 'متوسط ربح التوصيلة', value: formatPrice(22), color: '#fbbf24' },
                { label: 'توصيلات مدفوعة', value: '1,187', color: '#a78bfa' },
              ].map((s, i) => (
                <div key={i} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: '1.25rem' }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
                  <p style={{ color: textMuted, fontSize: '0.82rem', marginTop: 4 }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, color: textPrimary, marginBottom: '1rem', fontSize: '1rem' }}>ملخص الأرباح الأخيرة</h3>
              {mandoubOrders.filter(o => o.status === 'delivered').map(order => (
                <div key={order.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: `1px solid ${cardBorder}` }}>
                  <div>
                    <p style={{ color: textPrimary, fontWeight: 600, margin: 0, fontSize: '0.88rem' }}>{order.customer}</p>
                    <p style={{ color: textMuted, fontSize: '0.75rem', margin: 0 }}>{order.orderId} · {order.date}</p>
                  </div>
                  <span style={{ fontWeight: 800, color: '#4ade80', fontSize: '0.95rem' }}>{formatPrice(order.earnings)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: textPrimary, marginBottom: '1.5rem' }}>الإعدادات</h1>

            {/* Mandatory delivery type */}
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 700, color: textPrimary, margin: 0, fontSize: '1rem' }}>نوع التوصيل</h3>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 20, padding: '0.1rem 0.55rem' }}>إجباري</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <button onClick={() => saveDeliveryType('home')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 1rem', borderRadius: 12, border: `2px solid ${deliveryTypeMode === 'home' ? '#00B0FF' : cardBorder}`, background: deliveryTypeMode === 'home' ? 'rgba(0,176,255,0.12)' : (isLight ? '#f8fafc' : '#080e1c'), cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', transition: 'all 0.15s' }}>
                  <Home style={{ width: 20, height: 20, color: deliveryTypeMode === 'home' ? '#00B0FF' : textMuted, flexShrink: 0 }} />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: deliveryTypeMode === 'home' ? '#00B0FF' : textPrimary }}>توصيل للمنزل</div>
                    <div style={{ fontSize: '0.72rem', color: textMuted }}>Home Delivery</div>
                  </div>
                </button>
                <button onClick={() => saveDeliveryType('office')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 1rem', borderRadius: 12, border: `2px solid ${deliveryTypeMode === 'office' ? '#00B0FF' : cardBorder}`, background: deliveryTypeMode === 'office' ? 'rgba(0,176,255,0.12)' : (isLight ? '#f8fafc' : '#080e1c'), cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', transition: 'all 0.15s' }}>
                  <Building2 style={{ width: 20, height: 20, color: deliveryTypeMode === 'office' ? '#00B0FF' : textMuted, flexShrink: 0 }} />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: deliveryTypeMode === 'office' ? '#00B0FF' : textPrimary }}>من مكتب لمكتب</div>
                    <div style={{ fontSize: '0.72rem', color: textMuted }}>Office-to-Office</div>
                  </div>
                </button>
              </div>
              {deliveryTypeMode === 'office' && (
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: textPrimary, marginBottom: '0.4rem' }}>عنوان مكتب الشركة (يظهر للعملاء)</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input value={officeLocation} onChange={e => setOfficeLocation(e.target.value)}
                      placeholder="مثال: طرابلس، شارع عمر المختار، بجانب البنك الوطني"
                      style={{ flex: 1, padding: '0.65rem 0.9rem', borderRadius: 10, border: `1.5px solid ${cardBorder}`, background: isLight ? '#f8fafc' : '#080e1c', color: textPrimary, fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem', outline: 'none' }}
                      onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                      onBlur={e => (e.target.style.borderColor = cardBorder)} />
                    <button onClick={saveOffice} style={{ padding: '0.65rem 1rem', borderRadius: 10, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>حفظ</button>
                  </div>
                </div>
              )}
              {deliveryTypeMode === 'home' && (
                <div style={{ padding: '0.65rem 0.9rem', borderRadius: 10, background: 'rgba(0,176,255,0.06)', border: `1px solid ${cardBorder}`, fontSize: '0.8rem', color: textMuted, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Home style={{ width: 14, height: 14, color: '#4ade80', flexShrink: 0 }} />
                  سعر التوصيل للمنزل يظهر للعملاء تلقائياً من جدول الأسعار.
                </div>
              )}
            </div>

            {/* Fraud protection & penalties */}
            <div style={{ background: cardBg, border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14, padding: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle style={{ width: 18, height: 18, color: '#ef4444' }} />
                </div>
                <h3 style={{ fontWeight: 700, color: textPrimary, margin: 0, fontSize: '1rem' }}>سياسة الغش والعقوبات</h3>
              </div>
              <div style={{ padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', marginBottom: '1rem' }}>
                <p style={{ color: isLight ? '#991b1b' : '#fca5a5', fontSize: '0.82rem', margin: 0, lineHeight: 1.8 }}>
                  <strong>تحذير هام:</strong> الادعاء بالتوصيل للمنزل مع التوصيل الفعلي لمكتب يُعدّ مخالفة صريحة. سيتم خصم فرق السعر من حسابك تلقائياً، و<strong>3 مخالفات</strong> تؤدي إلى تعليق دائم للحساب.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: 10, background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.04)', border: `1px solid ${cardBorder}`, marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.82rem', color: textPrimary, fontWeight: 600 }}>عدد المخالفات المسجلة</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: violations === 0 ? '#4ade80' : violations < 3 ? '#fbbf24' : '#ef4444' }}>{violations} / 3</span>
              </div>
              {violations < 3 && (
                <button onClick={() => { const v = Math.min(violations + 1, 3); setViolations(v); localStorage.setItem(`delivery_violations_${deliveryId}`, String(v)); if (v === 3) showToastMessage('⚠️ تم تعليق الحساب بسبب 3 مخالفات متكررة', 'error'); else showToastMessage(`تم تسجيل مخالفة جديدة — ${v}/3`, 'error'); }} style={{ fontSize: '0.75rem', color: textMuted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', textDecoration: 'underline' }}>
                  محاكاة تسجيل مخالفة
                </button>
              )}
              {violations >= 3 && (
                <div style={{ padding: '0.65rem 1rem', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.82rem', color: '#fca5a5', fontWeight: 700, textAlign: 'center' }}>
                  ⛔ الحساب موقوف بسبب تجاوز الحد المسموح من المخالفات
                </div>
              )}
            </div>

            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: '1.5rem', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 700, color: textPrimary, marginBottom: '1rem' }}>معلومات الشركة</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                {[
                  { label: 'اسم الشركة', value: companyName },
                  { label: 'نسبة العمولة', value: `${deliveryCompanies[0]?.fee ?? 5}%` },
                  { label: 'مدة التوصيل', value: deliveryCompanies[0]?.estimatedDays ?? '1-3 أيام' },
                  { label: 'المناطق المغطاة', value: 'طرابلس، بنغازي، مصراتة، زليتن، سبها' },
                ].map((f, i) => (
                  <div key={i} style={{ padding: '0.75rem', borderRadius: 10, background: isLight ? '#f8fafc' : 'rgba(0,176,255,0.04)', border: `1px solid ${cardBorder}` }}>
                    <p style={{ fontSize: '0.72rem', color: textMuted, margin: 0 }}>{f.label}</p>
                    <p style={{ fontWeight: 600, color: textPrimary, margin: '0.2rem 0 0', fontSize: '0.88rem' }}>{f.value}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => showToastMessage('سيتم إضافة تعديل الملف الشخصي قريباً', 'info')} style={{ marginTop: '1rem', padding: '0.6rem 1.25rem', borderRadius: 10, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem', fontWeight: 600 }}>
                تعديل المعلومات
              </button>
            </div>

            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, color: textPrimary, marginBottom: '1rem' }}>معلومات التواصل</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', borderRadius: 10, background: isLight ? '#f8fafc' : 'rgba(0,176,255,0.04)', border: `1px solid ${cardBorder}` }}>
                <Phone style={{ width: 18, height: 18, color: '#4ade80', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '0.72rem', color: textMuted, margin: 0 }}>رقم الهاتف</p>
                  <p style={{ fontWeight: 600, color: textPrimary, margin: 0, fontSize: '0.88rem' }}>سيتم الإضافة قريباً</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (() => {
          const matchesDelivery = (f: any) =>
            f.deliveryCompanyId && f.deliveryCompanyId === myDeliveryCompanyId;
          let feedbacks = customerFeedbacks.filter(matchesDelivery);
          // fallback: إذا كانت الحالة فارغة، اقرأ من localStorage مباشرة
          if (feedbacks.length === 0) {
            try {
              const fromStorage = JSON.parse(localStorage.getItem('customerFeedbacks') || '[]');
              feedbacks = fromStorage.filter(matchesDelivery);
            } catch {}
          }
          return (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: textPrimary, margin: 0 }}>تعليقات الزبائن</h1>
                <p style={{ color: textMuted, marginTop: 4 }}>تقييمات العملاء لخدمة التوصيل</p>
              </div>
              {feedbacks.length === 0 ? (
                <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 20, padding: '3rem', textAlign: 'center' }}>
                  <Star style={{ width: 48, height: 48, color: 'rgba(0,176,255,0.2)', margin: '0 auto 1rem' }} />
                  <p style={{ fontWeight: 700, color: textPrimary, marginBottom: '0.4rem' }}>لا توجد تعليقات بعد</p>
                  <p style={{ fontSize: '0.875rem', color: textMuted }}>ستظهر تقييمات التوصيل هنا بعد إتمام الطلبات</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {feedbacks.map((fb: any) => (
                    <div key={fb.id} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: textPrimary }}>{fb.customerName}</div>
                          <div style={{ fontSize: '0.72rem', color: textMuted, marginTop: 2 }}>رقم الطلب: {fb.orderId}</div>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: textMuted }}>{new Date(fb.createdAt).toLocaleDateString('ar-LY', { dateStyle: 'medium' })}</div>
                      </div>
                      <div style={{ background: isLight ? '#f8fcff' : 'rgba(0,176,255,0.05)', borderRadius: 10, padding: '0.75rem' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: textMuted, marginBottom: '0.35rem' }}>تقييم التوصيل</div>
                        <div style={{ fontSize: '1.2rem', color: '#fbbf24', marginBottom: '0.35rem' }}>{'★'.repeat(fb.logisticsRating)}{'☆'.repeat(5 - fb.logisticsRating)}</div>
                        {fb.logisticsComment && <p style={{ fontSize: '0.8rem', color: textPrimary, margin: 0, lineHeight: 1.5 }}>{fb.logisticsComment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {activeTab === 'contact-support' && (() => {
          const supportChatRefreshKey = supportChatRefresh;
          const chatData = getDeliverySupportChat();
          const merchantMsgs: any[] = (() => {
            try { return JSON.parse(localStorage.getItem(`delivery_merchant_messages_${myDeliveryCompanyId || deliveryId}`) || '[]'); } catch { return []; }
          })();
          return (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: textPrimary, margin: 0 }}>تواصل مع الدعم</h1>
                <p style={{ color: textMuted, marginTop: 4 }}>تواصل مع فريق دعم المنصة مباشرة</p>
              </div>
              {/* Merchant Messages */}
              {merchantMsgs.length > 0 && (
                <div style={{ marginBottom: '1.5rem', background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,176,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MessageSquare style={{ width: 18, height: 18, color: '#67e8f9' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: textPrimary }}>رسائل المحلات</div>
                      <div style={{ fontSize: '0.72rem', color: textMuted }}>{merchantMsgs.length} رسالة</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 300, overflowY: 'auto' }}>
                    {merchantMsgs.map((msg: any) => (
                      <div key={msg.id} style={{ padding: '0.65rem 0.9rem', borderRadius: 10, background: msg.from === 'delivery' ? (isLight ? 'rgba(0,112,200,0.08)' : 'rgba(0,176,255,0.12)') : (isLight ? '#f8fafc' : 'rgba(0,176,255,0.05)'), border: `1px solid ${msg.from === 'delivery' ? 'rgba(0,176,255,0.25)' : cardBorder}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: msg.from === 'delivery' ? '#22d3ee' : '#67e8f9' }}>{msg.from === 'delivery' ? (companyName || 'أنت') : (msg.merchantName || 'محل')}</span>
                          <span style={{ fontSize: '0.68rem', color: textMuted }}>{new Date(msg.at).toLocaleDateString('ar-LY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: textPrimary, margin: 0, lineHeight: 1.5 }}>{msg.text}</p>
                      </div>
                    ))}
                  </div>
                  {/* v2.9.1.6: إمكانية الرد على رسائل المحلات */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${cardBorder}` }}>
                    <input
                      type="text"
                      value={deliveryMerchantReply}
                      onChange={e => setDeliveryMerchantReply(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && deliveryMerchantReply.trim()) {
                          const key = `delivery_merchant_messages_${myDeliveryCompanyId || deliveryId}`;
                          const existing = JSON.parse(localStorage.getItem(key) || '[]');
                          existing.push({ id: `dr-${Date.now()}`, from: 'delivery', merchantName: companyName, companyId: myDeliveryCompanyId || deliveryId, text: deliveryMerchantReply.trim(), at: new Date().toISOString() });
                          localStorage.setItem(key, JSON.stringify(existing));
                          setDeliveryMerchantReply('');
                          setSupportChatRefresh((r: number) => r + 1);
                          showToastMessage('تم إرسال ردك', 'success');
                        }
                      }}
                      placeholder="اكتب ردك على المحل..."
                      style={{ flex: 1, padding: '0.6rem 0.85rem', borderRadius: 10, border: `1.5px solid ${cardBorder}`, background: isLight ? '#f8fafc' : '#080e1c', color: textPrimary, fontFamily: 'Tajawal, sans-serif', fontSize: '0.85rem', outline: 'none' }}
                      onFocus={e => (e.target.style.borderColor = '#67e8f9')}
                      onBlur={e => (e.target.style.borderColor = cardBorder)}
                    />
                    <button
                      onClick={() => {
                        if (!deliveryMerchantReply.trim()) return;
                        const key = `delivery_merchant_messages_${myDeliveryCompanyId || deliveryId}`;
                        const existing = JSON.parse(localStorage.getItem(key) || '[]');
                        existing.push({ id: `dr-${Date.now()}`, from: 'delivery', merchantName: companyName, companyId: myDeliveryCompanyId || deliveryId, text: deliveryMerchantReply.trim(), at: new Date().toISOString() });
                        localStorage.setItem(key, JSON.stringify(existing));
                        setDeliveryMerchantReply('');
                        setSupportChatRefresh((r: number) => r + 1);
                        showToastMessage('تم إرسال ردك', 'success');
                      }}
                      style={{ padding: '0.6rem 1rem', borderRadius: 10, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'Tajawal, sans-serif', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      <Send style={{ width: 15, height: 15 }} />
                    </button>
                  </div>
                </div>
              )}
              <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, overflow: 'hidden', maxWidth: 600 }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,176,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Headphones style={{ width: 20, height: 20, color: '#67e8f9' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: textPrimary }}>فريق الدعم الفني</div>
                    <div style={{ fontSize: '0.72rem', color: textMuted }}>CyberVolt e-Mall Support</div>
                  </div>
                </div>
                <div style={{ padding: '0.85rem 1.25rem', minHeight: 200, maxHeight: 350, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {chatData.messages.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, flexDirection: 'column', gap: '0.5rem' }}>
                      <MessageSquare style={{ width: 40, height: 40, color: 'rgba(103,232,249,0.3)' }} />
                      <p style={{ color: textMuted, fontSize: '0.875rem', margin: 0 }}>لا توجد رسائل بعد. ابدأ المحادثة مع الدعم</p>
                    </div>
                  ) : chatData.messages.map((msg: { id: string; from: string; text: string; at: string; name: string }) => (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: msg.from === 'delivery' ? 'flex-start' : 'flex-end' }}>
                      <div style={{ maxWidth: '80%', padding: '0.6rem 0.85rem', borderRadius: 12, background: msg.from === 'delivery' ? 'linear-gradient(135deg,#0070c8,#00B0FF)' : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.07)'), color: msg.from === 'delivery' ? '#fff' : textPrimary, fontSize: '0.875rem', lineHeight: 1.5 }}>
                        <div style={{ fontSize: '0.68rem', opacity: 0.75, marginBottom: '0.2rem' }}>{msg.from === 'delivery' ? companyName : 'فريق الدعم'}</div>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <span style={{ display: 'none' }}>{supportChatRefreshKey}</span>
                </div>
                <div style={{ padding: '0.85rem 1.25rem', borderTop: `1px solid ${cardBorder}`, display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={supportChatMsg}
                    onChange={e => setSupportChatMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendDeliverySupportMsg()}
                    placeholder="اكتب رسالتك لفريق الدعم..."
                    style={{ flex: 1, padding: '0.65rem 0.85rem', borderRadius: 10, border: `1.5px solid ${cardBorder}`, background: isLight ? '#f8fafc' : '#080e1c', color: textPrimary, fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem', outline: 'none' }}
                    onFocus={e => (e.target.style.borderColor = '#67e8f9')}
                    onBlur={e => (e.target.style.borderColor = cardBorder)}
                  />
                  <button onClick={sendDeliverySupportMsg} style={{ padding: '0.65rem 1rem', borderRadius: 10, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'Tajawal, sans-serif', fontSize: '0.85rem', fontWeight: 600 }}>
                    <Send style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </main>

      {showLogoutModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: isLight ? '#fff' : 'linear-gradient(135deg, #020817, #0d1f40)', borderRadius: 20, padding: '2rem', maxWidth: 360, width: '100%', border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.3)'}`, boxShadow: '0 16px 48px rgba(0,0,0,0.4)', textAlign: 'center', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 1rem', background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut style={{ width: 24, height: 24, color: '#ef4444' }} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: isLight ? '#0d3a6e' : '#e0f2fe', marginBottom: '0.5rem' }}>تسجيل الخروج</h3>
            <p style={{ fontSize: '0.875rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.6)', marginBottom: '1.5rem' }}>هل أنت متأكد أنك تريد تسجيل الخروج من بوابة التوصيل؟</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={confirmLogout} style={{ flex: 1, padding: '0.7rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>نعم، خروج</button>
              <button onClick={() => setShowLogoutModal(false)} style={{ flex: 1, padding: '0.7rem', borderRadius: 12, border: `1.5px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.4)'}`, background: isLight ? '#f8fafc' : 'rgba(0,176,255,0.1)', color: isLight ? '#0d3a6e' : '#e0f2fe', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>لا، تراجع</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Accept Order popup */}
      {confirmAcceptId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: isLight ? '#ffffff' : 'linear-gradient(135deg,#020817,#0d1f40)', borderRadius: 20, padding: '2rem', maxWidth: 380, width: '100%', border: `1px solid ${isLight ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.4)'}`, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', textAlign: 'center', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 1.25rem', background: 'rgba(99,102,241,0.15)', border: '1.5px solid rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package style={{ width: 26, height: 26, color: '#818cf8' }} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: isLight ? '#0d3a6e' : '#e0f2fe', marginBottom: '0.5rem' }}>تأكيد استلام الطلب</h3>
            <p style={{ fontSize: '0.875rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.6)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              هل أنت متأكد من استلامك للطلب؟ سيتم تحديث الحالة إلى "في الطريق".
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => { doAdvanceStatus(confirmAcceptId); setConfirmAcceptId(null); }} style={{ flex: 1, padding: '0.7rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#6366f1,#818cf8)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>
                نعم، استلمت الطلب
              </button>
              <button onClick={() => setConfirmAcceptId(null)} style={{ flex: 1, padding: '0.7rem', borderRadius: 12, border: `1.5px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.3)'}`, background: isLight ? '#f8fafc' : 'rgba(0,176,255,0.08)', color: isLight ? '#374151' : '#e0f2fe', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Info Modal */}
      {showDriverModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: isLight ? '#ffffff' : 'linear-gradient(135deg,#020817,#0d1f40)', borderRadius: 20, padding: '2rem', maxWidth: 400, width: '100%', border: `1px solid ${isLight ? 'rgba(0,112,200,0.25)' : 'rgba(6,182,212,0.4)'}`, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', textAlign: 'center', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 1.25rem', background: 'rgba(6,182,212,0.15)', border: '1.5px solid rgba(6,182,212,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck style={{ width: 26, height: 26, color: '#22d3ee' }} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: isLight ? '#0d3a6e' : '#e0f2fe', marginBottom: '0.4rem' }}>بيانات السائق</h3>
            <p style={{ fontSize: '0.82rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.6)', marginBottom: '1.25rem', lineHeight: 1.5 }}>أدخل اسم ورقم هاتف السائق المسؤول عن توصيل هذا الطلب</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', textAlign: 'right' }}>
              <input
                autoFocus
                tabIndex={1}
                value={driverName}
                onChange={e => setDriverName(e.target.value)}
                placeholder="اسم السائق"
                style={{ padding: '0.65rem 0.9rem', borderRadius: 10, border: `1.5px solid ${isLight ? 'rgba(0,112,200,0.25)' : 'rgba(6,182,212,0.35)'}`, background: isLight ? '#f8fcff' : '#080e1c', color: isLight ? '#0d3a6e' : '#e0f2fe', fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem', outline: 'none' }}
                onFocus={e => (e.target.style.borderColor = '#22d3ee')}
                onBlur={e => (e.target.style.borderColor = isLight ? 'rgba(0,112,200,0.25)' : 'rgba(6,182,212,0.35)')}
                onKeyDown={e => { 
                  if (e.key === 'Enter') document.querySelector<HTMLInputElement>('[tabIndex="2"]')?.focus();
                  if (e.key === 'ArrowDown') { e.preventDefault(); document.querySelector<HTMLInputElement>('[tabIndex="2"]')?.focus(); }
                }}
              />
              <input
                tabIndex={2}
                value={driverPhone}
                onChange={e => setDriverPhone(e.target.value)}
                placeholder="رقم هاتف السائق"
                type="tel"
                dir="ltr"
                style={{ padding: '0.65rem 0.9rem', borderRadius: 10, border: `1.5px solid ${isLight ? 'rgba(0,112,200,0.25)' : 'rgba(6,182,212,0.35)'}`, background: isLight ? '#f8fcff' : '#080e1c', color: isLight ? '#0d3a6e' : '#e0f2fe', fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem', outline: 'none', textAlign: 'left' }}
                onFocus={e => (e.target.style.borderColor = '#22d3ee')}
                onBlur={e => (e.target.style.borderColor = isLight ? 'rgba(0,112,200,0.25)' : 'rgba(6,182,212,0.35)')}
                onKeyDown={e => { 
                  if (e.key === 'Enter') doDriverModalConfirm();
                  if (e.key === 'ArrowUp') { e.preventDefault(); document.querySelector<HTMLInputElement>('[tabIndex="1"]')?.focus(); }
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={doDriverModalConfirm} style={{ flex: 1, padding: '0.7rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#0284c7,#22d3ee)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>
                تأكيد جاري التوصيل
              </button>
              <button onClick={() => { setShowDriverModal(false); setDriverModalOrderId(null); }} style={{ flex: 1, padding: '0.7rem', borderRadius: 12, border: `1.5px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.3)'}`, background: isLight ? '#f8fafc' : 'rgba(0,176,255,0.08)', color: isLight ? '#374151' : '#e0f2fe', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delivery popup */}
      {confirmDeliverId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: isLight ? '#ffffff' : 'linear-gradient(135deg,#020817,#0d1f40)', borderRadius: 20, padding: '2rem', maxWidth: 380, width: '100%', border: `1px solid ${isLight ? 'rgba(22,163,74,0.3)' : 'rgba(22,163,74,0.4)'}`, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', textAlign: 'center', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 1.25rem', background: 'rgba(22,163,74,0.12)', border: '1.5px solid rgba(22,163,74,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle style={{ width: 26, height: 26, color: '#4ade80' }} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: isLight ? '#0d3a6e' : '#e0f2fe', marginBottom: '0.5rem' }}>تأكيد التوصيل للعميل</h3>
            <p style={{ fontSize: '0.875rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.6)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              هل أنت متأكد من استلام العميل للطلبية؟ سيتم تسجيل الطلب كمُوصَّل.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => { doAdvanceStatus(confirmDeliverId); setConfirmDeliverId(null); }} style={{ flex: 1, padding: '0.7rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#16a34a,#4ade80)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>
                نعم، استلم العميل الطلب
              </button>
              <button onClick={() => setConfirmDeliverId(null)} style={{ flex: 1, padding: '0.7rem', borderRadius: 12, border: `1.5px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.3)'}`, background: isLight ? '#f8fafc' : 'rgba(0,176,255,0.08)', color: isLight ? '#374151' : '#e0f2fe', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
