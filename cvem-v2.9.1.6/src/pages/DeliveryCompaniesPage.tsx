import React, { useState, useMemo } from 'react';
import { Truck, MessageSquare, Send, MapPin, Clock, CheckCircle, Search, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useStore } from '../context/StoreContext';
import { deliveryCompanies } from '../data/mockData';

export default function DeliveryCompaniesPage() {
  const { theme } = useTheme();
  const { user, isLoggedIn, showToastMessage } = useStore();
  const isLight = theme === 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [msgCompanyId, setMsgCompanyId] = useState<string | null>(null);
  const [msgText, setMsgText] = useState('');
  const [showRatesId, setShowRatesId] = useState<string | null>(null);

  const cardBg = isLight ? '#fff' : 'rgba(13,21,38,0.95)';
  const cardBorder = isLight ? '#e5e7eb' : 'rgba(0,176,255,0.12)';
  const textPrimary = isLight ? '#0d2a4a' : '#e0f2fe';
  const textMuted = isLight ? '#6b7280' : 'rgba(224,242,254,0.55)';

  // ── منع شركة التوصيل من مراسلة نفسها ─────────────────────────────────
  const handleSendMsg = (company: any) => {
    if (!msgText.trim()) { showToastMessage('يرجى كتابة رسالتك', 'error'); return; }
    // الحارس: لا يمكن لشركة توصيل مراسلة نفسها أو مراسلة شركات أخرى
    if (user?.role === 'delivery') {
      const myDeliveryId = (user as any).deliveryId;
      if (myDeliveryId === company.id) {
        showToastMessage('لا يمكنك مراسلة نفسك', 'error', 3000);
        return;
      }
      showToastMessage('لا يمكنك مراسلة شركة توصيل أخرى', 'error', 3000);
      return;
    }
    // منع التجار من مراسلة شركات التوصيل من هذه الصفحة (لديهم تبويب خاص)
    if (user?.role === 'merchant') {
      showToastMessage('استخدم تبويب شركات التوصيل في لوحة التاجر للمراسلة', 'info', 3000);
      return;
    }
    const key = `delivery_company_messages_${company.id}`;
    let msgs: any[] = [];
    try { msgs = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
    msgs.unshift({
      id: `msg-${Date.now()}`,
      from: user?.role || 'guest',
      senderName: user?.name || 'زائر',
      senderId: user?.id || 'guest',
      text: msgText,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(key, JSON.stringify(msgs));
    setMsgText('');
    setMsgCompanyId(null);
    showToastMessage(`تم إرسال رسالتك إلى ${company.name}`, 'success');
  };

  const filtered = useMemo(() => {
    if (!searchQuery) return deliveryCompanies;
    const q = searchQuery.toLowerCase();
    return deliveryCompanies.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q) ||
      (c.coveredCities || []).some((city: string) => city.includes(searchQuery))
    );
  }, [searchQuery]);

  const totalCities = new Set(deliveryCompanies.flatMap((c: any) => c.coveredCities || [])).size;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="py-14" style={{ background: isLight ? 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0070c8 100%)' : 'linear-gradient(135deg, #020817 0%, #0a1628 50%, #0d2040 100%)', borderBottom: isLight ? 'none' : '1px solid rgba(0,176,255,0.1)' }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
              <Truck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">شركات التوصيل الشريكة</h1>
              <p className="text-white/70 text-sm mt-0.5">Delivery Partners · شركات التوصيل المتعاونة مع المنصة</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 mt-6">
            {[
              { label: 'شركة توصيل', value: deliveryCompanies.length },
              { label: 'مدينة مغطاة', value: totalCities },
              { label: 'شركة نشطة', value: deliveryCompanies.filter((c: any) => c.isActive).length },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-xl px-5 py-3 border border-white/15">
                <span className="text-2xl font-bold text-white">{s.value}</span>
                <span className="text-white/70 text-sm mr-2">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}` }} className="rounded-2xl shadow-sm p-5 mb-8">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="ابحث باسم الشركة أو المدينة..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm"
              style={{ color: isLight ? '#111827' : '#e0f2fe', background: isLight ? '#fff' : '#0d1526', borderColor: isLight ? '#e5e7eb' : 'rgba(0,176,255,0.25)' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted" />
              </button>
            )}
          </div>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filtered.map((company: any) => {
            const isOwnCompany = user?.role === 'delivery' && (user as any).deliveryId === company.id;
            return (
              <div key={company.id} style={{ background: cardBg, border: `1px solid ${cardBorder}` }} className="rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden">
                <div className="p-4 md:p-6 border-b" style={{ background: isLight ? 'linear-gradient(135deg, rgba(13,71,161,0.04), rgba(0,176,255,0.04))' : 'rgba(0,176,255,0.04)', borderColor: cardBorder }}>
                  <div className="flex flex-row items-center gap-4">
                    <div className="w-16 h-16 rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden order-last" style={{ background: isLight ? '#fff' : 'rgba(0,176,255,0.08)', border: `1px solid ${isLight ? '#f3f4f6' : 'rgba(0,176,255,0.15)'}` }}>
                      {company.logo ? <img src={company.logo} alt={company.name} className="w-full h-full object-cover" /> : <Truck className="w-7 h-7 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-center justify-start gap-1.5 flex-wrap">
                        <h3 className="font-bold leading-tight" style={{ color: textPrimary, fontSize: '1rem' }}>{company.name}</h3>
                        {company.isActive && <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
                        {isOwnCompany && <span style={{ fontSize: '0.65rem', background: 'rgba(0,112,200,0.15)', color: '#0070c8', borderRadius: 12, padding: '0.1rem 0.5rem', fontWeight: 700 }}>شركتك</span>}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: textMuted }}>{company.estimatedDays}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {company.description && (
                    <p className="text-sm leading-relaxed mb-4 line-clamp-2" style={{ color: textMuted }}>{company.description}</p>
                  )}

                  <div className="flex items-center gap-4 mb-3 text-sm flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span style={{ color: textMuted }}>{(company.coveredCities || []).length} مدينة</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary" />
                      <span style={{ color: textMuted }}>{company.estimatedDays}</span>
                    </div>
                  </div>

                  {Array.isArray(company.coveredCities) && company.coveredCities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {company.coveredCities.slice(0, 4).map((city: string) => (
                        <span key={city} className="px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs font-medium">
                          {city}
                        </span>
                      ))}
                      {company.coveredCities.length > 4 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: isLight ? '#f3f4f6' : 'rgba(0,176,255,0.1)', color: isLight ? '#4b5563' : 'rgba(224,242,254,0.6)' }}>
                          +{company.coveredCities.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRatesId(company.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-accent-light text-white rounded-xl font-medium text-sm"
                    >
                      <MapPin className="w-4 h-4" />
                      جدول الأسعار
                    </button>
                    <button
                      onClick={() => {
                        if (!isLoggedIn) {
                          showToastMessage('سجّل الدخول أولاً لمراسلة شركات التوصيل', 'info', 3000);
                          return;
                        }
                        if (user?.role === 'delivery') {
                          const myDeliveryId = (user as any).deliveryId;
                          if (myDeliveryId === company.id) {
                            showToastMessage('لا يمكنك مراسلة نفسك', 'error', 3000);
                            return;
                          }
                          showToastMessage('لا يمكنك مراسلة شركة توصيل أخرى', 'error', 3000);
                          return;
                        }
                        if (user?.role === 'merchant') {
                          showToastMessage('استخدم تبويب شركات التوصيل في لوحة التاجر للمراسلة', 'info', 3000);
                          return;
                        }
                        setMsgCompanyId(company.id);
                        setMsgText('');
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border-2 text-sm font-medium"
                      style={{ borderColor: '#0070c8', color: '#0070c8', background: 'rgba(0,112,200,0.05)' }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="hidden sm:inline">مراسلة</span>
                    </button>
                  </div>

                  {msgCompanyId === company.id && (
                    <div className="mt-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
                      <textarea
                        value={msgText}
                        onChange={e => setMsgText(e.target.value)}
                        placeholder={`اكتب رسالتك إلى ${company.name}...`}
                        rows={3}
                        className="w-full p-2.5 rounded-lg border border-gray-200 outline-none resize-none text-sm mb-2"
                        style={{ fontFamily: 'Tajawal, sans-serif', color: isLight ? '#111827' : '#e0f2fe', background: isLight ? '#fff' : '#0d1526', borderColor: isLight ? '#e5e7eb' : 'rgba(0,176,255,0.25)' }}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleSendMsg(company)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-accent text-white rounded-lg text-sm font-medium">
                          <Send className="w-3.5 h-3.5" /><span>إرسال</span>
                        </button>
                        <button onClick={() => setMsgCompanyId(null)} className="px-3 py-2 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-white">إلغاء</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rates modal — re-uses dynamic logic from MerchantDashboard */}
        {showRatesId && (() => {
          const company = deliveryCompanies.find((c: any) => c.id === showRatesId);
          if (!company) return null;
          const cities = company.coveredCities || [];
          const rates = company.rates || {};
          return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'Tajawal, sans-serif' }}>
              <div style={{ background: isLight ? '#fff' : '#0d1526', border: `1px solid ${isLight ? '#dbeafe' : 'rgba(0,176,255,0.2)'}`, borderRadius: 20, padding: '1.5rem', maxWidth: 520, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.35)', maxHeight: '85vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: isLight ? '#0d3a6e' : '#e0f2fe' }}>
                    🚚 جدول أسعار توصيل — {company.name}
                  </div>
                  <button onClick={() => setShowRatesId(null)} style={{ padding: '0.3rem', borderRadius: 8, border: 'none', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)', color: isLight ? '#6b7280' : '#94a3b8', cursor: 'pointer' }}>✕</button>
                </div>
                {cities.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: isLight ? '#6b7280' : '#94a3b8' }}>لا توجد بيانات مدن</div>
                ) : (
                  <div style={{ overflowX: 'auto', borderRadius: 12, border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(0,176,255,0.12)'}` }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: isLight ? '#f0f7ff' : 'rgba(0,176,255,0.08)' }}>
                          <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 700, color: isLight ? '#374151' : '#94a3b8', whiteSpace: 'nowrap' }}>من ↓ \ إلى →</th>
                          {cities.map((city: string) => (
                            <th key={city} style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 700, color: isLight ? '#374151' : '#94a3b8', whiteSpace: 'nowrap' }}>{city}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cities.map((from: string) => (
                          <tr key={from} style={{ borderTop: `1px solid ${isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)'}` }}>
                            <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700, color: isLight ? '#1e293b' : '#e0f2fe', whiteSpace: 'nowrap' }}>{from}</td>
                            {cities.map((to: string) => (
                              <td key={`${from}-${to}`} style={{ padding: '0.55rem 0.75rem', textAlign: 'center', color: isLight ? '#6b7280' : 'rgba(224,242,254,0.7)', fontWeight: 600 }}>
                                {rates[from]?.[to] != null ? `${rates[from][to]} د.ل` : '--'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: isLight ? '#6b7280' : '#94a3b8', textAlign: 'center' }}>
                  تغطي {cities.length} مدينة
                </div>
                <button onClick={() => setShowRatesId(null)} style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg,#0070c8,#00B0FF)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>إغلاق</button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
