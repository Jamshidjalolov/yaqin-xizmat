import React from 'react';
import { Layers, Wrench, Zap, Sparkles, GraduationCap, Car, Tv } from 'lucide-react';
import { Language, translations } from '../i18n';

interface CategoryFilterProps {
  lang: Language;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ lang, selectedCategory, onSelectCategory }) => {
  const t = translations[lang];

  const categories = [
    { key: 'Barchasi', label: t.all, icon: Layers },
    { key: 'Santexnika', label: t.plumbing, icon: Wrench },
    { key: 'Elektrik', label: t.electric, icon: Zap },
    { key: 'Tozalash', label: t.cleaning, icon: Sparkles },
    { key: 'Ta\'lim', label: t.education, icon: GraduationCap },
    { key: 'Avto', label: t.auto, icon: Car },
    { key: 'Maishiy Texnika', label: t.appliances, icon: Tv },
  ];

  return (
    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px 0 20px 0', marginBottom: '24px', scrollbarWidth: 'none' }}>
      {categories.map((cat) => {
        const IconComponent = cat.icon;
        const isActive = selectedCategory === cat.key;
        return (
          <button
            key={cat.key}
            onClick={() => onSelectCategory(cat.key)}
            className={`category-pill ${isActive ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <IconComponent style={{ width: '16px', height: '16px' }} />
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};
