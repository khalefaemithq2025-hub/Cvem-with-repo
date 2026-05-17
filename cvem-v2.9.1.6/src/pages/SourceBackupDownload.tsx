import { useEffect } from 'react';

export default function SourceBackupDownload() {
  useEffect(() => {
    window.location.replace('/cvem-v2.9.1.4.zip');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-cyan-100" dir="rtl">
      <div className="text-center">
        <p className="text-lg font-bold">جارٍ تنزيل ملف CVEM v2.9.1.4...</p>
        <a className="text-cyan-300 underline text-sm" href="/cvem-v2.9.1.4.zip">
          إذا لم يبدأ التنزيل، اضغط هنا
        </a>
      </div>
    </div>
  );
}
