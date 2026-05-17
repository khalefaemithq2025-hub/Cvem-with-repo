import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Store, Truck, DollarSign, ShoppingBag,
  Settings, LogOut, CheckCircle,
  ChevronRight, ChevronLeft, Percent, Package, Bell,
  BarChart2, Shield, X, Download, Loader2, Zap, Trash2, Menu,
  Mail, Phone, Clock, Briefcase, Star,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { formatPrice } from '../data/mockData';
import { api } from '../lib/api';
import OrderTimeline from '../components/OrderTimeline';
import SafeImage from '../components/ui/image';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'order' | 'merchant' | 'product' | 'system';
  read: boolean;
  createdAt: Date;
}

const MOCK_NOTIF_POOL: Omit<Notification, 'id' | 'read' | 'createdAt'>[] = [
  { type: 'order',    title: 'طلب جديد!',               body: 'سيُحسب رقم الطلب ديناميكياً' },
  { type: 'merchant', title: 'تاجر جديد ينتظر المراجعة', body: 'تم تسجيل محل إلكترونيات جديد' },
  { type: 'product',  title: 'منتج جديد للمراجعة',       body: 'Samsung Galaxy S24 — محل الأمين للإلكترونيات' },
  { type: 'system',   title: 'تحديث النظام v2.4',        body: 'تم نشر تحديث CyberVolt e-Mall بنجاح' },
  { type: 'order',    title: 'طلب جديد!',               body: 'سيُحسب رقم الطلب ديناميكياً' },
  { type: 'product',  title: 'منتج اعتُمد',              body: 'iPhone 15 Pro — تم اعتماده وأصبح نشطاً' },
  { type: 'merchant', title: 'تاجر جديد ينتظر المراجعة', body: 'محل طرابلس للحواسيب يطلب الانضمام' },
];

