import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, LogIn, AlertCircle } from 'lucide-react';
import { adminLogin } from '../api';

interface AdminLoginScreenProps {
  onBack: () => void;
  onSuccess: (email: string) => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await adminLogin(email.trim(), password);
      onSuccess(data?.user?.email || email.trim());
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail || err?.message || "Kirishda xatolik. Email yoki parolni tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100%', background: '#0f172a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif", padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <button
          onClick={onBack}
          style={{
            background: '#1e293b', border: '1px solid #334155', borderRadius: '12px',
            padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '24px'
          }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          <span>Orqaga</span>
        </button>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '24px', padding: '36px 32px', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '46px', height: '46px', background: '#047857', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck style={{ width: '26px', height: '26px', color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff', margin: 0 }}>Admin Kirish</h1>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, fontWeight: 600 }}>YaqinXizmat Moderatsiya Portali</p>
            </div>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', padding: '12px 14px', borderRadius: '10px', fontSize: '0.88rem', margin: '20px 0' }}>
              <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Email</label>
              <input
                type="email" required autoComplete="username"
                placeholder="admin@yaqinxizmat.uz"
                value={email} onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Parol</label>
              <input
                type="password" required autoComplete="current-password"
                placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <button
              type="submit" disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', background: loading ? '#334155' : '#047857', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px' }}
            >
              <LogIn style={{ width: '18px', height: '18px' }} />
              <span>{loading ? 'Tekshirilmoqda...' : 'Kirish'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginScreen;
