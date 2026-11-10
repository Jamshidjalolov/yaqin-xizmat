import React, { useState } from 'react';
import { X, LogIn, UserPlus } from 'lucide-react';
import { loginUser, registerUser } from '../api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await loginUser(email.trim(), password);
        onSuccess(email.trim());
        onClose();
      } else {
        if (!fullName.trim()) {
          setError("Iltimos, ismingizni kiriting.");
          setLoading(false);
          return;
        }
        await registerUser(email.trim(), password, fullName.trim(), phone.trim() || undefined);
        await loginUser(email.trim(), password);
        onSuccess(email.trim());
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string'
        ? detail
        : (Array.isArray(detail) && detail[0]?.msg ? detail[0].msg : (err.message || "Xatolik yuz berdi. Parol yoki emailni tekshiring."));
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff' }}>
            {isLogin ? "Tizimga Kirish" : "Ro'yxatdan O'tish"}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>F.I.SH (Ismingiz)</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Ali Valiyev"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Telefon raqam</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Email Addres *</label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Parol *</label>
            <input
              type="password"
              required
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '8px', padding: '12px' }}>
            {isLogin ? <LogIn style={{ width: '18px', height: '18px' }} /> : <UserPlus style={{ width: '18px', height: '18px' }} />}
            <span>{loading ? "Bajarilmoqda..." : (isLogin ? "Kirish" : "Ro'yxatdan O'tish")}</span>
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: '#94a3b8' }}>
          {isLogin ? "Hali hisobingiz yo'qmi? " : "Allaqachon hisobingiz bormi? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? "Ro'yxatdan o'tish" : "Tizimga kirish"}
          </button>
        </div>
      </div>
    </div>
  );
};