export default function OwnerDashboard() {
  const { showToastMessage, setUser, customerFeedbacks } = useStore();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const loggingOut = React.useRef(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState({ totalMerchants: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0, platformEarnings: 0, deliveryEarnings: 0, activeMerchants: 0, pendingMerchants: 0 });
  const [merchants, setMerchants] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [bankAccount, setBankAccount] = useState({ bankName: '', accountNumber: '', accountHolder: '', iban: '' });
  const [pendingMerchantApps, setPendingMerchantApps] = useState<any[]>([]);
  const [pendingDeliveryApps, setPendingDeliveryApps] = useState<any[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [deletingDemo, setDeletingDemo] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [bellRinging, setBellRinging] = useState(false);
  const [mockNotifIdx, setMockNotifIdx] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [supportJobApps, setSupportJobApps] = useState<any[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadData = () => {
    api.getOwnerStats().then(setStats).catch(() => {});
    api.getMerchants().then(setMerchants).catch(() => {});
    api.getOwnerOrders().then(setOrders).catch(() => {});
    api.getPendingProducts().then(setPendingProducts).catch(() => {});
    api.getProducts().then(setProducts).catch(() => {});
    try {
      setPendingMerchantApps(JSON.parse(localStorage.getItem('pending_merchant_applications') || '[]'));
      setPendingDeliveryApps(JSON.parse(localStorage.getItem('pending_delivery_applications') || '[]'));
      setSupportJobApps(JSON.parse(localStorage.getItem('support_job_applications') || '[]'));
    } catch {}

    try {
      const changeLog = JSON.parse(localStorage.getItem('owner_delivery_change_log') || '[]');
      const unreadChanges = changeLog.filter((entry: any) => !entry.read);
      for (const entry of unreadChanges) {
        const notif: Notification = {
          id: `dc-${entry.id}`,
          type: 'merchant',
          title: `${entry.merchantName} غيّر شركة التوصيل`,
          body: entry.reason
            ? `إلى: ${entry.companyName} — السبب: ${entry.reason}`
            : `إلى: ${entry.companyName} — لم يُذكر سبب`,
          read: false,
          createdAt: new Date(entry.at),
        };
        setNotifications(prev => {
          if (prev.some(n => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });
        // وضع علامة مقروء حتى لا يتكرر
        entry.read = true;
      }
      if (unreadChanges.length > 0) {
        localStorage.setItem('owner_delivery_change_log', JSON.stringify(changeLog));
      }
    } catch {}
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  const simulateNotif = () => {
    const base = MOCK_NOTIF_POOL[mockNotifIdx % MOCK_NOTIF_POOL.length];
    setMockNotifIdx((i) => i + 1);
    const isOrder = base.type === 'order';
    const notif: Notification = {
      id: `notif-${Date.now()}`,
      type: base.type,
      title: base.title,
      body: isOrder
        ? `رقم ORD-${Math.floor(Math.random() * 9000 + 1000)} — قيمة ${Math.floor(Math.random() * 800 + 150)} د.ل`
        : base.body,
      read: false,
      createdAt: new Date(),
    };
    setNotifications((prev) => [notif, ...prev]);
    setBellRinging(true);
    setTimeout(() => setBellRinging(false), 900);
    showToastMessage(`إشعار جديد: ${notif.title}`, 'info');
  };

  const handleDownloadSource = async () => {
    setDownloading(true);
    try {
      const a = document.createElement('a');
      a.href = '/cvem-v2.9.1.4.zip';
      a.download = 'cvem-v2.9.1.4.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToastMessage('جارٍ تنزيل cvem-v2.9.1.4.zip ...', 'success');
    } catch {
      showToastMessage('فشل تنزيل الملف', 'error');
    } finally {
      setTimeout(() => setDownloading(false), 3000);
    }
  };

  const handleDeleteDemoData = async () => {
    if (!window.confirm('هل أنت متأكد من حذف جميع البيانات التجريبية؟ لا يمكن التراجع.')) return;
    setDeletingDemo(true);
    try {
      await api.deleteDemoData();
      showToastMessage('تم حذف البيانات التجريبية بنجاح', 'success');
      loadData();
    } catch {
      showToastMessage('حدث خطأ أثناء الحذف', 'error');
    } finally {
      setDeletingDemo(false);
    }
  };

  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = () => {
    loggingOut.current = true;
    localStorage.setItem('logging_out', '1');
    setShowLogoutModal(false);
    navigate('/', { replace: true });
    localStorage.removeItem('token');
    setUser(null);
    showToastMessage('تم تسجيل الخروج', 'info');
    setTimeout(() => localStorage.removeItem('logging_out'), 1000);
  };
  const handleVerifyMerchant = async (id: string, verified: boolean) => {
    try { await api.updateMerchant(id, { isVerified: verified }); setMerchants((prev) => prev.map((m) => m.id === id ? { ...m, isVerified: verified } : m)); showToastMessage(verified ? 'تم توثيق المحل' : 'تم رفض توثيق المحل', verified ? 'success' : 'info'); } catch { showToastMessage('حدث خطأ', 'error'); }
  };
  const handleApproveProduct = async (id: string) => {
    try { await api.updateProduct(id, { isPending: false }); setPendingProducts((prev) => prev.filter((p) => p.id !== id)); showToastMessage('تم اعتماد المنتج ✓', 'success'); } catch { showToastMessage('حدث خطأ', 'error'); }
  };
  const handleRejectProduct = async (id: string) => {
    try { await api.deleteProduct(id); setPendingProducts((prev) => prev.filter((p) => p.id !== id)); showToastMessage('تم رفض المنتج وحذفه', 'info'); } catch { showToastMessage('حدث خطأ', 'error'); }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending:   { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'معلق' },
      confirmed: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'تم التأكيد' },
      preparing: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'قيد التحضير' },
      shipped:   { bg: 'bg-purple-100', text: 'text-purple-700', label: 'تم الشحن' },
      delivered: { bg: 'bg-green-100',  text: 'text-green-700',  label: 'تم التوصيل' },
      cancelled: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'ملغي' },
    };
    const badge = badges[status] || badges.pending;
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>{badge.label}</span>;
  };

  const [feedbackBadge, setFeedbackBadge] = React.useState<number>(() => {
    try {
      const fbs = JSON.parse(localStorage.getItem('customerFeedbacks') || '[]');
      const lastSeen = parseInt(localStorage.getItem('last_seen_feedback_owner') || '0');
      return Math.max(0, fbs.length - lastSeen);
    } catch { return 0; }
  });
  React.useEffect(() => {
    const lastSeen = parseInt(localStorage.getItem('last_seen_feedback_owner') || '0');
    const total = customerFeedbacks.length;
    setFeedbackBadge(Math.max(0, total - lastSeen));
  }, [customerFeedbacks]);
  React.useEffect(() => {
    if (activeTab === 'feedback') {
      const total = customerFeedbacks.length;
      localStorage.setItem('last_seen_feedback_owner', String(total));
      setFeedbackBadge(0);
    }
  }, [activeTab, customerFeedbacks]);

  const menuItems = [
    { id: 'dashboard',           label: 'لوحة التحكم',         icon: LayoutDashboard },
    { id: 'merchants',           label: 'المحلات',              icon: Store },
    { id: 'products',            label: 'المنتجات',             icon: ShoppingBag },
    { id: 'pending',             label: 'طلبات الإضافة',        icon: Package },
    { id: 'orders',              label: 'الطلبات',              icon: ShoppingBag },
    { id: 'delivery',            label: 'شركات التوصيل',        icon: Truck },
    { id: 'applications',        label: 'طلبات الانضمام',       icon: Percent },
    { id: 'recruitment',         label: 'إدارة طلبات التوظيف', icon: Briefcase },
    { id: 'earnings',            label: 'الأرباح',              icon: DollarSign },
    { id: 'analytics',           label: 'التحليلات',            icon: BarChart2 },
    { id: 'merchant-management', label: 'إدارة التجار',         icon: Users },
    { id: 'feedback',            label: 'تعليقات الزبائن',      icon: Star, badge: feedbackBadge },
    { id: 'settings',            label: 'الإعدادات',            icon: Settings },
  ];

  const notifTypeColors: Record<Notification['type'], string> = {
    order:    'bg-green-100 text-green-700',
    merchant: 'bg-blue-100 text-blue-700',
    product:  'bg-yellow-100 text-yellow-700',
    system:   'bg-purple-100 text-purple-700',
  };

  const notifTypeLabels: Record<Notification['type'], string> = {
    order: 'طلب', merchant: 'تاجر', product: 'منتج', system: 'نظام',
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const logoutModal = showLogoutModal && (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{
        background: isLight ? '#fff' : 'linear-gradient(135deg, #020817, #0d1f40)',
        borderRadius: 20, padding: '2rem', maxWidth: 380, width: '100%',
        border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.3)'}`,
        boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
        textAlign: 'center', fontFamily: 'Tajawal, sans-serif', direction: 'rtl',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: '0 auto 1.25rem',
          background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LogOut style={{ width: 26, height: 26, color: '#ef4444' }} />
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: isLight ? '#0d3a6e' : '#e0f2fe', marginBottom: '0.5rem' }}>تسجيل الخروج</h3>
        <p style={{ fontSize: '0.9rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.6)', marginBottom: '1.75rem' }}>
          هل أنت متأكد أنك تريد تسجيل الخروج من لوحة التحكم؟
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={confirmLogout} style={{
            flex: 1, padding: '0.75rem', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff', fontWeight: 700, fontSize: '0.95rem',
            fontFamily: 'Tajawal, sans-serif', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(239,68,68,0.35)',
          }}>نعم، خروج</button>
          <button onClick={() => setShowLogoutModal(false)} style={{
            flex: 1, padding: '0.75rem', borderRadius: 12,
            border: `1.5px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.4)'}`,
            background: isLight ? '#f8fafc' : 'rgba(0,176,255,0.1)',
            color: isLight ? '#0d3a6e' : '#e0f2fe', fontWeight: 700, fontSize: '0.95rem',
            fontFamily: 'Tajawal, sans-serif', cursor: 'pointer',
          }}>لا، تراجع</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
    {logoutModal}
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row" dir="rtl">

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 flex-shrink-0 bg-slate-950 border-b border-cyan-400/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-400/15 flex items-center justify-center border border-cyan-300/20">
            <Zap className="w-5 h-5 text-cyan-300" />
          </div>
          <span className="font-bold text-sm text-cyan-100">لوحة المالك</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(p => !p)} className="bg-cyan-400/12 border border-cyan-400/25 rounded-lg p-2 flex items-center justify-center">
          {isMobileMenuOpen ? <X className="w-5 h-5 text-cyan-300" /> : <Menu className="w-5 h-5 text-cyan-300" />}
        </button>
      </div>

      {/* Mobile Dropdown Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden flex-shrink-0 bg-slate-950 border-b border-cyan-400/15 px-3 py-2 flex flex-col gap-1">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold font-[Tajawal,sans-serif] text-right transition-colors ${activeTab === item.id ? 'bg-cyan-400/15 text-cyan-100 border border-cyan-300/25' : 'text-cyan-100/65 hover:bg-white/8'}`}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {item.id === 'pending' && pendingProducts.length > 0 && <span className="mr-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{pendingProducts.length}</span>}
            </button>
          ))}
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold font-[Tajawal,sans-serif] text-right text-red-400 hover:bg-red-400/10">
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      )}

      {/* Sidebar (Desktop) */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} hidden md:flex flex-col bg-slate-950 border-l border-cyan-400/15 transition-all duration-300 flex-shrink-0 relative z-20`}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-400/15 flex items-center justify-center border border-cyan-300/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                <Zap className="w-6 h-6 text-cyan-300" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg tracking-tight text-white">CyberVolt</span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-400/70">Admin Panel</span>
              </div>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-cyan-400">
            {isSidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                activeTab === item.id
                  ? 'bg-cyan-400/15 text-cyan-100 border border-cyan-300/25'
                  : 'text-cyan-100/60 hover:bg-white/5 hover:text-cyan-200'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform duration-200 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              {isSidebarOpen && <span className="font-bold text-sm font-[Tajawal,sans-serif]">{item.label}</span>}
              {item.badge && item.badge > 0 && (
                <span className={`absolute ${isSidebarOpen ? 'left-4' : 'left-2'} top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-slate-950`}>
                  {item.badge}
                </span>
              )}
              {!isSidebarOpen && (
                <div className="absolute right-full mr-4 px-3 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-white/10 shadow-xl">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all duration-200 group">
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {isSidebarOpen && <span className="font-bold text-sm font-[Tajawal,sans-serif]">تسجيل الخروج</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-slate-900 font-[Tajawal,sans-serif]">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
            <div className="h-6 w-px bg-gray-200 mx-2" />
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Clock size={16} />
              <span>{new Date().toLocaleDateString('ar-LY', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className={`p-3 rounded-xl bg-gray-50 text-slate-600 hover:bg-gray-100 hover:text-slate-900 transition-all relative group ${bellRinging ? 'animate-bounce' : ''}`}
              >
                <Bell size={22} className="group-hover:rotate-12 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 left-2.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Panel */}
              {showNotifPanel && (
                <div className="absolute left-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-bold text-slate-900">الإشعارات</span>
                    <button onClick={markAllRead} className="text-xs font-bold text-blue-600 hover:text-blue-700">تحديد الكل كمقروء</button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400 font-medium">لا توجد إشعارات جديدة</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} onClick={() => markRead(n.id)} className={`p-4 border-b border-gray-50 hover:bg-slate-50 transition-colors cursor-pointer relative ${!n.read ? 'bg-blue-50/30' : ''}`}>
                          {!n.read && <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                          <div className="flex gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${notifTypeColors[n.type]}`}>
                              {notifTypeLabels[n.type]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-slate-900 mb-0.5 truncate">{n.title}</div>
                              <div className="text-xs text-slate-500 leading-relaxed line-clamp-2">{n.body}</div>
                              <div className="text-[10px] text-slate-400 mt-2 font-medium">{new Date(n.createdAt).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 text-center">
                    <button onClick={simulateNotif} className="text-xs font-bold text-slate-500 hover:text-slate-700">محاكاة إشعار جديد (للتجربة)</button>
                  </div>
                </div>
              )}
            </div>

            <div className="h-10 w-px bg-gray-200" />

            <div className="flex items-center gap-3 pl-2">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-900">أدمن النظام</span>
                <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider">Owner</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                <Shield size={22} />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {/* Dashboard Stats */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                      <DollarSign size={24} />
                    </div>
                    <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">+12.5%</span>
                  </div>
                  <div className="text-slate-500 text-sm font-bold mb-1">إجمالي الإيرادات</div>
                  <div className="text-2xl font-black text-slate-900">{formatPrice(stats.totalRevenue)}</div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors duration-300">
                      <Zap size={24} />
                    </div>
                    <span className="text-xs font-bold text-cyan-500 bg-cyan-50 px-2 py-1 rounded-lg">منصة</span>
                  </div>
                  <div className="text-slate-500 text-sm font-bold mb-1">أرباح المنصة</div>
                  <div className="text-2xl font-black text-slate-900">{formatPrice(stats.platformEarnings)}</div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                      <Store size={24} />
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{stats.pendingMerchants} معلق</span>
                  </div>
                  <div className="text-slate-500 text-sm font-bold mb-1">المحلات النشطة</div>
                  <div className="text-2xl font-black text-slate-900">{stats.activeMerchants}</div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                      <ShoppingBag size={24} />
                    </div>
                    <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">مكتملة</span>
                  </div>
                  <div className="text-slate-500 text-sm font-bold mb-1">إجمالي الطلبات</div>
                  <div className="text-2xl font-black text-slate-900">{stats.totalOrders}</div>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="font-black text-slate-900">آخر الطلبات</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    عرض الكل <ChevronLeft size={16} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">رقم الطلب</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">العميل</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">القيمة</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">الحالة</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{order.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.customerName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{formatPrice(order.total || order.grandTotal)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString('ar-LY')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Other tabs content... */}
          {activeTab === 'merchants' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="font-black text-slate-900">إدارة المحلات ({merchants.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">المحل</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">المالك</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">الفئة</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">الحالة</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {merchants.map((merchant) => (
                        <tr key={merchant.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden border border-gray-200">
                                <SafeImage src={merchant.image} alt={merchant.name} className="w-full h-full object-cover" />
                              </div>
                              <span className="text-sm font-bold text-slate-900">{merchant.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{merchant.ownerName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{merchant.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {merchant.isVerified ? (
                              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">موثق ✓</span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">قيد المراجعة</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleVerifyMerchant(merchant.id, !merchant.isVerified)}
                              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${merchant.isVerified ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                            >
                              {merchant.isVerified ? 'إلغاء التوثيق' : 'توثيق المحل'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Pending Products Tab */}
          {activeTab === 'pending' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingProducts.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                    <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-400">لا توجد منتجات بانتظار المراجعة</h3>
                  </div>
                ) : (
                  pendingProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                      <div className="h-48 bg-gray-50 relative overflow-hidden">
                        <SafeImage src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur shadow-sm rounded-full text-[10px] font-bold text-slate-900 border border-white/20">
                          {product.category}
                        </div>
                      </div>
                      <div className="p-6">
                        <h4 className="font-bold text-slate-900 mb-1">{product.name}</h4>
                        <div className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                          <Store size={12} /> {product.merchantName || 'محل تجاري'}
                        </div>
                        <div className="flex items-center justify-between mb-6">
                          <span className="text-lg font-black text-blue-600">{formatPrice(product.price)}</span>
                          <span className="text-xs font-bold text-slate-400">الكمية: {product.stock || 0}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => handleApproveProduct(product.id)} className="flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-colors shadow-lg shadow-green-100">
                            <CheckCircle size={16} /> اعتماد
                          </button>
                          <button onClick={() => handleRejectProduct(product.id)} className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors">
                            <X size={16} /> رفض
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Analytics/Earnings/Settings... Placeholders */}
          {['orders', 'delivery', 'applications', 'recruitment', 'earnings', 'analytics', 'merchant-management', 'feedback', 'settings'].includes(activeTab) && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 py-20 text-center bg-white rounded-3xl border border-gray-100">
              <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-6">
                {React.createElement(menuItems.find(i => i.id === activeTab)?.icon || LayoutDashboard, { size: 40 })}
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">قسم {menuItems.find(i => i.id === activeTab)?.label}</h3>
              <p className="text-slate-500 font-medium mb-8">هذا القسم قيد التطوير وسيتم توفير البيانات قريباً</p>
              
              {activeTab === 'settings' && (
                <div className="max-w-md mx-auto space-y-4">
                  <button onClick={handleDownloadSource} disabled={downloading} className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 shadow-xl shadow-slate-200">
                    {downloading ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                    تحميل نسخة السورس كود (v2.9.2)
                  </button>
                  <button onClick={handleDeleteDemoData} disabled={deletingDemo} className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-bold hover:bg-red-100 transition-all disabled:opacity-50">
                    {deletingDemo ? <Loader2 className="animate-spin" /> : <Trash2 size={20} />}
                    تصفير جميع البيانات التجريبية
                  </button>
                </div>
              )}

              {activeTab === 'feedback' && (
                <div className="max-w-4xl mx-auto px-4">
                  {customerFeedbacks.length === 0 ? (
                    <p className="text-slate-400">لا توجد تقييمات من الزبائن بعد</p>
                  ) : (
                    <div className="grid gap-4 text-right">
                      {customerFeedbacks.map((fb) => (
                        <div key={fb.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                {fb.customerName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{fb.customerName}</div>
                                <div className="text-[10px] text-slate-400">{new Date(fb.createdAt).toLocaleDateString('ar-LY')}</div>
                              </div>
                            </div>
                            <div className="flex gap-4">
                              <div className="text-center">
                                <div className="text-[10px] font-bold text-slate-400 mb-1">المحل</div>
                                <div className="flex items-center gap-1 text-amber-500 font-bold">
                                  <Star size={14} fill="currentColor" /> {fb.storeRating}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-[10px] font-bold text-slate-400 mb-1">التوصيل</div>
                                <div className="flex items-center gap-1 text-cyan-500 font-bold">
                                  <Star size={14} fill="currentColor" /> {fb.logisticsRating}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {fb.storeComment && (
                              <div className="text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                                <span className="font-bold text-slate-400 ml-2">رأي المحل:</span>
                                {fb.storeComment}
                              </div>
                            )}
                            {fb.logisticsComment && (
                              <div className="text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                                <span className="font-bold text-slate-400 ml-2">رأي التوصيل:</span>
                                {fb.logisticsComment}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
    </>
  );
}
