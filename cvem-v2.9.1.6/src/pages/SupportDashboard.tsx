import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Headphones, LogOut, Home, MessageSquare,
  CheckCircle, Clock, Lock, User, Zap,
  Send, X, ChevronDown, ChevronUp, RefreshCw, Menu, Store, Truck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';

interface SupportInquiry {
  id: string;
  customerName: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'open' | 'locked' | 'replied';
  lockedBy?: string;
  lockedByName?: string;
  reply?: string;
  repliedAt?: string;
}

interface ChatMessage {
  id: string;
  from: 'agent' | 'customer';
  text: string;
  at: string;
  name?: string;
}

interface MerchantChat {
  merchantId: string;
  merchantName: string;
  messages: ChatMessage[];
  lastAt: string;
}

const SEED_INQUIRIES: SupportInquiry[] = [
  { id: 'inq-001', customerName: 'أحمد الورفلي', subject: 'استفسار عن ضمان آيفون 15', message: 'هل الضمان يشمل الكسر العرضي؟ اشتريت الجهاز قبل أسبوع من محل الأمين.', createdAt: '2026-05-01T09:00:00', status: 'open' },
  { id: 'inq-002', customerName: 'فاطمة المنفي', subject: 'مشكلة في الهاتف الجديد', message: 'شاومي ريدمي 13 اشتريته وما يشتغل الكاميرا الخلفية. أريد الاستبدال أو الاسترجاع.', createdAt: '2026-05-01T10:30:00', status: 'open' },
  { id: 'inq-003', customerName: 'خالد الزروق', subject: 'تأخر في التوصيل', message: 'طلبيتي رقم ORD-1234 من 5 أيام ولم تصل بعد. أين طلبيتي؟ هل هناك مشكلة؟', createdAt: '2026-05-02T08:15:00', status: 'open' },
  { id: 'inq-004', customerName: 'سالم العمروني', subject: 'مشكلة في الدفع', message: 'حاولت الدفع ببطاقتي ولم تنجح العملية لكن الرصيد تم خصمه من حسابي. أريد الاسترجاع.', createdAt: '2026-05-02T11:00:00', status: 'open' },
  { id: 'inq-005', customerName: 'منى الطاهر', subject: 'الألوان المتاحة لسامسونج S24', message: 'هل متوفر اللون الرمادي التيتانيوم لجالاكسي S24 Ultra في أي محل بالمنصة؟', createdAt: '2026-05-03T14:00:00', status: 'open' },
  { id: 'inq-006', customerName: 'يوسف الشريف', subject: 'طلب فاتورة رسمية', message: 'أحتاج فاتورة رسمية لشراء لابتوب Dell من مركز النخبة. هل يمكن إصدارها؟', createdAt: '2026-05-03T15:30:00', status: 'open' },
  { id: 'inq-007', customerName: 'نور القذافي', subject: 'لابتوب لا يقبل الشحن', message: 'لابتوب ASUS اشتريته من مركز النخبة لا يقبل الشحن من اليوم الأول. الموردة لا تستجيب.', createdAt: '2026-05-04T09:00:00', status: 'open' },
  { id: 'inq-008', customerName: 'رانيا الجهاني', subject: 'طلب إلغاء طلب', message: 'أريد إلغاء طلبيتي رقم ORD-5678 لأنني طلبت المنتج الغلط بالخطأ.', createdAt: '2026-05-04T10:00:00', status: 'open' },
  { id: 'inq-009', customerName: 'محمد الشلماني', subject: 'توصيل لمدينة سبها', message: 'هل يمكن التوصيل لمدينة سبها؟ وما هي تكلفة الشحن والمدة المتوقعة؟', createdAt: '2026-05-04T11:30:00', status: 'open' },
  { id: 'inq-010', customerName: 'أميرة الفيتوري', subject: 'استفسار عن العروض القادمة', message: 'متى ستكون العروض القادمة؟ أريد الانتظار لشراء آيفون 16 Pro بسعر مناسب.', createdAt: '2026-05-04T13:00:00', status: 'open' },
];

function getSavedInquiries(): SupportInquiry[] {
  try {
    const saved = localStorage.getItem('support_inquiries');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('support_inquiries', JSON.stringify(SEED_INQUIRIES));
    return SEED_INQUIRIES;
  } catch { return SEED_INQUIRIES; }
}

function saveInquiries(inquiries: SupportInquiry[]) {
  localStorage.setItem('support_inquiries', JSON.stringify(inquiries));
}

function getChatThread(inquiryId: string): ChatMessage[] {
  try {
    return JSON.parse(localStorage.getItem(`support_chat_${inquiryId}`) || '[]');
  } catch { return []; }
}

function saveChatThread(inquiryId: string, messages: ChatMessage[]) {
  localStorage.setItem(`support_chat_${inquiryId}`, JSON.stringify(messages));
}

