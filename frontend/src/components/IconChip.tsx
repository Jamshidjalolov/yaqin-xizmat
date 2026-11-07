import React from 'react';

type Tone = 'emerald' | 'sky' | 'amber' | 'violet' | 'rose' | 'slate';

interface IconChipProps {
  icon: React.ReactNode;
  tone?: Tone;
  size?: 'sm' | 'md';
}

export const IconChip: React.FC<IconChipProps> = ({ icon, tone = 'emerald', size = 'md' }) => (
  <span className={`icon-chip icon-chip-${tone} ${size === 'sm' ? 'icon-chip-sm' : ''}`}>{icon}</span>
);

export default IconChip;
