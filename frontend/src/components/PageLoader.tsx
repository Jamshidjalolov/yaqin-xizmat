import React from 'react';

interface PageLoaderProps {
  text?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ text = "Sahifa yuklanmoqda..." }) => {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '55vh', padding: '60px 20px',
      width: '100%'
    }}>
      {/* Visual glowing spinner */}
      <div style={{
        position: 'relative', width: '68px', height: '68px', marginBottom: '24px'
      }}>
        {/* Glowing pulse */}
        <div style={{
          position: 'absolute', inset: '-6px', borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.18)',
          filter: 'blur(8px)'
        }} />
        
        {/* Outer border spinner */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '4px solid #ecfdf5',
          borderTopColor: '#047857',
          borderRightColor: '#10b981',
          animation: 'spin 0.75s linear infinite'
        }} />

        {/* Center brand circle */}
        <div style={{
          position: 'absolute', inset: '14px', background: 'linear-gradient(135deg, #047857, #065f46)',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ffffff', fontSize: '1.05rem', fontWeight: 900,
          boxShadow: '0 4px 12px rgba(4,120,87,0.35)'
        }}>
          Y
        </div>
      </div>

      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
        {text}
      </div>
      <div style={{ fontSize: '0.82rem', color: '#047857', fontWeight: 600 }}>
        YaqinXizmat platformasi
      </div>
    </div>
  );
};
