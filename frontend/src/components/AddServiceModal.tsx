import React, { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
import { ServiceCreateData } from '../api';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ServiceCreateData) => Promise<void>;
}

export const AddServiceModal: React.FC<AddServiceModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<ServiceCreateData>({
    title: '',
    category: 'Santexnika',
    description: '',
    price: 100000,
    location: 'Toshkent sh.',
    phone: '+998 ',
    provider_name: '',
    image_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.provider_name || !formData.phone) {
      setError("Iltimos, barcha majburiy maydonlarni to'ldiring");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Xizmat qo'shishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff' }}>Yangi Xizmat E'loni Berish</h2>
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
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Xizmat sarlavhasi *</label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="Masalan: Professional Santexnik Xizmatlari"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Kategoriya</label>
              <select
                className="input-field"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Santexnika">Santexnika</option>
                <option value="Elektrik">Elektrik</option>
                <option value="Tozalash">Tozalash</option>
                <option value="Ta'lim">Ta'lim</option>
                <option value="Avto">Avto</option>
                <option value="Maishiy Texnika">Maishiy Texnika</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Narx (so'm)</label>
              <input
                type="number"
                required
                className="input-field"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Ismingiz / Usta nomi *</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="Jasur Usta"
                value={formData.provider_name}
                onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Telefon raqam *</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="+998 90 123 45 67"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Joylashuv / Tuman *</label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="Toshkent sh., Yunusobod r."
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Xizmat haqida batafsil tavsif</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Xizmat turlari, ish tajribasi va qulayliklar haqida yozing..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Rasm havolasi (Ixtiyoriy)</label>
            <input
              type="url"
              className="input-field"
              placeholder="https://..."
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '8px', padding: '12px' }}>
            <PlusCircle style={{ width: '18px', height: '18px' }} />
            <span>{loading ? "Chop etilmoqda..." : "E'lonni Chop Etish"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