function getDeliveryChats(): MerchantChat[] {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('delivery_support_chat_'));
    const chats: MerchantChat[] = [];
    for (const key of keys) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || 'null');
        if (data && data.messages?.length > 0) chats.push({ merchantId: data.deliveryId, merchantName: data.deliveryName || data.deliveryId, messages: data.messages, lastAt: data.lastAt });
      } catch { /* skip */ }
    }
    return chats.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
  } catch { return []; }
}

function getMerchantChats(): MerchantChat[] {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('merchant_support_chat_'));
    const chats: MerchantChat[] = [];
    for (const key of keys) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || 'null');
        if (data) chats.push(data);
      } catch {}
    }
    return chats.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  } catch { return []; }
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-LY', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
}

export default function SupportDashboard() {
  const { user, setUser, showToastMessage } = useStore();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const loggingOut = React.useRef(false);
  const [inquiries, setInquiries] = useState<SupportInquiry[]>(getSavedInquiries);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'open' | 'replied' | 'all' | 'merchant-chats' | 'delivery-chats'>('open');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatRefresh, setChatRefresh] = useState(0);
  const [merchantChatReply, setMerchantChatReply] = useState<Record<string, string>>({});
  const [deliveryChatReply, setDeliveryChatReply] = useState<Record<string, string>>({});
  const [chatInputs, setChatInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    sessionStorage.setItem('supportDashboardVisited', '1');
  }, []);

  useEffect(() => {
    if (loggingOut.current || localStorage.getItem('logging_out') === '1') return;
    const token = localStorage.getItem('token');
    if (!token || !user) { navigate('/helpdesk/login'); return; }
    if (user.role !== 'support') { navigate('/helpdesk/login'); }
  }, [user, navigate]);

  if (!user || user.role !== 'support') return null;

  const agentId = user.id;
  const agentName = user.name;

  const handleLockAndReply = (inquiryId: string) => {
    const updated = inquiries.map(inq =>
      inq.id === inquiryId
        ? { ...inq, status: 'locked' as const, lockedBy: agentId, lockedByName: agentName }
        : inq
    );
    setInquiries(updated);
    saveInquiries(updated);
    setReplyingTo(inquiryId);
    setReplyText('');
    setExpandedId(inquiryId);
  };

  const handleSubmitReply = (inquiryId: string) => {
    if (!replyText.trim()) { showToastMessage('يرجى كتابة الرد', 'error'); return; }
    const updated = inquiries.map(inq =>
      inq.id === inquiryId
        ? { ...inq, status: 'replied' as const, reply: replyText, repliedAt: new Date().toISOString() }
        : inq
    );
    setInquiries(updated);
    saveInquiries(updated);
    const inq = inquiries.find(i => i.id === inquiryId);
    const firstMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      from: 'agent',
      text: replyText,
      at: new Date().toISOString(),
      name: agentName,
    };
    const existing = getChatThread(inquiryId);
    saveChatThread(inquiryId, [...existing, firstMsg]);
    setReplyingTo(null);
    setReplyText('');
    showToastMessage('تم إرسال الرد بنجاح', 'success');
    if (inq) {
      const custKey = `customer_inquiry_${inq.id}`;
      try {
        localStorage.setItem(custKey, JSON.stringify({ ...inq, status: 'replied', reply: replyText }));
      } catch {}
    }
  };

  const handleCancelReply = (inquiryId: string) => {
    const updated = inquiries.map(inq =>
      inq.id === inquiryId && inq.lockedBy === agentId
        ? { ...inq, status: 'open' as const, lockedBy: undefined, lockedByName: undefined }
        : inq
    );
    setInquiries(updated);
    saveInquiries(updated);
    setReplyingTo(null);
    setReplyText('');
  };

  const handleResetInquiries = () => {
    if (!confirm('هل تريد إعادة ضبط جميع الاستفسارات؟ سيتم حذف جميع الردود.')) return;
    setInquiries(SEED_INQUIRIES);
    saveInquiries(SEED_INQUIRIES);
    setReplyingTo(null);
    showToastMessage('تم إعادة ضبط الاستفسارات', 'info');
  };

  const handleSendChatMessage = (inquiryId: string) => {
    const text = (chatInputs[inquiryId] || chatMessage).trim();
    if (!text) return;
    const inq = inquiries.find(i => i.id === inquiryId);
    const msg: ChatMessage = {
      id: `chat-${Date.now()}`,
      from: 'agent',
      text,
      at: new Date().toISOString(),
      name: agentName,
    };
    const thread = getChatThread(inquiryId);
    saveChatThread(inquiryId, [...thread, msg]);
    if (inq && inq.status === 'open') {
      const updated = inquiries.map(i => i.id === inquiryId ? { ...i, status: 'replied' as const, reply: text, repliedAt: new Date().toISOString() } : i);
      setInquiries(updated);
      saveInquiries(updated);
    }
    setChatInputs(prev => ({ ...prev, [inquiryId]: '' }));
    setChatMessage('');
    setChatRefresh(r => r + 1);
    showToastMessage('تم إرسال الرسالة', 'success');
  };

  const handleSendDeliveryReply = (deliveryId: string) => {
    const text = deliveryChatReply[deliveryId]?.trim();
    if (!text) return;
    const key = `delivery_support_chat_${deliveryId}`;
    try {
      const data: any = JSON.parse(localStorage.getItem(key) || 'null') || {
        deliveryId, deliveryName: deliveryId, messages: [], lastAt: new Date().toISOString(),
      };
      const msg: ChatMessage = {
        id: `msg-${Date.now()}`,
        from: 'agent',
        text,
        at: new Date().toISOString(),
        name: agentName,
      };
      data.messages.push(msg);
      data.lastAt = msg.at;
      localStorage.setItem(key, JSON.stringify(data));
      setDeliveryChatReply(prev => ({ ...prev, [deliveryId]: '' }));
      setChatRefresh(r => r + 1);
      showToastMessage('تم إرسال الرد لشركة التوصيل', 'success');
    } catch { showToastMessage('حدث خطأ', 'error'); }
  };

  const handleSendMerchantReply = (merchantId: string) => {
    const text = merchantChatReply[merchantId]?.trim();
    if (!text) return;
    const key = `merchant_support_chat_${merchantId}`;
    try {
      const data: MerchantChat = JSON.parse(localStorage.getItem(key) || 'null') || {
        merchantId, merchantName: merchantId, messages: [], lastAt: new Date().toISOString(),
      };
      const msg: ChatMessage = {
        id: `msg-${Date.now()}`,
        from: 'agent',
        text,
        at: new Date().toISOString(),
        name: agentName,
      };
      data.messages.push(msg);
      data.lastAt = msg.at;
      localStorage.setItem(key, JSON.stringify(data));
      setMerchantChatReply(prev => ({ ...prev, [merchantId]: '' }));
      setChatRefresh(r => r + 1);
      showToastMessage('تم إرسال الرد للتاجر', 'success');
    } catch { showToastMessage('حدث خطأ', 'error'); }
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);
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

  const openCount = inquiries.filter(i => i.status === 'open').length;
  const myCount = inquiries.filter(i => i.status === 'locked' && i.lockedBy === agentId).length;
  const lockedCount = inquiries.filter(i => i.status === 'locked' && i.lockedBy !== agentId).length;
  const repliedCount = inquiries.filter(i => i.status === 'replied').length;

  const filteredInquiries = (activeFilter === 'merchant-chats' || activeFilter === 'delivery-chats') ? [] : inquiries.filter(inq => {
    if (activeFilter === 'open') return inq.status === 'open';
    if (activeFilter === 'replied') return inq.status === 'replied';
    return true;
  });

  const merchantChats = getMerchantChats();
  const deliveryChats = getDeliveryChats();

  const bg = isLight ? '#f8fafc' : '#080e1c';
  const cardBg = isLight ? '#ffffff' : '#0d1526';
  const border = isLight ? '#e5e7eb' : 'rgba(0,176,255,0.12)';
  const textPrimary = isLight ? '#0d2a4a' : '#e0f2fe';
  const textMuted = isLight ? '#6b7280' : 'rgba(224,242,254,0.5)';
  const sidebarBg = isLight
    ? 'linear-gradient(180deg, #1e3a6e 0%, #1e4080 60%, #1a3870 100%)'
    : 'linear-gradient(180deg, #020817 0%, #0a1628 60%, #0c1a2e 100%)';

  const filterBtns: { id: typeof activeFilter; label: string; count: number; color: string }[] = [
    { id: 'open', label: 'مفتوحة', count: openCount, color: '#2563eb' },
    { id: 'replied', label: 'تمت الاستجابة', count: repliedCount, color: '#16a34a' },
    { id: 'all', label: 'الكل', count: inquiries.length, color: '#0070c8' },
    { id: 'merchant-chats', label: 'رسائل التجار', count: merchantChats.length, color: '#7c3aed' },
    { id: 'delivery-chats', label: 'رسائل شركات التوصيل', count: deliveryChats.length, color: '#0891b2' },
  ];

  const menuNavItems = [
    { id: 'open', label: 'استفسارات مفتوحة', icon: MessageSquare },
    { id: 'replied', label: 'تمت الاستجابة', icon: CheckCircle },
    { id: 'merchant-chats', label: 'رسائل التجار', icon: Store },
    { id: 'delivery-chats', label: 'رسائل التوصيل', icon: Truck },
  ];

  return (
    <div className="flex flex-col" style={{ minHeight: '100vh', background: bg, direction: 'rtl', fontFamily: 'Tajawal, sans-serif' }}>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: isLight ? '#fff' : 'linear-gradient(135deg, #020817, #0d1f40)', borderRadius: 20, padding: '2rem', maxWidth: 360, width: '100%', border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.3)'}`, boxShadow: '0 16px 48px rgba(0,0,0,0.3)', textAlign: 'center', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 1rem', background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut style={{ width: 24, height: 24, color: '#ef4444' }} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: isLight ? '#0d3a6e' : '#e0f2fe', marginBottom: '0.5rem' }}>تسجيل الخروج</h3>
            <p style={{ fontSize: '0.875rem', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.6)', marginBottom: '1.5rem' }}>هل أنت متأكد أنك تريد تسجيل الخروج من بوابة الدعم الفني؟</p>
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
            <Headphones style={{ width: 18, height: 18, color: '#67e8f9' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e0f2fe' }}>لوحة الدعم الفني</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(p => !p)} style={{ background: 'rgba(0,176,255,0.12)', border: '1px solid rgba(0,176,255,0.25)', borderRadius: 9, padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          {isMobileMenuOpen ? <X style={{ width: 22, height: 22, color: '#67e8f9' }} /> : <Menu style={{ width: 22, height: 22, color: '#67e8f9' }} />}
        </button>
      </div>

      {/* Mobile Dropdown Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden flex-shrink-0" style={{ background: isLight ? '#1a3575' : '#0a1020', borderBottom: '1px solid rgba(0,176,255,0.18)', padding: '0.6rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {menuNavItems.map(item => (
            <button key={item.id} onClick={() => { setActiveFilter(item.id as any); setIsMobileMenuOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.85rem', borderRadius: 10, background: activeFilter === item.id ? 'rgba(0,176,255,0.2)' : 'transparent', color: activeFilter === item.id ? '#67e8f9' : 'rgba(224,242,254,0.75)', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 600, fontSize: '0.88rem', textAlign: 'right', transition: 'background 0.15s' }}>
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

      <div className="flex flex-row flex-1" style={{ minHeight: 0 }}>

        {/* Sidebar — desktop only */}
        <aside className="hidden md:flex flex-col flex-shrink-0" style={{ width: 240, background: sidebarBg, borderLeft: `1px solid ${isLight ? 'rgba(255,255,255,0.15)' : 'rgba(0,176,255,0.15)'}` }}>
          <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <Link to="/" style={{
              display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none',
              padding: '0.75rem 0.85rem', borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(0,176,255,0.22), rgba(124,58,237,0.18))',
              border: '1.5px solid rgba(0,176,255,0.45)',
              boxShadow: '0 0 18px rgba(0,176,255,0.22)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 26px rgba(0,176,255,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 18px rgba(0,176,255,0.22)')}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,176,255,0.2)', border: '1px solid rgba(103,232,249,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 10px rgba(103,232,249,0.3)' }}>
                <Zap style={{ width: 20, height: 20, color: '#67e8f9' }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#e0f2fe', lineHeight: 1.2, textShadow: '0 0 8px rgba(103,232,249,0.4)' }}>CyberVolt e-Mall</div>
                <div style={{ fontSize: '0.67rem', color: 'rgba(103,232,249,0.75)', marginTop: 2, fontWeight: 600 }}>← العودة للرئيسية</div>
              </div>
            </Link>
          </div>

          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,176,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User style={{ width: 18, height: 18, color: '#00B0FF' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e0f2fe' }}>{agentName}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(224,242,254,0.45)' }}>موظف دعم فني</div>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: '1rem 0.75rem' }}>
            <div style={{ padding: '0.6rem 0.75rem', borderRadius: 10, background: 'rgba(0,176,255,0.12)', border: '1px solid rgba(0,176,255,0.2)', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
              <MessageSquare style={{ width: 18, height: 18, color: '#00B0FF' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e0f2fe' }}>الاستفسارات</span>
              <span style={{ marginRight: 'auto', background: '#0070c8', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: 20 }}>{openCount}</span>
            </div>
            <button
              data-nav-menu-item
              tabIndex={0}
              onClick={() => setActiveFilter('merchant-chats')}
              onKeyDown={e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const btns = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-menu-item]')); const idx = btns.indexOf(e.currentTarget); const next = e.key === 'ArrowDown' ? btns[idx + 1] : btns[idx - 1]; if (next) next.focus(); } }}
              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 10, background: activeFilter === 'merchant-chats' ? 'rgba(124,58,237,0.18)' : 'transparent', border: activeFilter === 'merchant-chats' ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent', display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', transition: 'all 0.15s', marginBottom: '0.3rem', fontFamily: 'Tajawal, sans-serif', textAlign: 'right' }}>
              <Store style={{ width: 18, height: 18, color: '#a78bfa', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e0f2fe' }}>رسائل التجار</span>
              {merchantChats.length > 0 && <span style={{ marginRight: 'auto', background: '#7c3aed', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: 20 }}>{merchantChats.length}</span>}
            </button>
            <button
              data-nav-menu-item
              tabIndex={0}
              onClick={() => setActiveFilter('delivery-chats')}
              onKeyDown={e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const btns = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-menu-item]')); const idx = btns.indexOf(e.currentTarget); const next = e.key === 'ArrowDown' ? btns[idx + 1] : btns[idx - 1]; if (next) next.focus(); } }}
              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 10, background: activeFilter === 'delivery-chats' ? 'rgba(8,145,178,0.18)' : 'transparent', border: activeFilter === 'delivery-chats' ? '1px solid rgba(8,145,178,0.3)' : '1px solid transparent', display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Tajawal, sans-serif', textAlign: 'right' }}>
              <Truck style={{ width: 18, height: 18, color: '#67e8f9', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e0f2fe' }}>رسائل التوصيل</span>
              {deliveryChats.length > 0 && <span style={{ marginRight: 'auto', background: '#0891b2', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: 20 }}>{deliveryChats.length}</span>}
            </button>
          </nav>

          <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={handleLogout} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'rgba(224,242,254,0.55)', fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut style={{ width: 17, height: 17 }} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '1.25rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: textPrimary, margin: 0 }}>لوحة الدعم الفني</h1>
              <p style={{ color: textMuted, fontSize: '0.875rem', margin: '0.25rem 0 0' }}>مرحباً {agentName} — إجمالي الاستفسارات: {inquiries.length}</p>
            </div>
            <button onClick={handleResetInquiries} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 10, background: 'transparent', border: `1px solid ${border}`, cursor: 'pointer', color: textMuted, fontFamily: 'Tajawal, sans-serif', fontSize: '0.8rem', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textMuted; }}
            >
              <RefreshCw style={{ width: 14, height: 14 }} />
              إعادة ضبط
            </button>
          </div>

          {/* Stats */}
          {activeFilter !== 'merchant-chats' && activeFilter !== 'delivery-chats' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'مفتوحة', count: openCount, color: '#2563eb', bg: '#eff6ff' },
                { label: 'تمت الاستجابة', count: repliedCount, color: '#16a34a', bg: '#f0fdf4' },
                { label: 'الكل', count: inquiries.length, color: '#0070c8', bg: '#eff6ff' },
              ].map((s, i) => (
                <div key={i} style={{ background: isLight ? s.bg : cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: '0.75rem', color: textMuted, marginTop: '0.2rem' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {filterBtns.map(btn => (
              <button key={btn.id} onClick={() => setActiveFilter(btn.id)} style={{
                padding: '0.45rem 0.85rem', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: activeFilter === btn.id ? btn.color : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)'),
                color: activeFilter === btn.id ? '#fff' : textMuted,
                fontFamily: 'Tajawal, sans-serif', fontSize: '0.82rem', fontWeight: 600,
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.35rem',
              }}>
                {btn.label}
                <span style={{ fontSize: '0.68rem', background: activeFilter === btn.id ? 'rgba(255,255,255,0.25)' : (isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)'), borderRadius: 10, padding: '0.05rem 0.4rem' }}>
                  {btn.count}
                </span>
              </button>
            ))}
          </div>

          {/* Merchant Chats Tab */}
          {activeFilter === 'merchant-chats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {merchantChats.length === 0 ? (
                <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: '3rem', textAlign: 'center' }}>
                  <Store style={{ width: 48, height: 48, color: '#a78bfa', margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p style={{ color: textPrimary, fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>لا توجد رسائل من التجار</p>
                  <p style={{ color: textMuted, fontSize: '0.875rem', marginTop: '0.4rem' }}>ستظهر هنا رسائل التجار الراغبين في التواصل مع الدعم</p>
                </div>
              ) : (
                merchantChats.map(chat => (
                  <div key={chat.merchantId} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Store style={{ width: 18, height: 18, color: '#a78bfa' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: textPrimary }}>{chat.merchantName}</div>
                        <div style={{ fontSize: '0.72rem', color: textMuted }}>{formatDate(chat.lastAt)}</div>
                      </div>
                    </div>
                    <div style={{ padding: '0.85rem 1.25rem', maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {chat.messages.map(msg => (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: msg.from === 'agent' ? 'flex-end' : 'flex-start' }}>
                          <div style={{ maxWidth: '80%', padding: '0.6rem 0.85rem', borderRadius: 12, background: msg.from === 'agent' ? 'linear-gradient(135deg,#0070c8,#00B0FF)' : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.07)'), color: msg.from === 'agent' ? '#fff' : textPrimary, fontSize: '0.875rem', lineHeight: 1.5 }}>
                            <div style={{ fontSize: '0.68rem', opacity: 0.75, marginBottom: '0.2rem' }}>{msg.from === 'agent' ? agentName : chat.merchantName}</div>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '0.85rem 1.25rem', borderTop: `1px solid ${border}`, display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={merchantChatReply[chat.merchantId] || ''}
                        onChange={e => setMerchantChatReply(prev => ({ ...prev, [chat.merchantId]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleSendMerchantReply(chat.merchantId)}
                        placeholder="اكتب ردك على التاجر..."
                        style={{ flex: 1, padding: '0.6rem 0.85rem', borderRadius: 10, border: `1.5px solid ${border}`, background: isLight ? '#f8fafc' : '#080e1c', color: textPrimary, fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem', outline: 'none' }}
                        onFocus={e => (e.target.style.borderColor = '#7c3aed')}
                        onBlur={e => (e.target.style.borderColor = border)}
                      />
                      <button onClick={() => handleSendMerchantReply(chat.merchantId)} style={{ padding: '0.6rem 1rem', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'Tajawal, sans-serif', fontSize: '0.85rem', fontWeight: 600 }}>
                        <Send style={{ width: 15, height: 15 }} />
                        <span>رد</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Delivery Chats Tab */}
          {activeFilter === 'delivery-chats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {deliveryChats.length === 0 ? (
                <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: '3rem', textAlign: 'center' }}>
                  <Truck style={{ width: 48, height: 48, color: '#67e8f9', margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p style={{ color: textPrimary, fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>لا توجد رسائل من شركات التوصيل</p>
                  <p style={{ color: textMuted, fontSize: '0.875rem', marginTop: '0.4rem' }}>ستظهر هنا رسائل شركات التوصيل الراغبة في التواصل مع الدعم</p>
                </div>
              ) : (
                deliveryChats.map(chat => (
                  <div key={chat.merchantId} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(8,145,178,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Truck style={{ width: 18, height: 18, color: '#67e8f9' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: textPrimary }}>{chat.merchantName}</div>
                        <div style={{ fontSize: '0.72rem', color: textMuted }}>{formatDate(chat.lastAt)}</div>
                      </div>
                    </div>
                    <div style={{ padding: '0.85rem 1.25rem', maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {chat.messages.map(msg => (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: msg.from === 'agent' ? 'flex-end' : 'flex-start' }}>
                          <div style={{ maxWidth: '80%', padding: '0.6rem 0.85rem', borderRadius: 12, background: msg.from === 'agent' ? 'linear-gradient(135deg,#0070c8,#00B0FF)' : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.07)'), color: msg.from === 'agent' ? '#fff' : textPrimary, fontSize: '0.875rem', lineHeight: 1.5 }}>
                            <div style={{ fontSize: '0.68rem', opacity: 0.75, marginBottom: '0.2rem' }}>{msg.from === 'agent' ? agentName : chat.merchantName}</div>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '0.85rem 1.25rem', borderTop: `1px solid ${border}`, display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={deliveryChatReply[chat.merchantId] || ''}
                        onChange={e => setDeliveryChatReply(prev => ({ ...prev, [chat.merchantId]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleSendDeliveryReply(chat.merchantId)}
                        placeholder="اكتب ردك على شركة التوصيل..."
                        style={{ flex: 1, padding: '0.6rem 0.85rem', borderRadius: 10, border: `1.5px solid ${border}`, background: isLight ? '#f8fafc' : '#080e1c', color: textPrimary, fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem', outline: 'none' }}
                        onFocus={e => (e.target.style.borderColor = '#0891b2')}
                        onBlur={e => (e.target.style.borderColor = border)}
                      />
                      <button onClick={() => handleSendDeliveryReply(chat.merchantId)} style={{ padding: '0.6rem 1rem', borderRadius: 10, background: 'linear-gradient(135deg,#0891b2,#06b6d4)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'Tajawal, sans-serif', fontSize: '0.85rem', fontWeight: 600 }}>
                        <Send style={{ width: 15, height: 15 }} />
                        <span>رد</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Inquiries List */}
          {activeFilter !== 'merchant-chats' && activeFilter !== 'delivery-chats' && (
            filteredInquiries.length === 0 ? (
              <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: '3rem', textAlign: 'center' }}>
                <CheckCircle style={{ width: 48, height: 48, color: '#16a34a', margin: '0 auto 1rem' }} />
                <p style={{ color: textPrimary, fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>لا توجد استفسارات في هذا القسم</p>
                <p style={{ color: textMuted, fontSize: '0.875rem', marginTop: '0.4rem' }}>جميع الاستفسارات تمت معالجتها بنجاح</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredInquiries.map(inq => {
                  const isLockedByOther = inq.status === 'locked' && inq.lockedBy !== agentId;
                  const isLockedByMe = inq.status === 'locked' && inq.lockedBy === agentId;
                  const isReplied = inq.status === 'replied';
                  const isExpanded = expandedId === inq.id;
                  const isReplying = replyingTo === inq.id;
                  const isChatOpen = activeChatId === inq.id;
                  const chatThread = isChatOpen ? getChatThread(inq.id) : [];

                  let statusColor = '#2563eb';
                  let statusBg = isLight ? '#eff6ff' : 'rgba(37,99,235,0.12)';
                  let statusLabel = 'مفتوحة';
                  let StatusIcon = Clock;
                  if (isLockedByMe) { statusColor = '#f59e0b'; statusBg = isLight ? '#fffbeb' : 'rgba(245,158,11,0.12)'; statusLabel = 'قيد ردي'; StatusIcon = Lock; }
                  if (isLockedByOther) { statusColor = '#6b7280'; statusBg = isLight ? '#f9fafb' : 'rgba(107,114,128,0.12)'; statusLabel = `مقفول بـ ${inq.lockedByName}`; StatusIcon = Lock; }
                  if (isReplied) { statusColor = '#16a34a'; statusBg = isLight ? '#f0fdf4' : 'rgba(22,163,74,0.12)'; statusLabel = 'تمت الاستجابة'; StatusIcon = CheckCircle; }

                  return (
                    <div key={inq.id} style={{ background: isLockedByOther ? (isLight ? '#fafafa' : 'rgba(255,255,255,0.02)') : cardBg, border: `1px solid ${isLockedByMe ? '#f59e0b' : isReplied ? 'rgba(22,163,74,0.3)' : border}`, borderRadius: 16, overflow: 'hidden', opacity: isLockedByOther ? 0.7 : 1, transition: 'all 0.15s' }}>
                      {/* Card Header */}
                      <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : inq.id)}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: statusBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <StatusIcon style={{ width: 18, height: 18, color: statusColor }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: textPrimary }}>{inq.subject}</span>
                            <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.55rem', borderRadius: 20, background: statusBg, color: statusColor, fontWeight: 600, flexShrink: 0 }}>{statusLabel}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.85rem', color: textMuted, fontSize: '0.78rem', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><User style={{ width: 12, height: 12 }} />{inq.customerName}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock style={{ width: 12, height: 12 }} />{formatDate(inq.createdAt)}</span>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp style={{ width: 18, height: 18, color: textMuted, flexShrink: 0 }} /> : <ChevronDown style={{ width: 18, height: 18, color: textMuted, flexShrink: 0 }} />}
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div style={{ padding: '0 1.25rem 1.25rem', borderTop: `1px solid ${border}` }}>
                          <div style={{ padding: '0.85rem', background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.04)', borderRadius: 10, marginTop: '0.85rem', marginBottom: '0.85rem' }}>
                            <p style={{ color: textPrimary, fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>{inq.message}</p>
                          </div>

                          {isReplied && inq.reply && (
                            <div style={{ padding: '0.85rem', background: isLight ? '#f0fdf4' : 'rgba(22,163,74,0.08)', borderRadius: 10, border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(22,163,74,0.2)'}`, marginBottom: '0.75rem' }}>
                              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', marginBottom: '0.4rem' }}>الرد الأول:</p>
                              <p style={{ color: textPrimary, fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>{inq.reply}</p>
                              <p style={{ color: textMuted, fontSize: '0.7rem', margin: '0.5rem 0 0' }}>{formatDate(inq.repliedAt || '')}</p>
                            </div>
                          )}

                          {inq.status === 'open' && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0070c8', marginBottom: '0.5rem' }}>ردّ مباشر على الاستفسار</p>
                              {(() => {
                                const thread = getChatThread(inq.id);
                                return thread.length > 0 ? (
                                  <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.6rem', padding: '0.5rem', background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                                    {thread.map((msg: ChatMessage) => (
                                      <div key={msg.id} style={{ alignSelf: msg.from === 'agent' ? 'flex-start' : 'flex-end', maxWidth: '85%' }}>
                                        <div style={{ padding: '0.45rem 0.75rem', borderRadius: 10, background: msg.from === 'agent' ? (isLight ? 'rgba(0,112,200,0.12)' : 'rgba(0,176,255,0.15)') : (isLight ? '#f0fdf4' : 'rgba(22,163,74,0.1)'), border: `1px solid ${msg.from === 'agent' ? 'rgba(0,112,200,0.2)' : 'rgba(22,163,74,0.2)'}` }}>
                                          <p style={{ margin: 0, fontSize: '0.82rem', color: textPrimary }}>{msg.text}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : null;
                              })()}
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <textarea value={chatInputs[inq.id] || ''} onChange={e => setChatInputs(prev => ({ ...prev, [inq.id]: e.target.value }))} placeholder="اكتب ردك هنا..." rows={2} style={{ flex: 1, padding: '0.6rem 0.75rem', borderRadius: 10, resize: 'none', border: `1.5px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.2)'}`, background: isLight ? '#f8fafc' : '#080e1c', color: textPrimary, fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem', outline: 'none' }} onFocus={e => (e.target.style.borderColor = '#00B0FF')} onBlur={e => (e.target.style.borderColor = isLight ? '#e5e7eb' : 'rgba(0,176,255,0.2)')} />
                                <button onClick={() => handleSendChatMessage(inq.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.6rem 1rem', borderRadius: 10, background: 'linear-gradient(135deg, #0070c8, #00B0FF)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: '0.875rem', fontWeight: 600, boxShadow: '0 2px 10px rgba(0,112,200,0.25)', alignSelf: 'flex-end' }}>
                                  <Send style={{ width: 14, height: 14 }} /><span>إرسال</span>
                                </button>
                              </div>
                            </div>
                          )}


                          {/* Continuous Chat Thread */}
                          {isReplied && (
                            <div style={{ marginTop: '0.85rem' }}>
                              <button
                                onClick={() => {
                                  setActiveChatId(isChatOpen ? null : inq.id);
                                  setChatRefresh(r => r + 1);
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 10, background: isChatOpen ? 'rgba(22,163,74,0.12)' : (isLight ? '#f0fdf4' : 'rgba(22,163,74,0.08)'), border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(22,163,74,0.2)'}`, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: '0.85rem', fontWeight: 600, color: '#16a34a', transition: 'all 0.15s' }}>
                                <MessageSquare style={{ width: 15, height: 15 }} />
                                <span>تابع المحادثة</span>
                                {!isChatOpen && getChatThread(inq.id).filter(m => m.from === 'customer').length > 0 && (
                                  <span style={{ background: '#16a34a', color: '#fff', borderRadius: 20, fontSize: '0.68rem', padding: '0.05rem 0.4rem', marginRight: '0.25rem' }}>
                                    {getChatThread(inq.id).filter(m => m.from === 'customer').length} رسالة جديدة
                                  </span>
                                )}
                              </button>

                              {isChatOpen && (
                                <div style={{ marginTop: '0.75rem', background: isLight ? '#f8fafc' : 'rgba(0,0,0,0.15)', borderRadius: 12, border: `1px solid ${border}`, overflow: 'hidden' }}>
                                  <div style={{ padding: '0.75rem', maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {chatThread.length === 0 ? (
                                      <p style={{ color: textMuted, fontSize: '0.82rem', textAlign: 'center', padding: '1rem 0', margin: 0 }}>لا توجد رسائل في المحادثة بعد</p>
                                    ) : chatThread.map(msg => (
                                      <div key={msg.id} style={{ display: 'flex', justifyContent: msg.from === 'agent' ? 'flex-end' : 'flex-start' }}>
                                        <div style={{ maxWidth: '80%', padding: '0.55rem 0.8rem', borderRadius: 10, background: msg.from === 'agent' ? 'linear-gradient(135deg,#0070c8,#00B0FF)' : (isLight ? '#fff' : 'rgba(255,255,255,0.08)'), color: msg.from === 'agent' ? '#fff' : textPrimary, fontSize: '0.85rem', lineHeight: 1.5, border: msg.from === 'customer' ? `1px solid ${border}` : 'none' }}>
                                          <div style={{ fontSize: '0.65rem', opacity: 0.7, marginBottom: '0.15rem' }}>{msg.from === 'agent' ? agentName : inq.customerName} · {formatDate(msg.at)}</div>
                                          {msg.text}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div style={{ padding: '0.6rem 0.75rem', borderTop: `1px solid ${border}`, display: 'flex', gap: '0.4rem' }}>
                                    <input
                                      type="text"
                                      value={chatMessage}
                                      onChange={e => setChatMessage(e.target.value)}
                                      onKeyDown={e => e.key === 'Enter' && handleSendChatMessage(inq.id)}
                                      placeholder="اكتب رسالتك..."
                                      style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 8, border: `1.5px solid ${border}`, background: isLight ? '#fff' : '#080e1c', color: textPrimary, fontFamily: 'Tajawal, sans-serif', fontSize: '0.85rem', outline: 'none' }}
                                      onFocus={e => (e.target.style.borderColor = '#00B0FF')}
                                      onBlur={e => (e.target.style.borderColor = border)}
                                    />
                                    <button onClick={() => handleSendChatMessage(inq.id)} style={{ padding: '0.5rem 0.85rem', borderRadius: 8, background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'Tajawal, sans-serif', fontSize: '0.82rem', fontWeight: 600 }}>
                                      <Send style={{ width: 14, height: 14 }} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}
