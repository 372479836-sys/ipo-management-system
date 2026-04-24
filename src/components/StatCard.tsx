'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: number;
  colorClass: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export default function StatCard({ label, value, colorClass, icon, active, onClick }: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border p-3.5 shadow-sm transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-brand-300' : ''
      } ${active ? 'border-brand-400 ring-2 ring-brand-100' : 'border-slate-200'}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-slate-500 font-medium">{label}</span>
        {icon && <span className={colorClass}>{icon}</span>}
      </div>
      <div className={`text-2xl font-bold ${colorClass}`}>
        {value}
      </div>
      {onClick && (
        <div className="text-[10px] text-slate-400 mt-1">点击查看 ↓</div>
      )}
    </div>
  );
}
