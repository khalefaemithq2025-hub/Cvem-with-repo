import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Plus, Bell,
  DollarSign, Users, Trash2, Store, CheckCircle,
  Smartphone, Laptop, Headphones, Upload, X, Menu, Send,
  Image as ImageIcon, Info, Zap, MessageSquare, User as UserIcon, Clock, Truck,
  Megaphone, TrendingUp, Star,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { formatPrice, deliveryCompanies, MERCHANT_DELIVERY_MAP } from '../data/mockData';
import { api } from '../lib/api';
import OrderTimeline from '../components/OrderTimeline';
import SafeImage from '../components/ui/image';



function DeliveryCompanyCard({ company, isAssigned, isLight, merchantId, storeName, onAssign, showToastMessage, orders }: {
  company: any; isAssigned: boolean; isLight: boolean; merchantId: string; storeName: string;
  onAssign: (id: string, name: string) => void; showToastMessage: (msg: string, type: string, duration?: number) => void;
  orders: any[];
}) {
  const [msgText, setMsgText] = React.useState('');
  const [showMsg, setShowMsg] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [showRatesModal, setShowRatesModal] = React.useState(false);
  const [changeReason, setChangeReason] = React.useState('');
  const cardBgLocal = isLight ? '#fff' : '#0d1526';
  const borderLocal = isLight ? '#e5e7eb' : 'rgba(0,176,255,0.12)';
  const textPrimaryLocal = isLight ? '#0d2a4a' : '#e0f2fe';
  const textMutedLocal = isLight ? '#6b7280' : 'rgba(224,242,254,0.5)';

  const hasActiveOrders = orders.some(
    (o: any) =>
      o.merchantId === merchantId &&
      o.status !== 'delivered' &&
      o.status !== 'cancelled'
  );

  const handleConfirmChange = () => {
    // حفظ السبب في localStorage ليقرأه المالك
    if (changeReason.trim()) {
      try {
        const key = 'owner_delivery_change_log';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.unshift({
          id: `dclog-${Date.now()}`,
          merchantId,
          merchantName: storeName,
          companyId: company.id,
          companyName: company.name,
          reason: changeReason.trim(),
          at: new Date().toISOString(),
          read: false,
        });
        localStorage.setItem(key, JSON.stringify(existing));
      } catch {}
    }
    onAssign(company.id, company.name);
    setShowConfirmModal(false);
    setChangeReason('');
  };

  const sendMsg = (msg: string) => {
    if (!msg.trim()) return;
    // ── منع المراسلة لشركة غير مخصصة ──────────────────────────────
    if (!isAssigned) {
      showToastMessage('يمكنك مراسلة شركة التوصيل المخصصة لمتجرك فقط', 'error', 3000);
      return;
    }
    try {
      const key = `delivery_merchant_messages_${company.id}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift({ id: `m-${Date.now()}`, from: 'merchant', merchantId, merchantName: storeName, companyId: company.id, text: msg, at: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(existing));
      showToastMessage(`تم إرسال رسالتك إلى ${company.name}`, 'success');
    } catch {}
  };

  return (
    <div style={{ background: cardBgLocal, border: `2px solid ${isAssigned ? '#0070c8' : borderLocal}`, borderRadius: 16, padding: '1.25rem', transition: 'all 0.2s', boxShadow: isAssigned ? '0 0 0 3px rgba(0,112,200,0.12)' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: isLight ? 'rgba(0,112,200,0.1)' : 'rgba(0,176,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Truck style={{ width: 22, height: 22, color: '#0070c8' }} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: textPrimaryLocal }}>{company.name}</div>
          {isAssigned && <span style={{ fontSize: '0.68rem', background: 'rgba(0,112,200,0.1)', color: '#0070c8', borderRadius: 20, padding: '0.1rem 0.5rem', fontWeight: 700 }}>محدد حالياً</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        <div style={{ background: isLight ? '#f0f7ff' : 'rgba(0,176,255,0.07)', borderRadius: 10, padding: '0.45rem 0.85rem', flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: '0.68rem', color: textMutedLocal, marginBottom: 4 }}>رسوم التوصيل</div>
          <button
            onClick={() => setShowRatesModal(true)}
            style={{
              width: '100%', padding: '0.3rem 0.5rem', borderRadius: 7, border: 'none',
              background: isLight ? 'rgba(0,112,200,0.1)' : 'rgba(0,176,255,0.15)',
              color: isLight ? '#0070c8' : '#67e8f9',
              fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: '0.72rem',
              cursor: 'pointer', lineHeight: 1.4, textAlign: 'center',
            }}
          >
            اضغط لرؤية<br/>جدول الأسعار
          </button>
        </div>

        <div style={{ background: isLight ? '#f0fdf4' : 'rgba(22,163,74,0.07)', borderRadius: 10, padding: '0.45rem 0.85rem', flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: '0.68rem', color: textMutedLocal, marginBottom: 2 }}>مدة التوصيل</div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#16a34a' }}>{company.days ?? company.deliveryDays ?? '--'} يوم</div>
        </div>
      </div>
      {company.description && (
        <p style={{ fontSize: '0.8rem', color: textMutedLocal, marginBottom: '0.85rem', lineHeight: 1.5 }}>{company.description}</p>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: showMsg ? '0.75rem' : 0 }}>
        <button
          onClick={() => {
            if (hasActiveOrders) {
              showToastMessage('لا يمكن تغيير شركة التوصيل — يوجد طلبات نشطة لم تُسلَّم بعد', 'error', 5000);
              return;
            }
            if (isAssigned) return;
            setShowConfirmModal(true);
          }}
          style={{
            flex: 1, padding: '0.6rem', borderRadius: 10, border: 'none',
            background: isAssigned
              ? 'rgba(0,112,200,0.1)'
              : hasActiveOrders
                ? 'rgba(156,163,175,0.3)'
                : 'linear-gradient(135deg,#0070c8,#00B0FF)',
            color: isAssigned ? '#0070c8' : hasActiveOrders ? '#9ca3af' : '#fff',
            fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: '0.85rem',
            cursor: isAssigned || hasActiveOrders ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
          disabled={isAssigned}
        >
          {isAssigned ? '✓ محدد كشركتك' : hasActiveOrders ? '🔒 يوجد طلبات نشطة' : 'تحديد'}
        </button>
        <button
          onClick={() => {
            if (!isAssigned) {
              showToastMessage('يمكنك مراسلة شركة التوصيل المخصصة لمتجرك فقط', 'error', 3000);
              return;
            }
            setShowMsg(!showMsg);
          }}
          style={{
            padding: '0.6rem 0.85rem', borderRadius: 10,
            border: `1.5px solid ${isLight ? 'rgba(0,112,200,0.25)' : 'rgba(0,176,255,0.25)'}`,
            background: isAssigned
              ? (isLight ? 'rgba(0,112,200,0.07)' : 'rgba(0,176,255,0.07)')
              : (isLight ? 'rgba(156,163,175,0.1)' : 'rgba(255,255,255,0.04)'),
            color: isAssigned
              ? (isLight ? '#0070c8' : '#67e8f9')
              : (isLight ? '#9ca3af' : 'rgba(255,255,255,0.4)'),
            fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: '0.85rem',
            cursor: isAssigned ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            opacity: isAssigned ? 1 : 0.6,
          }}
        >
          <MessageSquare style={{ width: 15, height: 15 }} />
          مراسلة
        </button>
      </div>
      {showMsg && (
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
          <input
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && msgText.trim()) { sendMsg(msgText); setMsgText(''); setShowMsg(false); } }}
            placeholder={`أرسل رسالة إلى ${company.name}...`}
            style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: 9, border: `1.5px solid ${isLight ? '#dbeafe' : 'rgba(0,176,255,0.2)'}`, background: isLight ? '#f8fafc' : '#080e1c', color: isLight ? '#0d3a6e' : '#e0f2fe', fontFamily: 'Tajawal, sans-serif', fontSize: '0.85rem', outline: 'none' }}
            onFocus={e => (e.target.style.borderColor = '#00B0FF')}
            onBlur={e => (e.target.style.borderColor = isLight ? '#dbeafe' : 'rgba(0,176,255,0.2)')}
          />
          <button onClick={() => { sendMsg(msgText); setMsgText(''); setShowMsg(false); }} style={{ padding: '0.55rem 0.75rem', borderRadius: 9, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Send style={{ width: 15, height: 15 }} />
          </button>
        </div>
      )}

      {showConfirmModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', fontFamily: 'Tajawal, sans-serif',
        }}>
          <div style={{
            background: isLight ? '#fff' : '#0d1526',
            border: `1px solid ${isLight ? '#dbeafe' : 'rgba(0,176,255,0.2)'}`,
            borderRadius: 20, padding: '1.75rem', maxWidth: 420, width: '100%',
            boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: isLight ? '#0d3a6e' : '#e0f2fe', marginBottom: '0.5rem' }}>
              تأكيد تغيير شركة التوصيل
            </div>
            <div style={{ fontSize: '0.85rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.6)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              هل أنت متأكد من تغيير شركة التوصيل إلى <strong style={{ color: isLight ? '#0070c8' : '#67e8f9' }}>{company.name}</strong>؟
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: isLight ? '#374151' : 'rgba(224,242,254,0.7)', display: 'block', marginBottom: '0.4rem' }}>
                سبب التغيير (اختياري — سيُرسل للمالك)
              </label>
              <textarea
                value={changeReason}
                onChange={e => setChangeReason(e.target.value)}
                placeholder="اكتب السبب هنا..."
                rows={3}
                style={{
                  width: '100%', borderRadius: 10, padding: '0.65rem 0.85rem',
                  border: `1.5px solid ${isLight ? '#dbeafe' : 'rgba(0,176,255,0.2)'}`,
                  background: isLight ? '#f8fafc' : '#080e1c',
                  color: isLight ? '#0d3a6e' : '#e0f2fe',
                  fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem',
                  resize: 'none', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleConfirmChange}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: 11, border: 'none',
                  background: 'linear-gradient(135deg,#0070c8,#00B0FF)',
                  color: '#fff', fontFamily: 'Tajawal, sans-serif',
                  fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                }}
              >
                تأكيد التغيير
              </button>
              <button
                onClick={() => { setShowConfirmModal(false); setChangeReason(''); }}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: 11,
                  border: `1.5px solid ${isLight ? '#e5e7eb' : 'rgba(255,255,255,0.1)'}`,
                  background: 'transparent',
                  color: isLight ? '#6b7280' : 'rgba(224,242,254,0.6)',
                  fontFamily: 'Tajawal, sans-serif', fontWeight: 700,
                  fontSize: '0.9rem', cursor: 'pointer',
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
      {showRatesModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', fontFamily: 'Tajawal, sans-serif',
        }}>
          <div style={{
            background: isLight ? '#fff' : '#0d1526',
            border: `1px solid ${isLight ? '#dbeafe' : 'rgba(0,176,255,0.2)'}`,
            borderRadius: 20, padding: '1.5rem', maxWidth: 520, width: '100%',
            boxShadow: '0 8px 40px rgba(0,0,0,0.35)', maxHeight: '85vh', overflowY: 'auto',
          }}>
            {/* العنوان */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: isLight ? '#0d3a6e' : '#e0f2fe' }}>
                🚚 جدول أسعار توصيل — {company.name}
              </div>
              <button
                onClick={() => setShowRatesModal(false)}
                style={{ padding: '0.3rem', borderRadius: 8, border: 'none', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)', color: isLight ? '#6b7280' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                ✕
              </button>
            </div>
            {/* الجدول الديناميكي */}
            {(() => {
              const cities = company.coveredCities || [];
              const rates = company.rates || {};
              if (cities.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '2rem', color: isLight ? '#6b7280' : '#94a3b8', fontSize: '0.9rem' }}>
                    لا توجد بيانات مدن متوفرة لهذه الشركة حالياً
                  </div>
                );
              }
              return (
                <div style={{ overflowX: 'auto', borderRadius: 12, border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.12)'}` }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Tajawal, sans-serif', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: isLight ? '#f0f7ff' : 'rgba(0,176,255,0.08)' }}>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 700, color: isLight ? '#374151' : '#94a3b8', borderBottom: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.12)'}`, whiteSpace: 'nowrap' }}>
                          من ↓ \ إلى →
                        </th>
                        {cities.map((city: string) => (
                          <th key={city} style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 700, color: isLight ? '#374151' : '#94a3b8', borderBottom: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.12)'}`, whiteSpace: 'nowrap' }}>
                            {city}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cities.map((from: string, ri: number) => (
                        <tr key={from} style={{ background: ri % 2 === 0 ? 'transparent' : (isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)') }}>
                          <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700, color: isLight ? '#1e293b' : '#e0f2fe', borderBottom: `1px solid ${isLight ? '#f3f4f6' : 'rgba(255,255,255,0.04)'}`, whiteSpace: 'nowrap' }}>
                            {from}
                          </td>
                          {cities.map((to: string) => (
                            <td key={`${from}-${to}`} style={{ padding: '0.55rem 0.75rem', textAlign: 'center', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.7)', borderBottom: `1px solid ${isLight ? '#f3f4f6' : 'rgba(255,255,255,0.04)'}`, fontWeight: 600 }}>
                              {rates[from]?.[to] != null ? `${rates[from][to]} د.ل` : '--'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
            {/* عدد المدن المغطاة */}
            <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: isLight ? '#6b7280' : '#94a3b8', textAlign: 'center' }}>
              تغطي {company.coveredCities?.length || 0} مدينة
            </div>
            {/* زر الإغلاق */}
            <button
              onClick={() => setShowRatesModal(false)}
              style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

type Category = 'phones' | 'laptops' | 'accessories' | '';

interface ColorVariant {
  color: string;
  qty: string;
}

interface ProductForm {
  category: Category;
  price: string;
  imageFile: File | null;
  imagePreview: string;
  description: string;
  name: string;
  brand: string;
  stock: string;
  processor: string;
  battery: string;
  screen: string;
  cameras: string;
  phoneColors: ColorVariant[];
  laptopProcessor: string;
  generation: string;
  laptopScreen: string;
  gpu: string;
}

const OWNER_EMAIL = 'khalefaemithq2019@gmail.com';

function AddProductModal({
  onClose,
  merchantId,
  storeName,
  onSuccess,
}: {
  onClose: () => void;
  merchantId: string;
  storeName: string;
  onSuccess: () => void;
}) {
  const { showToastMessage } = useStore();
  const [form, setForm] = useState<ProductForm>({
    category: '', price: '', imageFile: null, imagePreview: '',
    description: '', name: '', brand: '', stock: '',
    processor: '', battery: '', screen: '', cameras: '',
    phoneColors: [{ color: '', qty: '' }],
    laptopProcessor: '', generation: '', laptopScreen: '', gpu: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(f => ({ ...f, imageFile: file, imagePreview: URL.createObjectURL(file) }));
  };

  const addColorVariant = () => {
    setForm(f => ({ ...f, phoneColors: [...f.phoneColors, { color: '', qty: '' }] }));
  };

  const removeColorVariant = (idx: number) => {
    setForm(f => ({ ...f, phoneColors: f.phoneColors.filter((_, i) => i !== idx) }));
  };

  const updateColorVariant = (idx: number, field: 'color' | 'qty', value: string) => {
    setForm(f => ({
      ...f,
      phoneColors: f.phoneColors.map((cv, i) => i === idx ? { ...cv, [field]: value } : cv),
    }));
  };

  const handleSubmit = async () => {
    if (!form.category) { showToastMessage('يرجى اختيار نوع البضاعة', 'error'); return; }
    if (!form.name.trim()) { showToastMessage('يرجى إدخال اسم السلعة', 'error'); return; }
    if (!form.price || isNaN(parseFloat(form.price))) { showToastMessage('يرجى إدخال سعر صحيح', 'error'); return; }
    const token = localStorage.getItem('token');
    if (!token) { showToastMessage('يجب تسجيل الدخول أولاً', 'error'); return; }

    setIsLoading(true);
    try {
      const specs: Record<string, string> = {};
      let colorVariants: Array<{ color: string; qty: number }> = [];

      if (form.category === 'phones') {
        if (form.processor) specs['المعالج'] = form.processor;
        if (form.battery) specs['البطارية'] = form.battery;
        if (form.screen) specs['الشاشة'] = form.screen;
        if (form.cameras) specs['الكاميرات'] = form.cameras;
        colorVariants = form.phoneColors
          .filter(cv => cv.color.trim())
          .map(cv => ({ color: cv.color.trim(), qty: parseInt(cv.qty) || 0 }));
      } else if (form.category === 'laptops') {
        if (form.laptopProcessor) specs['المعالج'] = form.laptopProcessor;
        if (form.generation) specs['الجيل'] = form.generation;
        if (form.laptopScreen) specs['الشاشة'] = form.laptopScreen;
        if (form.gpu) specs['كرت الشاشة'] = form.gpu;
      }

      await api.createProduct({
        name: form.name,
        description: form.description,
        category: form.category,
        brand: form.brand,
        images: form.imagePreview ? [form.imagePreview] : [],
        specifications: specs,
        merchantId,
        merchantName: storeName,
        price: parseFloat(form.price),
        stock: form.category === 'phones' && colorVariants.length > 0
          ? colorVariants.reduce((s, cv) => s + cv.qty, 0)
          : parseInt(form.stock) || 0,
        colorVariants,
      });
      setSubmitted(true);
      onSuccess();
    } catch (err: any) {
      showToastMessage(err.message || 'حدث خطأ أثناء إضافة المنتج', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl animate-fade-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-primary mb-3">تم إضافة السلعة!</h2>
        {!form.imageFile && (
          <div className="text-sm bg-blue-50 rounded-xl p-3 mb-4 text-blue-700">
            📸 سيصلك طلب تحميل صورة السلعة على:<br />
            <strong>{OWNER_EMAIL}</strong>
          </div>
        )}
        <p className="text-muted mb-6">سلعتك قيد المراجعة وستظهر في المنصة قريباً.</p>
        <button onClick={onClose} className="btn-primary w-full">العودة للوحة التحكم</button>
      </div>
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.85rem', borderRadius: 10,
    border: '1.5px solid #e2e8f0', outline: 'none',
    fontFamily: 'Tajawal, sans-serif', fontSize: '0.9rem',
    background: '#f8fafc', color: '#1e293b', boxSizing: 'border-box',
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="flex min-h-full items-start justify-center p-4 sm:items-center sm:p-6">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl my-4 animate-fade-in">

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#f0f6ff' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,176,255,0.1)' }}>
                <Plus className="w-5 h-5" style={{ color: '#00B0FF' }} />
              </div>
              <div>
                <h2 className="font-bold text-lg" style={{ color: '#0d3a6e' }}>إضافة سلعة جديدة</h2>
                <p className="text-xs" style={{ color: '#64748b' }}>{storeName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              style={{ color: '#94a3b8' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>

            {/* ① Category */}
            <div>
              <label className="block text-sm font-bold mb-3" style={{ color: '#0d3a6e' }}>
                ① نوع البضاعة <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'phones', label: 'هواتف', icon: Smartphone },
                  { id: 'laptops', label: 'حواسيب', icon: Laptop },
                  { id: 'accessories', label: 'إكسسوارات', icon: Headphones },
                ].map(opt => (
                  <button
                    key={opt.id} type="button"
                    onClick={() => setForm(f => ({ ...f, category: opt.id as Category }))}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                      padding: '0.85rem 0.5rem', borderRadius: 14,
                      border: `2px solid ${form.category === opt.id ? '#00B0FF' : '#e2e8f0'}`,
                      background: form.category === opt.id ? 'rgba(0,176,255,0.06)' : '#fff',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: form.category === opt.id ? '#00B0FF' : '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <opt.icon style={{ width: 20, height: 20, color: form.category === opt.id ? '#fff' : '#94a3b8' }} />
                    </div>
                    <span style={{
                      fontSize: '0.82rem', fontWeight: 700,
                      color: form.category === opt.id ? '#0070c8' : '#475569',
                    }}>
                      {opt.label}
                    </span>
                    {form.category === opt.id && (
                      <CheckCircle style={{ width: 14, height: 14, color: '#00B0FF' }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ② Name */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#0d3a6e' }}>
                ② اسم السلعة <span className="text-red-500">*</span>
              </label>
              <input
                type="text" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={inputStyle}
                placeholder="اسم المنتج"
                onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>

            {/* ③ Brand */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#0d3a6e' }}>③ الماركة</label>
              <input
                type="text" value={form.brand}
                onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                style={inputStyle}
                placeholder="Apple, Samsung, Huawei..."
                onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>

            {/* ④ Price */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#0d3a6e' }}>
                ④ سعر السلعة <span className="text-red-500">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  style={{ ...inputStyle, paddingLeft: '3rem' }}
                  placeholder="0" dir="ltr"
                  onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                  onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                />
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  fontSize: '0.85rem', fontWeight: 700, color: '#64748b',
                }}>د.ل</span>
              </div>
            </div>

            {/* ⑤ Image */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#0d3a6e' }}>
                ⑤ صورة السلعة <span style={{ color: '#94a3b8', fontWeight: 400 }}>(اختياري)</span>
              </label>
              <div style={{
                border: `2px dashed ${form.imagePreview ? '#00B0FF' : '#e2e8f0'}`,
                borderRadius: 14,
                background: form.imagePreview ? 'rgba(0,176,255,0.03)' : '#fafafa',
                transition: 'all 0.15s',
              }}>
                {form.imagePreview ? (
                  <div style={{ position: 'relative', padding: '0.75rem' }}>
                    <SafeImage src={form.imagePreview} alt="preview" style={{ height: 140, width: '100%', objectFit: 'contain', borderRadius: 10 }} />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, imageFile: null, imagePreview: '' }))}
                      style={{
                        position: 'absolute', top: 12, left: 12,
                        width: 28, height: 28, background: '#ef4444', color: '#fff',
                        borderRadius: '50%', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                ) : (
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.5rem', cursor: 'pointer' }}>
                    <div style={{ width: 48, height: 48, background: '#f1f5f9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon style={{ width: 24, height: 24, color: '#94a3b8' }} />
                    </div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', margin: 0 }}>اضغط لرفع صورة</p>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>JPG, PNG حتى 10MB</p>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
                  </label>
                )}
              </div>
              {!form.imageFile && (
                <p style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Info style={{ width: 12, height: 12 }} />
                  إن لم ترفع صورة، سيصلك طلب تحميلها على: {OWNER_EMAIL}
                </p>
              )}
            </div>

            {/* ⑥ Specs (category-specific) */}
            {form.category && (
              <div style={{ background: '#f8fafc', borderRadius: 14, padding: '1.25rem', border: '1px solid #f1f5f9' }}>
                <label className="block text-sm font-bold mb-4" style={{ color: '#0d3a6e' }}>⑥ المواصفات التفصيلية</label>

                {/* Description */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>الوصف العام</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={2}
                    style={{ ...inputStyle, resize: 'none' }}
                    placeholder="وصف عام للمنتج..."
                    onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                    onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                  />
                </div>

                {form.category === 'phones' && (
                  <div className="space-y-3">
                    {[
                      { key: 'processor', label: 'المعالج', ph: 'مثال: Snapdragon 8 Gen 2' },
                      { key: 'battery', label: 'البطارية', ph: 'مثال: 5000 mAh' },
                      { key: 'screen', label: 'الشاشة', ph: 'مثال: 6.7 بوصة AMOLED' },
                      { key: 'cameras', label: 'الكاميرات', ph: 'مثال: 50MP + 12MP' },
                    ].map(f => (
                      <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <label style={{ width: 80, fontSize: '0.8rem', fontWeight: 600, color: '#64748b', flexShrink: 0 }}>{f.label}</label>
                        <input
                          type="text"
                          value={(form as any)[f.key]}
                          onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                          style={{ ...inputStyle, flex: 1 }}
                          placeholder={f.ph}
                          onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                          onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                        />
                      </div>
                    ))}

                    {/* ⑦ Phone Colors */}
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0d3a6e' }}>
                          ⑦ الألوان المتاحة والكميات
                        </label>
                        <button
                          type="button"
                          onClick={addColorVariant}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.35rem 0.85rem', borderRadius: 8,
                            background: '#2563eb', color: '#fff',
                            border: 'none', cursor: 'pointer',
                            fontSize: '0.78rem', fontWeight: 700,
                            fontFamily: 'Tajawal, sans-serif',
                          }}
                        >
                          <Plus style={{ width: 13, height: 13 }} />
                          إضافة لون
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {/* Column headers */}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <div style={{ flex: 1, fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>اللون</div>
                          <div style={{ width: 100, fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', flexShrink: 0 }}>الكمية</div>
                          <div style={{ width: 28, flexShrink: 0 }} />
                        </div>

                        {form.phoneColors.map((cv, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={cv.color}
                              onChange={e => updateColorVariant(idx, 'color', e.target.value)}
                              style={{ ...inputStyle, flex: 1 }}
                              placeholder="مثال: أسود، أبيض، أزرق..."
                              onFocus={e => (e.target.style.borderColor = '#2563eb')}
                              onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                            />
                            <input
                              type="number"
                              value={cv.qty}
                              onChange={e => updateColorVariant(idx, 'qty', e.target.value)}
                              style={{ ...inputStyle, width: 100, flexShrink: 0, textAlign: 'center' }}
                              placeholder="0"
                              min="0"
                              onFocus={e => (e.target.style.borderColor = '#2563eb')}
                              onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                            />
                            <button
                              type="button"
                              onClick={() => removeColorVariant(idx)}
                              disabled={form.phoneColors.length === 1}
                              style={{
                                width: 28, height: 28, borderRadius: 7,
                                background: form.phoneColors.length === 1 ? '#f1f5f9' : '#fee2e2',
                                color: form.phoneColors.length === 1 ? '#cbd5e1' : '#ef4444',
                                border: 'none', cursor: form.phoneColors.length === 1 ? 'default' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, transition: 'all 0.15s',
                              }}
                            >
                              <X style={{ width: 13, height: 13 }} />
                            </button>
                          </div>
                        ))}

                        {form.phoneColors.some(cv => cv.color && cv.qty) && (
                          <div style={{
                            marginTop: '0.25rem', padding: '0.5rem 0.75rem',
                            background: '#f0fdf4', border: '1px solid #bbf7d0',
                            borderRadius: 8, fontSize: '0.78rem', color: '#15803d',
                          }}>
                            إجمالي المخزون:{' '}
                            <strong>
                              {form.phoneColors.reduce((s, cv) => s + (parseInt(cv.qty) || 0), 0)} وحدة
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {form.category === 'laptops' && (
                  <div className="space-y-3">
                    {[
                      { key: 'laptopProcessor', label: 'المعالج', ph: 'مثال: Intel Core i7' },
                      { key: 'generation', label: 'الجيل', ph: 'مثال: الجيل الثالث عشر' },
                      { key: 'laptopScreen', label: 'الشاشة', ph: 'مثال: 15.6 بوصة FHD' },
                      { key: 'gpu', label: 'كرت الشاشة', ph: 'مثال: NVIDIA RTX 4060' },
                    ].map(f => (
                      <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <label style={{ width: 80, fontSize: '0.8rem', fontWeight: 600, color: '#64748b', flexShrink: 0 }}>{f.label}</label>
                        <input
                          type="text"
                          value={(form as any)[f.key]}
                          onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                          style={{ ...inputStyle, flex: 1 }}
                          placeholder={f.ph}
                          onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                          onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                        />
                      </div>
                    ))}

                    {/* Stock for laptops */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <label style={{ width: 80, fontSize: '0.8rem', fontWeight: 600, color: '#64748b', flexShrink: 0 }}>الكمية</label>
                      <input
                        type="number"
                        value={form.stock}
                        onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder="عدد الوحدات المتاحة"
                        min="0"
                        onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                        onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                      />
                    </div>
                  </div>
                )}

                {form.category === 'accessories' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label style={{ width: 80, fontSize: '0.8rem', fontWeight: 600, color: '#64748b', flexShrink: 0 }}>الكمية</label>
                    <input
                      type="number"
                      value={form.stock}
                      onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder="عدد الوحدات المتاحة"
                      min="0"
                      onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                      onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              style={{
                width: '100%', padding: '0.9rem',
                background: isLoading ? '#93c5fd' : 'linear-gradient(135deg, #0070c8, #00B0FF)',
                color: '#fff', borderRadius: 14, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '1rem', fontWeight: 700, fontFamily: 'Tajawal, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: isLoading ? 'none' : '0 4px 16px rgba(0,112,200,0.25)',
                transition: 'all 0.15s',
              }}
            >
              {isLoading
                ? <span style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                : <><Plus style={{ width: 20, height: 20 }} /><span>إضافة السلعة</span></>
              }
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function getTokenPayload(): Record<string, any> | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return JSON.parse(atob(token));
  } catch { return null; }
}

const AD_PLANS: { key: '3' | '7' | '14'; label: string; basePrice: number; desc: string; color: string }[] = [
  { key: '3',  label: '3 أيام',  basePrice: 30,  desc: 'مناسب للعروض القصيرة',     color: '#0070c8' },
  { key: '7',  label: '7 أيام',  basePrice: 60,  desc: 'الأكثر طلباً — أسبوع كامل', color: '#7c3aed' },
  { key: '14', label: '14 يوم', basePrice: 100, desc: 'أقصى انتشار وأفضل قيمة',   color: '#16a34a' },
];

function calcAdPrice(basePrice: number, reach: number): number {
  // Base price at 5000 reach; scales proportionally above that
  const extra = Math.max(0, reach - 5000);
  const extraCost = Math.floor(extra / 5000) * Math.round(basePrice * 0.1);
  return basePrice + extraCost;
}

function AdvertiseTab({ isLight, myProducts, merchantId, showToastMessage }: {
  isLight: boolean; myProducts: any[]; merchantId: string;
  showToastMessage: (msg: string, type: string) => void;
}) {
  const [adProduct, setAdProduct] = React.useState('');
  const [adReach, setAdReach] = React.useState(5000);
  const [adDuration, setAdDuration] = React.useState<'3' | '7' | '14'>('7');
  const [adSubmitted, setAdSubmitted] = React.useState(false);

  const selectedPlan = AD_PLANS.find(p => p.key === adDuration)!;
  const finalPrice = calcAdPrice(selectedPlan.basePrice, adReach);
  const cardBg = isLight ? '#fff' : '#0d1526';
  const border = isLight ? '#e5e7eb' : 'rgba(0,176,255,0.12)';
  const textPrimary = isLight ? '#0d3a6e' : '#e0f2fe';
  const textMuted = isLight ? '#64748b' : 'rgba(224,242,254,0.55)';

  if (adSubmitted) return (
    <div className="animate-fade-in" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ background: cardBg, borderRadius: 24, padding: '3rem', textAlign: 'center', border: `1px solid ${border}` }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #0070c8, #00B0FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 8px 24px rgba(0,112,200,0.3)' }}>
          <CheckCircle style={{ width: 36, height: 36, color: '#fff' }} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: textPrimary, margin: '0 0 0.5rem' }}>تم إرسال طلب الإعلان!</h2>
        <p style={{ color: textMuted, margin: '0 0 1.5rem', fontSize: '0.9rem' }}>سيتم مراجعته وتفعيله خلال 24 ساعة</p>
        <button onClick={() => { setAdSubmitted(false); setAdProduct(''); setAdReach(5000); setAdDuration('7'); }}
          style={{ padding: '0.65rem 1.75rem', borderRadius: 12, background: 'rgba(0,112,200,0.1)', border: '1.5px solid rgba(0,112,200,0.3)', color: '#0070c8', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>
          إنشاء إعلان جديد
        </button>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: textPrimary, margin: '0 0 0.25rem' }}>إعلان منتج</h1>
        <p style={{ color: textMuted, margin: 0, fontSize: '0.875rem' }}>روّج لمنتجاتك وزد مبيعاتك داخل المنصة</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Product selector */}
        <div style={{ background: cardBg, borderRadius: 20, padding: '1.5rem', border: `1px solid ${border}` }}>
          <h3 style={{ fontWeight: 800, fontSize: '1rem', color: textPrimary, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package style={{ width: 18, height: 18, color: '#0070c8' }} /> اختر المنتج
          </h3>
          <select value={adProduct} onChange={e => setAdProduct(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 12, border: `1.5px solid ${isLight ? '#dbeafe' : 'rgba(0,176,255,0.2)'}`, background: isLight ? '#f8fafc' : '#080e1c', color: textPrimary, fontFamily: 'Tajawal, sans-serif', fontSize: '0.9rem', outline: 'none' }}>
            <option value="">— اختر منتجاً —</option>
            {myProducts.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} — {p.price?.toLocaleString()} د.ل</option>
            ))}
            {myProducts.length === 0 && <option disabled>لا توجد منتجات — أضف منتجاً أولاً</option>}
          </select>
        </div>

        {/* Reach slider — informational only */}
        <div style={{ background: cardBg, borderRadius: 20, padding: '1.5rem', border: `1px solid ${border}` }}>
          <h3 style={{ fontWeight: 800, fontSize: '1rem', color: textPrimary, margin: '0 0 0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp style={{ width: 18, height: 18, color: '#7c3aed' }} /> التقدير التقريبي للوصول
          </h3>
          <p style={{ color: textMuted, fontSize: '0.8rem', margin: '0 0 1rem' }}>للمعلومات فقط — السعر ثابت بغض النظر عن الوصول</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: textMuted }}>1,000</span>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#7c3aed' }}>{adReach.toLocaleString()} مستخدم</span>
            <span style={{ fontSize: '0.82rem', color: textMuted }}>50,000</span>
          </div>
          <input type="range" min={1000} max={50000} step={1000} value={adReach} onChange={e => setAdReach(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#7c3aed', cursor: 'pointer' }} />
          <div style={{ marginTop: '0.75rem', padding: '0.65rem 1rem', borderRadius: 10, background: isLight ? '#f5f3ff' : 'rgba(124,58,237,0.1)', border: `1px solid ${isLight ? '#c4b5fd' : 'rgba(124,58,237,0.2)'}` }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: isLight ? '#6d28d9' : '#c4b5fd' }}>سيصل إعلانك لما يقارب <strong>{adReach.toLocaleString()}</strong> مستخدم نشط على المنصة خلال فترة الإعلان</p>
          </div>
        </div>

        {/* Duration plans */}
        <div style={{ background: cardBg, borderRadius: 20, padding: '1.5rem', border: `1px solid ${border}` }}>
          <h3 style={{ fontWeight: 800, fontSize: '1rem', color: textPrimary, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star style={{ width: 18, height: 18, color: '#d97706' }} /> اختر مدة الإعلان
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {AD_PLANS.map(plan => (
              <button key={plan.key} onClick={() => setAdDuration(plan.key)}
                style={{
                  padding: '1rem 0.75rem', borderRadius: 14,
                  border: `2px solid ${adDuration === plan.key ? plan.color : (isLight ? '#e5e7eb' : 'rgba(255,255,255,0.08)')}`,
                  background: adDuration === plan.key ? `${plan.color}18` : (isLight ? '#f8fafc' : '#080e1c'),
                  cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', textAlign: 'center',
                  boxShadow: adDuration === plan.key ? `0 0 0 3px ${plan.color}22` : 'none',
                  transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: adDuration === plan.key ? plan.color : textPrimary, marginBottom: '0.25rem' }}>{plan.label}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: adDuration === plan.key ? plan.color : textPrimary }}>{plan.basePrice}+ د.ل</div>
                <div style={{ fontSize: '0.68rem', color: textMuted, marginTop: '0.25rem' }}>{plan.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Summary & submit */}
        <div style={{ background: `linear-gradient(135deg, ${selectedPlan.color}18 0%, ${selectedPlan.color}08 100%)`, borderRadius: 20, padding: '1.5rem', border: `2px solid ${selectedPlan.color}40` }}>
          <h3 style={{ fontWeight: 800, fontSize: '1rem', color: textPrimary, margin: '0 0 0.75rem' }}>ملخص الإعلان</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {[
              { label: 'المنتج', value: adProduct ? (myProducts.find((p:any) => p.id === adProduct)?.name || adProduct) : 'لم يُحدد' },
              { label: 'المدة', value: `${selectedPlan.label} — ${selectedPlan.desc}` },
              { label: 'الوصول المتوقع', value: `${adReach.toLocaleString()} مستخدم` },
              { label: 'السعر الأساسي', value: `${selectedPlan.basePrice} د.ل` },
              { label: 'إضافة الوصول', value: `${finalPrice - selectedPlan.basePrice} د.ل` },
              { label: 'الإجمالي', value: `${finalPrice} د.ل` },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: textMuted }}>{row.label}:</span>
                <span style={{ fontWeight: 700, color: textPrimary }}>{row.value}</span>
              </div>
            ))}
          </div>
          <button
            disabled={!adProduct}
            onClick={() => {
              if (!adProduct) { showToastMessage('يرجى اختيار منتج أولاً', 'error'); return; }
              try {
                const ads = JSON.parse(localStorage.getItem('merchant_ads') || '[]');
                ads.unshift({ id: `ad-${Date.now()}`, merchantId, productId: adProduct, product: myProducts.find((p:any) => p.id === adProduct)?.name, duration: adDuration, price: finalPrice, reach: adReach, status: 'pending', createdAt: new Date().toISOString() });
                localStorage.setItem('merchant_ads', JSON.stringify(ads));
              } catch {}
              setAdSubmitted(true);
              showToastMessage('تم إرسال طلب الإعلان بنجاح!', 'success');
            }}
            style={{
              width: '100%', padding: '0.875rem', borderRadius: 14,
              background: adProduct ? `linear-gradient(135deg, ${selectedPlan.color}, ${selectedPlan.color}cc)` : (isLight ? '#d1d5db' : '#2a3548'),
              color: adProduct ? '#fff' : (isLight ? '#9ca3af' : 'rgba(224,242,254,0.3)'),
              border: 'none', cursor: adProduct ? 'pointer' : 'not-allowed',
              fontFamily: 'Tajawal, sans-serif', fontWeight: 800, fontSize: '1rem',
              boxShadow: adProduct ? `0 6px 20px ${selectedPlan.color}40` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              transition: 'all 0.15s',
            }}>
            <Megaphone style={{ width: 20, height: 20 }} />
            <span>تأكيد الإعلان · {finalPrice} د.ل</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MerchantDashboard() {
  const { showToastMessage, user, setUser, merchantNotifications, pushMerchantNotification, orders: allOrders, masterOrders: allMasterOrders, updateOrderStatus, updateSubOrderStatus, customerFeedbacks } = useStore();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('welcome');
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, pendingOrders: 0, productCount: 0 });
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [merchantInfo, setMerchantInfo] = useState<any>(null);

  const tokenPayload = getTokenPayload();
  const merchantId = String(user?.merchantId ?? tokenPayload?.merchantId ?? '');
  const storeName = merchantInfo?.storeName || user?.name || tokenPayload?.name || 'متجري';

  // SubOrders from MasterOrders that belong to this merchant ONLY
  // لا نستخدم allOrders لأنه يحتوي على MasterOrder كامل بجميع متاجره
  const merchantSubOrders = React.useMemo(() => {
    if (!merchantId) return [];
    const result: any[] = [];
    for (const mo of allMasterOrders) {
      for (const sub of mo.subOrders) {
        if (sub.merchantId === merchantId) {
          result.push({
            ...sub,
            masterOrderId: mo.id,
            customerId: mo.customerId,
            customerName: mo.customerName,
            shippingAddress: mo.shippingAddress,
            createdAt: mo.createdAt,
            updatedAt: mo.updatedAt,
            isSubOrder: true,
          });
        }
      }
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allMasterOrders, merchantId]);

  // mergedOrders = SubOrders فقط (مفلترة بدقة لهذا المتجر وحده)
  const mergedOrders = React.useMemo(() => {
    return merchantSubOrders;
  }, [merchantSubOrders]);

  const [confirmStatusChange, setConfirmStatusChange] = React.useState<{ orderId: string; targetStatus: string; actionLabel: string } | null>(null);

  const loggingOut = React.useRef(false);

  useEffect(() => {
    if (loggingOut.current || localStorage.getItem('logging_out') === '1') return;
    const token = localStorage.getItem('token');
    if (!token) { navigate('/store-portal/login'); return; }
    if (user && user.role !== 'merchant') { navigate('/store-portal/login'); }
  }, [user, navigate]);

  const refreshProducts = () => {
    if (merchantId) {
      api.getProducts({ merchantId }).then(setMyProducts).catch(() => {});
      api.getMerchantStats(merchantId).then(setStats).catch(() => {});
    }
  };

  useEffect(() => {
    if (!merchantId) return;
    api.getMerchantStats(merchantId).then(setStats).catch(() => {});
    api.getProducts({ merchantId }).then(setMyProducts).catch(() => {});
    api.getMerchantOrders(merchantId).then(setMyOrders).catch(() => {});
    api.getMerchant(merchantId).then(setMerchantInfo).catch(() => {});
  }, [merchantId]);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [supportChatMsg, setSupportChatMsg] = useState('');
  const [threadReplies, setThreadReplies] = useState<Record<string, string>>({});
  const [msgRefresh, setMsgRefresh] = useState(0);
  const [assignedDeliveryCompanyId, setAssignedDeliveryCompanyId] = useState<string>(() => {
    const mId = String(((() => { try { const t = localStorage.getItem('token'); return t ? JSON.parse(atob(t)) : null; } catch { return null; } })())?.merchantId ?? '');
    try { const saved = JSON.parse(localStorage.getItem(`delivery_rates_${mId}`) || 'null'); if (saved?.companyId) return saved.companyId; } catch {}
    return MERCHANT_DELIVERY_MAP[mId] || '';
  });

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

  const getMerchantSupportChat = () => {
    try {
      const key = `merchant_support_chat_${merchantId}`;
      return JSON.parse(localStorage.getItem(key) || 'null') || { merchantId, merchantName: storeName, messages: [], lastAt: new Date().toISOString() };
    } catch { return { merchantId, merchantName: storeName, messages: [], lastAt: new Date().toISOString() }; }
  };

  const sendMerchantSupportMsg = () => {
    const text = supportChatMsg.trim();
    if (!text || !merchantId) return;
    const key = `merchant_support_chat_${merchantId}`;
    const data = getMerchantSupportChat();
    data.merchantName = storeName;
    data.messages.push({ id: `msg-${Date.now()}`, from: 'merchant', text, at: new Date().toISOString(), name: storeName });
    data.lastAt = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(data));
    setSupportChatMsg('');
    showToastMessage('تم إرسال رسالتك لفريق الدعم', 'success');
  };

  const sendCustomerReply = (threadId: string, customerId: string) => {
    const text = (threadReplies[threadId] || '').trim();
    if (!text || !merchantId) return;
    const key = `customer_merchant_chat_${merchantId}`;
    let threads: any[] = [];
    try { threads = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
    const thread = threads.find((t: any) => t.id === threadId);
    if (!thread) return;
    thread.messages.push({ id: `msg-${Date.now()}`, from: 'merchant', text, at: new Date().toISOString(), name: storeName });
    thread.lastAt = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(threads));
    try {
      const sent: any[] = JSON.parse(localStorage.getItem('customer_sent_messages') || '[]');
      const idx = sent.findIndex((m: any) => m.customerId === customerId && m.merchantId === merchantId);
      if (idx !== -1) { sent[idx].reply = text; localStorage.setItem('customer_sent_messages', JSON.stringify(sent)); }
    } catch {}
    setThreadReplies(prev => ({ ...prev, [threadId]: '' }));
    setMsgRefresh(r => r + 1);
    showToastMessage('تم إرسال الرد للعميل', 'success');
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('هل تريد حذف هذا المنتج؟')) return;
    try {
      await api.deleteProduct(id);
      setMyProducts(prev => prev.filter(p => p.id !== id));
      showToastMessage('تم حذف المنتج', 'info');
    } catch { showToastMessage('حدث خطأ', 'error'); }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending:           { bg: 'bg-yellow-100', text: 'text-yellow-700',  label: 'معلق' },
      confirmed:         { bg: 'bg-blue-100',   text: 'text-blue-700',    label: 'مؤكد' },
      preparing:         { bg: 'bg-orange-100', text: 'text-orange-700',  label: 'قيد التحضير' },
      ready:             { bg: 'bg-cyan-100',   text: 'text-cyan-700',    label: 'جاهز' },
      ready_for_pickup:  { bg: 'bg-indigo-100', text: 'text-indigo-700',  label: 'جاهز للاستلام' },
      picked_up:         { bg: 'bg-purple-100', text: 'text-purple-700',  label: 'استلمه المندوب' },
      shipped:           { bg: 'bg-violet-100', text: 'text-violet-700',  label: 'في الشحن' },
      delivered:         { bg: 'bg-green-100',  text: 'text-green-700',   label: 'تم التوصيل' },
      cancelled:         { bg: 'bg-red-100',    text: 'text-red-700',     label: 'ملغي' },
    };
    const badge = badges[status] || badges.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>{badge.label}</span>;
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [unreadMsgCount, setUnreadMsgCount] = React.useState(0);
  React.useEffect(() => {
    const calc = () => {
      let count = 0;
      try {
        const threads: any[] = JSON.parse(localStorage.getItem(`customer_merchant_chat_${merchantId}`) || '[]');
        threads.forEach((t: any) => {
          const msgs: any[] = t.messages || [];
          const lastSeen = Number(localStorage.getItem(`merchant_msg_seen_${t.id}`) || 0);
          const unread = msgs.filter((m: any) => m.from !== 'merchant' && new Date(m.at).getTime() > lastSeen).length;
          count += unread;
        });
      } catch {}
      setUnreadMsgCount(count);
    };
    calc();
    const iv = setInterval(calc, 3000);
    return () => clearInterval(iv);
  }, [merchantId]);

  const pendingOrdersCount = mergedOrders.filter((o: any) => o.status === 'pending').length;

  const [extraFeedbacks, setExtraFeedbacks] = React.useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('customerFeedbacks') || '[]'); } catch { return []; }
  });

  React.useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'customerFeedbacks') {
        try { setExtraFeedbacks(JSON.parse(e.newValue || '[]')); } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const myFeedbacks = React.useMemo(() => {
    const matchesMerchant = (f: any) => f.merchantId && f.merchantId === merchantId;
    const fromContext = customerFeedbacks.filter(matchesMerchant);
    const fromStorage = extraFeedbacks.filter(matchesMerchant);
    const ids = new Set(fromContext.map((f: any) => f.id));
    return [...fromContext, ...fromStorage.filter((f: any) => !ids.has(f.id))];
  }, [customerFeedbacks, extraFeedbacks, merchantId]);

  const [feedbackBadge, setFeedbackBadge] = React.useState<number>(0);

  React.useEffect(() => {
    const lastSeen = parseInt(localStorage.getItem(`last_seen_feedback_${user?.id || 'anon'}`) || '0');
    setFeedbackBadge(Math.max(0, myFeedbacks.length - lastSeen));
  }, [myFeedbacks]);

  React.useEffect(() => {
    if (activeTab === 'feedback') {
      // أعد قراءة التقييمات من localStorage عند فتح التبويب
      try { setExtraFeedbacks(JSON.parse(localStorage.getItem('customerFeedbacks') || '[]')); } catch {}
      localStorage.setItem(`last_seen_feedback_${user?.id || 'anon'}`, String(myFeedbacks.length));
      setFeedbackBadge(0);
    }
  }, [activeTab]);

  // v2.9.1.6: عند فتح تبويب الرسائل، نضع علامة "مقروء" لكل المحادثات
  React.useEffect(() => {
    if (activeTab === 'messages' && merchantId) {
      try {
        const threads: any[] = JSON.parse(localStorage.getItem(`customer_merchant_chat_${merchantId}`) || '[]');
        const now = Date.now().toString();
        threads.forEach((t: any) => {
          localStorage.setItem(`merchant_msg_seen_${t.id}`, now);
        });
      } catch {}
      // إعادة حساب العدد (يصبح 0)
      setUnreadMsgCount(0);
    }
  }, [activeTab, merchantId]);

  const menuItems = [
    { id: 'welcome',            label: 'الرئيسية',          icon: LayoutDashboard },
    { id: 'products',           label: 'منتجاتي',            icon: Package },
    { id: 'delivery-companies', label: 'شركات التوصيل',      icon: Truck },
    { id: 'orders',             label: 'الطلبات',            icon: ShoppingBag,   badge: pendingOrdersCount },
    { id: 'messages',           label: 'رسائل العملاء',      icon: MessageSquare, badge: unreadMsgCount },
    { id: 'feedback',           label: 'تعليقات الزبائن',    icon: Star, badge: feedbackBadge },
    { id: 'advertise',          label: 'إعلان منتج',         icon: Megaphone },
    { id: 'contact-support',    label: 'تواصل مع الدعم',     icon: Headphones },
    { id: 'settings',           label: 'الإعدادات',          icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: isLight ? '#f8fafc' : '#080e1c', direction: 'rtl' }}>

      {/* Status Change Confirmation Modal */}
      {confirmStatusChange && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: isLight ? '#fff' : 'linear-gradient(135deg,#020817,#0d1f40)', borderRadius: 20, padding: '2rem', maxWidth: 380, width: '100%', border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.3)'}`, boxShadow: '0 16px 48px rgba(0,0,0,0.35)', textAlign: 'center', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 1rem', background: 'rgba(0,112,200,0.12)', border: '1.5px solid rgba(0,112,200,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle style={{ width: 24, height: 24, color: '#0070c8' }} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: isLight ? '#0d3a6e' : '#e0f2fe', marginBottom: '0.5rem' }}>تأكيد تحديث الحالة</h3>
            <p style={{ fontSize: '0.875rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.6)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              هل أنت متأكد من تحديث حالة الطلب إلى <strong>"{confirmStatusChange.actionLabel}"</strong>؟
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => {
                // إذا كان طلباً فرعياً، استخدم updateSubOrderStatus
                const subOrder = merchantSubOrders.find((s: any) => s.id === confirmStatusChange.orderId);
                if (subOrder && subOrder.masterOrderId) {
                  updateSubOrderStatus(subOrder.masterOrderId, confirmStatusChange.orderId, confirmStatusChange.targetStatus as any);
                } else {
                  updateOrderStatus(confirmStatusChange.orderId, confirmStatusChange.targetStatus as any);
                }
                showToastMessage(`تم تحديث الطلب: ${confirmStatusChange.actionLabel}`, 'success');
                setConfirmStatusChange(null);
              }} style={{ flex: 1, padding: '0.7rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>
                نعم، تأكيد
              </button>
              <button onClick={() => setConfirmStatusChange(null)} style={{ flex: 1, padding: '0.7rem', borderRadius: 12, border: `1.5px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.4)'}`, background: isLight ? '#f8fafc' : 'rgba(0,176,255,0.1)', color: isLight ? '#0d3a6e' : '#e0f2fe', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: isLight ? '#fff' : 'linear-gradient(135deg, #020817, #0d1f40)', borderRadius: 20, padding: '2rem', maxWidth: 360, width: '100%', border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.3)'}`, boxShadow: '0 16px 48px rgba(0,0,0,0.3)', textAlign: 'center', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 1rem', background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut style={{ width: 24, height: 24, color: '#ef4444' }} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: isLight ? '#0d3a6e' : '#e0f2fe', marginBottom: '0.5rem' }}>تسجيل الخروج</h3>
            <p style={{ fontSize: '0.875rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.6)', marginBottom: '1.5rem' }}>هل أنت متأكد أنك تريد تسجيل الخروج من بوابة المحلات؟</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={confirmLogout} style={{ flex: 1, padding: '0.7rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>نعم، خروج</button>
              <button onClick={() => setShowLogoutModal(false)} style={{ flex: 1, padding: '0.7rem', borderRadius: 12, border: `1.5px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.4)'}`, background: isLight ? '#f8fafc' : 'rgba(0,176,255,0.1)', color: isLight ? '#0d3a6e' : '#e0f2fe', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>لا، تراجع</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: isLight ? '#1e3a6e' : '#020817', borderBottom: '1px solid rgba(0,176,255,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(0,176,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,176,255,0.3)' }}>
            <Zap style={{ width: 18, height: 18, color: '#67e8f9' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e0f2fe' }}>بوابة المحلات</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(p => !p)} style={{ background: 'rgba(0,176,255,0.12)', border: '1px solid rgba(0,176,255,0.25)', borderRadius: 9, padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          {isMobileMenuOpen ? <X style={{ width: 22, height: 22, color: '#67e8f9' }} /> : <Menu style={{ width: 22, height: 22, color: '#67e8f9' }} />}
        </button>
      </div>

      {/* Mobile Dropdown Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden flex-shrink-0" style={{ background: isLight ? '#1a3575' : '#0a1020', borderBottom: '1px solid rgba(0,176,255,0.18)', padding: '0.6rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {menuItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.85rem', borderRadius: 10, background: activeTab === item.id ? 'rgba(0,176,255,0.2)' : 'transparent', color: activeTab === item.id ? '#67e8f9' : 'rgba(224,242,254,0.75)', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 600, fontSize: '0.88rem', textAlign: 'right', transition: 'background 0.15s' }}>
              <item.icon style={{ width: 17, height: 17, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {(item as any).badge > 0 && (
                <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                  {(item as any).badge > 9 ? '9+' : (item as any).badge}
                </span>
              )}
            </button>
          ))}
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.85rem', borderRadius: 10, background: 'transparent', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 600, fontSize: '0.88rem', textAlign: 'right', marginTop: '0.25rem' }}>
            <LogOut style={{ width: 17, height: 17, flexShrink: 0 }} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      )}

      <div className="flex flex-row flex-1" style={{ minHeight: 0 }}>

      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          merchantId={merchantId}
          storeName={storeName}
          onSuccess={() => {
            setShowAddModal(false);
            refreshProducts();
            showToastMessage('تمت إضافة المنتج — في انتظار المراجعة', 'success');
          }}
        />
      )}

      {/* Sidebar — desktop only */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0"
        style={{
          width: 240,
          background: isLight ? 'linear-gradient(180deg, #1e3a6e 0%, #1e4080 60%, #1a3870 100%)' : 'linear-gradient(180deg, #020817 0%, #0a1628 60%, #0c1a2e 100%)',
          borderLeft: `1px solid ${isLight ? 'rgba(255,255,255,0.15)' : 'rgba(0,176,255,0.15)'}`,
          boxShadow: '2px 0 24px rgba(0,176,255,0.08)',
        }}>
        {/* CyberVolt home link */}
        <Link to="/" style={{
          padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,176,255,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'rgba(0,176,255,0.15)', border: '1px solid rgba(0,176,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap style={{ width: 20, height: 20, color: '#67e8f9' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#e0f2fe', lineHeight: 1.3 }}>CyberVolt e-Mall</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(224,242,254,0.45)', marginTop: 1 }}>مجمع سايبر فولت</div>
          </div>
        </Link>

        {/* Store badge */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'rgba(0,176,255,0.15)', border: '1px solid rgba(0,176,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Store style={{ width: 22, height: 22, color: '#67e8f9' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#e0f2fe', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                {storeName}
              </p>
              <span style={{ fontSize: '0.7rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: 2 }}>
                <CheckCircle style={{ width: 11, height: 11 }} /> نشط
              </span>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0.75rem' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {menuItems.map(item => (
              <li key={item.id}>
                <button
                  data-nav-menu-item
                  tabIndex={0}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  onKeyDown={e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const btns = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-menu-item]')); const idx = btns.indexOf(e.currentTarget); const next = e.key === 'ArrowDown' ? btns[idx + 1] : btns[idx - 1]; if (next) next.focus(); } }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.7rem 0.875rem', borderRadius: 10,
                    background: activeTab === item.id ? 'rgba(0,176,255,0.18)' : 'transparent',
                    color: activeTab === item.id ? '#67e8f9' : 'rgba(224,242,254,0.65)',
                    border: activeTab === item.id ? '1px solid rgba(0,176,255,0.3)' : '1px solid transparent',
                    cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
                    fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.15s',
                    textAlign: 'right',
                  }}
                  onMouseEnter={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                  onMouseLeave={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <item.icon style={{ width: 18, height: 18, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {(item as any).badge > 0 && (
                    <span style={{ minWidth: 20, height: 20, borderRadius: 10, background: '#ef4444', color: '#fff', fontSize: '0.68rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                      {(item as any).badge > 9 ? '9+' : (item as any).badge}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.7rem 0.875rem', borderRadius: 10,
              background: 'transparent', color: '#fca5a5',
              border: '1px solid transparent', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
              fontWeight: 600, fontSize: '0.875rem', transition: 'background 0.15s',
              textAlign: 'right',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut style={{ width: 18, height: 18, flexShrink: 0 }} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', minWidth: 0 }}>

        {/* Welcome tab */}
        {activeTab === 'welcome' && (
          <div className="animate-fade-in" style={{ maxWidth: 720, margin: '0 auto' }}>
            {/* Hero card */}
            <div style={{
              background: 'linear-gradient(135deg, #0D47A1 0%, #0070c8 50%, #00B0FF 100%)',
              borderRadius: 24, padding: '2rem', color: '#fff', marginBottom: '1.5rem',
              boxShadow: '0 8px 32px rgba(0,112,200,0.25)', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.06,
                backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(255,255,255,0.8), transparent 60%)',
              }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{
                  width: 64, height: 64, background: 'rgba(255,255,255,0.2)',
                  borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0,
                }}>
                  <Zap style={{ width: 32, height: 32, color: '#fff' }} />
                </div>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#fff' }}>
                    أهلاً بك في {storeName}
                  </h1>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                    لوحة تحكم التاجر — CyberVolt e-Mall
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'إجمالي المبيعات', value: formatPrice(stats.totalSales), icon: DollarSign, color: '#0070c8', bg: '#dbeafe' },
                { label: 'الطلبات', value: String(stats.totalOrders), icon: ShoppingBag, color: '#7c3aed', bg: '#ede9fe' },
                { label: 'طلبات معلقة', value: String(stats.pendingOrders), icon: Users, color: '#d97706', bg: '#fef3c7' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: '#fff', borderRadius: 16, padding: '1.25rem',
                  boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
                  border: '1px solid #f1f5f9', textAlign: 'center',
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                    <s.icon style={{ width: 22, height: 22, color: s.color }} />
                  </div>
                  <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0d2a4a', margin: '0 0 0.2rem' }}>{s.value}</p>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Notifications */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '1.5rem', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#0d3a6e' }}>
                  <Bell style={{ width: 18, height: 18, color: '#00B0FF' }} /> الإشعارات
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      const pool = [
                        { title: 'طلب جديد!', body: `رقم ORD-${Math.floor(Math.random() * 9000 + 1000)} — بانتظار التحضير` },
                        { title: 'منتج تم اعتماده ✓', body: 'تم قبول منتجك وأصبح نشطاً في السوق' },
                        { title: 'تقييم جديد ⭐', body: 'حصل أحد منتجاتك على تقييم 5 نجوم!' },
                        { title: 'رصيد محدّث', body: `أرباح جديدة: ${Math.floor(Math.random() * 300 + 50)} د.ل` },
                      ];
                      const pick = pool[Math.floor(Math.random() * pool.length)];
                      pushMerchantNotification(pick.title, pick.body);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.3rem 0.7rem', borderRadius: 8,
                      background: 'rgba(0,176,255,0.08)', border: '1px solid rgba(0,176,255,0.2)',
                      color: '#0070c8', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
                      fontSize: '0.72rem', fontWeight: 700, transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,176,255,0.15)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,176,255,0.08)')}
                  >
                    <Zap style={{ width: 12, height: 12 }} />
                    محاكاة
                  </button>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {merchantNotifications.filter(n => !n.read).length} غير مقروء
                  </span>
                </div>
              </div>
              {merchantNotifications.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', padding: '1rem 0' }}>لا توجد إشعارات جديدة</p>
              ) : merchantNotifications.map(n => (
                <div key={n.id} style={{
                  padding: '0.875rem 1rem', borderRadius: 12, marginBottom: '0.5rem',
                  background: n.read ? '#f8fafc' : '#f0f9ff',
                  border: `1px solid ${n.read ? '#f1f5f9' : '#bae6fd'}`,
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0d3a6e' }}>{n.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>{n.body}</div>
                </div>
              ))}
            </div>

            {/* Add product CTA */}
            <div style={{
              background: '#fff', borderRadius: 20, padding: '2rem',
              boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9',
              textAlign: 'center',
            }}>
              <div style={{ width: 56, height: 56, background: 'rgba(0,176,255,0.1)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Plus style={{ width: 28, height: 28, color: '#00B0FF' }} />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0d3a6e', margin: '0 0 0.5rem' }}>أضف منتجاتك الآن</h3>
              <p style={{ color: '#64748b', margin: '0 0 1.25rem', fontSize: '0.9rem' }}>ابدأ بإضافة منتجاتك لتظهر للعملاء</p>
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 1.75rem', borderRadius: 12,
                  background: 'linear-gradient(135deg, #0070c8, #00B0FF)',
                  color: '#fff', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.95rem', fontFamily: 'Tajawal, sans-serif',
                  boxShadow: '0 4px 16px rgba(0,112,200,0.25)',
                }}
              >
                <Plus style={{ width: 18, height: 18 }} />
                <span>إضافة سلعة جديدة</span>
              </button>
            </div>
          </div>
        )}

        {/* Products tab */}
        {activeTab === 'products' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0d3a6e', margin: '0 0 0.2rem' }}>منتجاتي</h1>
                <p style={{ color: '#64748b', margin: 0, fontSize: '0.875rem' }}>{myProducts.length} منتج</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.65rem 1.25rem', borderRadius: 10,
                  background: '#0070c8', color: '#fff',
                  border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.875rem', fontFamily: 'Tajawal, sans-serif',
                }}
              >
                <Plus style={{ width: 16, height: 16 }} />
                <span>إضافة منتج</span>
              </button>
            </div>

            {myProducts.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 20, padding: '3rem', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
                <Package style={{ width: 56, height: 56, color: '#e2e8f0', margin: '0 auto 1rem' }} />
                <p style={{ color: '#94a3b8', marginBottom: '1.25rem' }}>لا توجد منتجات بعد</p>
                <button onClick={() => setShowAddModal(true)} style={{ padding: '0.65rem 1.5rem', background: '#0070c8', color: '#fff', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 700 }}>
                  إضافة أول منتج
                </button>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                        {['المنتج', 'الفئة', 'السعر', 'المخزون', 'الألوان', 'الحالة', ''].map(h => (
                          <th key={h} style={{ textAlign: 'right', padding: '0.875rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {myProducts.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              {p.images?.[0] && <SafeImage src={p.images[0]} alt={p.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
                              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0d3a6e' }}>{p.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>{p.category}</td>
                          <td style={{ padding: '0.875rem 1rem', fontWeight: 700, fontSize: '0.875rem', color: '#0070c8' }}>{formatPrice(p.price)}</td>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#475569' }}>{p.stock}</td>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            {p.colorVariants && p.colorVariants.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                {p.colorVariants.map((cv: any, i: number) => (
                                  <span key={i} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#f0f9ff', color: '#0070c8', borderRadius: 6, border: '1px solid #bae6fd', whiteSpace: 'nowrap' }}>
                                    {cv.color} ({cv.qty})
                                  </span>
                                ))}
                              </div>
                            ) : <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>—</span>}
                          </td>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            {p.isPending
                              ? <span style={{ padding: '0.25rem 0.6rem', background: '#fef3c7', color: '#b45309', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>قيد المراجعة</span>
                              : <span style={{ padding: '0.25rem 0.6rem', background: '#d1fae5', color: '#065f46', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>نشط</span>
                            }
                          </td>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <button onClick={() => handleDeleteProduct(p.id)} style={{ padding: '0.4rem', borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <Trash2 style={{ width: 16, height: 16 }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages tab */}
        {activeTab === 'messages' && (
          <div className="animate-fade-in" key={msgRefresh}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: isLight ? '#0d3a6e' : '#e0f2fe', margin: '0 0 0.2rem' }}>رسائل العملاء</h1>
              <p style={{ color: isLight ? '#64748b' : 'rgba(224,242,254,0.55)', margin: 0, fontSize: '0.875rem' }}>المحادثات مع عملائك — يمكنك الرد مباشرةً</p>
            </div>
            {(() => {
              let threads: any[] = [];
              try { threads = JSON.parse(localStorage.getItem(`customer_merchant_chat_${merchantId}`) || '[]'); } catch {}
              let legacyMsgs: any[] = [];
              try { legacyMsgs = JSON.parse(localStorage.getItem(`shop_messages_${merchantId}`) || '[]'); } catch {}
              const legacyOnly = legacyMsgs.filter((m: any) => !threads.some((t: any) => t.customerId === m.customerId));
              if (threads.length === 0 && legacyMsgs.length === 0) return (
                <div style={{ background: isLight ? '#fff' : '#0d1526', borderRadius: 20, padding: '3rem', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: `1px solid ${isLight ? '#f1f5f9' : 'rgba(0,176,255,0.1)'}` }}>
                  <MessageSquare style={{ width: 56, height: 56, color: isLight ? '#e2e8f0' : 'rgba(0,176,255,0.2)', margin: '0 auto 1rem' }} />
                  <p style={{ color: isLight ? '#94a3b8' : 'rgba(224,242,254,0.4)', marginBottom: '0.5rem', fontWeight: 600 }}>لا توجد رسائل بعد</p>
                  <p style={{ color: isLight ? '#cbd5e1' : 'rgba(224,242,254,0.3)', fontSize: '0.85rem', margin: 0 }}>ستظهر هنا رسائل العملاء المرسلة من صفحات المنتجات والمحلات</p>
                </div>
              );
              const cardBg = isLight ? '#fff' : '#0d1526';
              const border = isLight ? '#f1f5f9' : 'rgba(0,176,255,0.1)';
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 720 }}>
                  {threads.map((thread: any) => (
                    <div key={thread.id} style={{ background: cardBg, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: `1px solid ${border}` }}>
                      <div style={{ padding: '0.85rem 1.25rem', background: isLight ? '#f0f9ff' : 'rgba(0,176,255,0.08)', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: isLight ? '#dbeafe' : 'rgba(0,176,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <UserIcon style={{ width: 18, height: 18, color: '#0070c8' }} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isLight ? '#0d3a6e' : '#e0f2fe' }}>{thread.customerName || 'عميل'}</span>
                            {(() => {
                              const hasPurchased = mergedOrders.some((o: any) =>
                                o.customerId === thread.customerId ||
                                (Array.isArray(o.items) && o.items.some((item: any) =>
                                  item.store?.id === merchantId || item.selectedStore?.id === merchantId
                                ))
                              );
                              return hasPurchased ? (
                                <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: 8, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 700, border: '1px solid rgba(34,197,94,0.3)' }}>زبون</span>
                              ) : (
                                <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: 8, background: isLight ? 'rgba(156,163,175,0.15)' : 'rgba(255,255,255,0.08)', color: isLight ? '#9ca3af' : 'rgba(224,242,254,0.4)', fontWeight: 600 }}>مستخدم</span>
                              );
                            })()}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.45)' }}>{thread.messages.length} رسالة</div>
                        </div>
                      </div>
                      <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 280, overflowY: 'auto' }}>
                        {thread.messages.map((msg: any) => (
                          <div key={msg.id} style={{ display: 'flex', flexDirection: msg.from === 'merchant' ? 'row-reverse' : 'row', gap: '0.5rem' }}>
                            <div style={{ maxWidth: '80%', padding: '0.6rem 0.85rem', borderRadius: msg.from === 'merchant' ? '12px 4px 12px 12px' : '4px 12px 12px 12px', background: msg.from === 'merchant' ? (isLight ? '#0070c8' : '#1a4a8a') : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.07)'), color: msg.from === 'merchant' ? '#fff' : (isLight ? '#374151' : '#e0f2fe'), fontSize: '0.875rem', lineHeight: 1.6 }}>
                              {msg.text}
                              <div style={{ fontSize: '0.65rem', opacity: 0.65, marginTop: '0.2rem' }}>{new Date(msg.at).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: '0.85rem 1.25rem', borderTop: `1px solid ${border}`, display: 'flex', gap: '0.6rem' }}>
                        <input
                          type="text"
                          value={threadReplies[thread.id] || ''}
                          onChange={e => setThreadReplies(prev => ({ ...prev, [thread.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') sendCustomerReply(thread.id, thread.customerId); }}
                          placeholder="اكتب ردك هنا..."
                          style={{ flex: 1, padding: '0.6rem 0.85rem', borderRadius: 10, border: `1.5px solid ${isLight ? '#dbeafe' : 'rgba(0,176,255,0.2)'}`, background: isLight ? '#f8fafc' : '#080e1c', color: isLight ? '#0d3a6e' : '#e0f2fe', fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem', outline: 'none' }}
                        />
                        <button onClick={() => sendCustomerReply(thread.id, thread.customerId)} style={{ padding: '0.6rem 1rem', borderRadius: 10, background: '#0070c8', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'Tajawal, sans-serif', fontWeight: 600, fontSize: '0.85rem' }}>
                          <Send style={{ width: 15, height: 15 }} />
                          رد
                        </button>
                      </div>
                    </div>
                  ))}
                  {legacyOnly.map((msg: any, idx: number) => (
                    <div key={idx} style={{ background: cardBg, borderRadius: 16, padding: '1.25rem', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: `1px solid ${border}` }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: isLight ? '#f0f9ff' : 'rgba(0,176,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <UserIcon style={{ width: 20, height: 20, color: '#0070c8' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isLight ? '#0d3a6e' : '#e0f2fe' }}>{msg.customerName || 'عميل'}</span>
                            <span style={{ fontSize: '0.72rem', color: isLight ? '#94a3b8' : 'rgba(224,242,254,0.4)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock style={{ width: 11, height: 11 }} />
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString('ar-LY') : ''}
                            </span>
                          </div>
                          {msg.productName && <p style={{ fontSize: '0.75rem', color: '#0070c8', margin: '0 0 0.4rem', fontWeight: 600 }}>بخصوص: {msg.productName}</p>}
                          <p style={{ color: isLight ? '#374151' : 'rgba(224,242,254,0.8)', fontSize: '0.9rem', lineHeight: 1.65, margin: 0 }}>{msg.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Orders tab */}
        {activeTab === 'orders' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: isLight ? '#0d3a6e' : '#e0f2fe', margin: '0 0 0.2rem' }}>الطلبات</h1>
              <p style={{ color: isLight ? '#64748b' : 'rgba(224,242,254,0.55)', margin: 0, fontSize: '0.875rem' }}>{mergedOrders.length} طلب</p>
            </div>
            {mergedOrders.length === 0 ? (
              <div style={{ background: isLight ? '#fff' : '#0d1526', borderRadius: 20, padding: '3rem', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: `1px solid ${isLight ? '#f1f5f9' : 'rgba(0,176,255,0.1)'}` }}>
                <ShoppingBag style={{ width: 56, height: 56, color: isLight ? '#e2e8f0' : 'rgba(0,176,255,0.2)', margin: '0 auto 1rem' }} />
                <p style={{ color: isLight ? '#94a3b8' : 'rgba(224,242,254,0.4)', marginBottom: '0.3rem', fontWeight: 600 }}>لا توجد طلبات حالياً</p>
                <p style={{ color: isLight ? '#cbd5e1' : 'rgba(224,242,254,0.25)', fontSize: '0.82rem', margin: 0 }}>ستظهر هنا الطلبات فور استلامها من العملاء</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {mergedOrders.map((order: any) => (
                  <div key={order.id} style={{ background: isLight ? '#fff' : '#0d1526', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: `1px solid ${isLight ? '#f1f5f9' : 'rgba(0,176,255,0.1)'}` }}>
                    <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: isLight ? '#0d3a6e' : '#e0f2fe' }}>{order.id}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: isLight ? '#64748b' : 'rgba(224,242,254,0.5)', margin: '0 0 0.5rem' }}>
                          {order.customerName} · {new Date(order.createdAt).toLocaleDateString('ar-LY')}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {order.status === 'pending' && (
                            <button
                              onClick={() => setConfirmStatusChange({ orderId: order.id, targetStatus: 'confirmed', actionLabel: 'بدء التجهيز' })}
                              style={{ padding: '0.4rem 0.9rem', borderRadius: 10, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: '0.8rem', fontWeight: 600 }}
                            >بدء التجهيز</button>
                          )}
                          {order.status === 'confirmed' && (
                            <button
                              onClick={() => setConfirmStatusChange({ orderId: order.id, targetStatus: 'preparing', actionLabel: 'جاهز للشحن' })}
                              style={{ padding: '0.4rem 0.9rem', borderRadius: 10, background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: '0.8rem', fontWeight: 600 }}
                            >جاهز للشحن</button>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => setConfirmStatusChange({ orderId: order.id, targetStatus: 'ready', actionLabel: 'جاهز للتسليم' })}
                              style={{ padding: '0.4rem 0.9rem', borderRadius: 10, background: 'linear-gradient(135deg,#16a34a,#4ade80)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: '0.8rem', fontWeight: 600 }}
                            >جاهز للتسليم</button>
                          )}
                          {(order.status === 'ready' || order.status === 'ready_for_pickup') && (
                            <span style={{ padding: '0.3rem 0.8rem', borderRadius: 20, background: 'rgba(99,102,241,0.12)', color: '#818cf8', fontSize: '0.78rem', fontWeight: 600, border: '1px solid rgba(99,102,241,0.25)' }}>بانتظار شركة التوصيل</span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'left', flexShrink: 0 }}>
                        <p style={{ fontWeight: 800, color: '#0070c8', margin: '0 0 0.1rem', fontSize: '1rem' }}>{formatPrice(order.total)}</p>
                        <p style={{ fontSize: '0.72rem', color: isLight ? '#94a3b8' : 'rgba(224,242,254,0.4)', margin: 0 }}>إجمالي الطلب</p>
                      </div>
                    </div>
                    <div style={{ padding: '0 1.25rem 1.25rem' }}>
                      <OrderTimeline status={order.status} compact isLight={isLight} perspective="merchant" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contact Support tab */}
        {activeTab === 'contact-support' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: isLight ? '#0d3a6e' : '#e0f2fe', margin: '0 0 0.2rem' }}>تواصل مع الدعم الفني</h1>
              <p style={{ color: isLight ? '#64748b' : 'rgba(224,242,254,0.55)', margin: 0, fontSize: '0.875rem' }}>راسل فريق الدعم مباشرةً — سيرد عليك في أقرب وقت</p>
            </div>
            {(() => {
              const chat = getMerchantSupportChat();
              const cardBg = isLight ? '#fff' : '#0d1526';
              const border = isLight ? '#f1f5f9' : 'rgba(0,176,255,0.1)';
              const textPrimary = isLight ? '#0d2a4a' : '#e0f2fe';
              const textMuted = isLight ? '#6b7280' : 'rgba(224,242,254,0.5)';
              return (
                <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'linear-gradient(135deg, rgba(0,112,200,0.1), rgba(124,58,237,0.08))', borderRadius: 16, padding: '1rem 1.25rem', border: `1px solid ${isLight ? 'rgba(0,112,200,0.15)' : 'rgba(0,176,255,0.2)'}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: isLight ? 'rgba(0,112,200,0.12)' : 'rgba(0,176,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Headphones style={{ width: 22, height: 22, color: '#0070c8' }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, color: textPrimary, margin: 0, fontSize: '0.9rem' }}>فريق الدعم الفني — CyberVolt</p>
                      <p style={{ color: textMuted, fontSize: '0.78rem', margin: '0.15rem 0 0' }}>متاح للرد على استفساراتك ومشكلاتك</p>
                    </div>
                  </div>

                  <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${border}`, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ padding: '0.85rem 1.25rem', minHeight: 240, maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {chat.messages.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
                          <MessageSquare style={{ width: 48, height: 48, color: isLight ? '#e2e8f0' : 'rgba(0,176,255,0.15)', marginBottom: '0.75rem' }} />
                          <p style={{ color: textMuted, fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>ابدأ محادثة مع فريق الدعم</p>
                          <p style={{ color: textMuted, fontSize: '0.8rem', margin: '0.25rem 0 0', opacity: 0.7 }}>اكتب رسالتك أدناه وسنرد عليك قريباً</p>
                        </div>
                      ) : chat.messages.map((msg: any) => (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: msg.from === 'merchant' ? 'flex-end' : 'flex-start' }}>
                          <div style={{ maxWidth: '78%', padding: '0.6rem 0.9rem', borderRadius: 12, background: msg.from === 'merchant' ? 'linear-gradient(135deg,#0070c8,#00B0FF)' : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.07)'), color: msg.from === 'merchant' ? '#fff' : textPrimary, fontSize: '0.875rem', lineHeight: 1.55, border: msg.from !== 'merchant' ? `1px solid ${border}` : 'none' }}>
                            <div style={{ fontSize: '0.68rem', opacity: 0.7, marginBottom: '0.2rem' }}>{msg.from === 'merchant' ? storeName : 'الدعم الفني'} · {new Date(msg.at).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}</div>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '0.85rem 1.25rem', borderTop: `1px solid ${border}`, display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={supportChatMsg}
                        onChange={e => setSupportChatMsg(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMerchantSupportMsg()}
                        placeholder="اكتب رسالتك لفريق الدعم..."
                        style={{ flex: 1, padding: '0.65rem 0.9rem', borderRadius: 10, border: `1.5px solid ${border}`, background: isLight ? '#f8fafc' : '#080e1c', color: textPrimary, fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem', outline: 'none' }}
                        onFocus={e => (e.target.style.borderColor = '#0070c8')}
                        onBlur={e => (e.target.style.borderColor = border)}
                      />
                      <button onClick={sendMerchantSupportMsg} style={{ padding: '0.65rem 1.1rem', borderRadius: 10, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem', fontWeight: 600, boxShadow: '0 2px 10px rgba(0,112,200,0.25)' }}>
                        <Send style={{ width: 16, height: 16 }} />
                        <span>إرسال</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Delivery Companies tab */}
        {activeTab === 'delivery-companies' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: isLight ? '#0d3a6e' : '#e0f2fe', margin: '0 0 0.2rem' }}>شركات التوصيل</h1>
              <p style={{ color: isLight ? '#64748b' : 'rgba(224,242,254,0.55)', margin: 0, fontSize: '0.875rem' }}>اختر شركة التوصيل لمتجرك أو راسلها مباشرة</p>
            </div>
            {/* Internal Store Delivery banner */}
            <div style={{ background: isLight ? '#f0f7ff' : 'rgba(0,176,255,0.06)', border: `1px solid ${isLight ? '#bfdbfe' : 'rgba(0,176,255,0.15)'}`, borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: isLight ? 'rgba(0,112,200,0.12)' : 'rgba(0,176,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Truck style={{ width: 20, height: 20, color: isLight ? '#0070c8' : '#67e8f9' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isLight ? '#0d3a6e' : '#e0f2fe' }}>التوصيل بواسطة شركة تابعة للمحل</div>
                <div style={{ fontSize: '0.75rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.5)', marginTop: 2 }}>إذا كان لديك شركة توصيل خاصة، يمكنك إدارتها من إعدادات المتجر</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {deliveryCompanies.map((company: any) => (
                <DeliveryCompanyCard
                  key={company.id}
                  company={company}
                  isAssigned={assignedDeliveryCompanyId === company.id}
                  isLight={isLight}
                  merchantId={merchantId}
                  storeName={storeName}
                  onAssign={(id, name) => {
                    const data = { companyId: id, companyName: name, assignedAt: new Date().toISOString() };
                    localStorage.setItem(`delivery_rates_${merchantId}`, JSON.stringify(data));
                    setAssignedDeliveryCompanyId(id);
                    showToastMessage(`تم تحديد ${name} كشركة توصيلك`, 'success');
                  }}
                  showToastMessage={showToastMessage}
                  orders={mergedOrders}
                />
              ))}
            </div>
          </div>
        )}

        {/* Advertise tab */}
        {activeTab === 'advertise' && (
          <AdvertiseTab isLight={isLight} myProducts={myProducts} merchantId={merchantId} showToastMessage={showToastMessage} />
        )}

        {/* Feedback tab */}
        {activeTab === 'feedback' && (() => {
          const feedbacks = myFeedbacks;
          return (
            <div className="animate-fade-in">
              <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: isLight ? '#0d3a6e' : '#e0f2fe', margin: 0 }}>تعليقات الزبائن</h1>
                <p style={{ color: isLight ? '#6b7280' : 'rgba(224,242,254,0.5)', marginTop: 4 }}>آراء العملاء في المنتجات والخدمة</p>
              </div>
              {feedbacks.length === 0 ? (
                <div style={{ background: isLight ? '#fff' : '#0d1526', border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.12)'}`, borderRadius: 20, padding: '3rem', textAlign: 'center' }}>
                  <Star style={{ width: 48, height: 48, color: isLight ? '#e2e8f0' : 'rgba(0,176,255,0.2)', margin: '0 auto 1rem' }} />
                  <p style={{ fontWeight: 700, color: isLight ? '#0d3a6e' : '#e0f2fe', marginBottom: '0.4rem' }}>لا توجد تعليقات بعد</p>
                  <p style={{ fontSize: '0.875rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.5)' }}>ستظهر تقييمات الزبائن هنا بعد إتمام الطلبات</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {feedbacks.map((fb: any) => (
                    <div key={fb.id} style={{ background: isLight ? '#fff' : '#0d1526', border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.12)'}`, borderRadius: 16, padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isLight ? '#0d3a6e' : '#e0f2fe' }}>{fb.customerName}</div>
                          <div style={{ fontSize: '0.72rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.4)', marginTop: 2 }}>رقم الطلب: {fb.orderId}</div>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.4)' }}>{new Date(fb.createdAt).toLocaleDateString('ar-LY', { dateStyle: 'medium' })}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 160, background: isLight ? '#f8fcff' : 'rgba(0,176,255,0.05)', borderRadius: 10, padding: '0.75rem' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isLight ? '#6b7280' : 'rgba(224,242,254,0.5)', marginBottom: '0.35rem' }}>تقييم المحل</div>
                          <div style={{ fontSize: '1.1rem', color: '#fbbf24', marginBottom: '0.35rem' }}>{'★'.repeat(fb.storeRating)}{'☆'.repeat(5 - fb.storeRating)}</div>
                          {fb.storeComment && <p style={{ fontSize: '0.8rem', color: isLight ? '#0d3a6e' : '#e0f2fe', margin: 0, lineHeight: 1.5 }}>{fb.storeComment}</p>}
                        </div>
                        <div style={{ flex: 1, minWidth: 160, background: isLight ? '#f8fcff' : 'rgba(0,176,255,0.05)', borderRadius: 10, padding: '0.75rem' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isLight ? '#6b7280' : 'rgba(224,242,254,0.5)', marginBottom: '0.35rem' }}>تقييم التوصيل</div>
                          <div style={{ fontSize: '1.1rem', color: '#fbbf24', marginBottom: '0.35rem' }}>{'★'.repeat(fb.logisticsRating)}{'☆'.repeat(5 - fb.logisticsRating)}</div>
                          {fb.logisticsComment && <p style={{ fontSize: '0.8rem', color: isLight ? '#0d3a6e' : '#e0f2fe', margin: 0, lineHeight: 1.5 }}>{fb.logisticsComment}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Settings tab */}
        {activeTab === 'settings' && (
          <div className="animate-fade-in">
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0d3a6e', marginBottom: '1.5rem' }}>الإعدادات</h1>
            <div style={{ background: '#fff', borderRadius: 20, padding: '1.75rem', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0d3a6e', marginBottom: '1.25rem' }}>بيانات المتجر</h3>
              {merchantInfo && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>اسم المتجر</label>
                    <input type="text" defaultValue={merchantInfo.storeName} className="input-field" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>البريد الإلكتروني</label>
                    <input type="email" defaultValue={merchantInfo.email} className="input-field" readOnly />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>رقم الهاتف</label>
                    <input type="tel" defaultValue={merchantInfo.phone} className="input-field" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>العنوان</label>
                    <input type="text" defaultValue={merchantInfo.address} className="input-field" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>الوصف</label>
                    <textarea defaultValue={merchantInfo.description} className="input-field" rows={3} style={{ resize: 'none' }} />
                  </div>
                </div>
              )}
              <button
                onClick={() => showToastMessage('تم حفظ الإعدادات', 'success')}
                style={{
                  marginTop: '1.25rem', padding: '0.7rem 1.75rem',
                  background: '#0070c8', color: '#fff', borderRadius: 10,
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: '0.9rem',
                }}
              >
                حفظ التغييرات
              </button>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
