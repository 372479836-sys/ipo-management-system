'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: number;
  colorClass: string;
  icon?: React.ReactNode;
}

export default function StatCard({ label, value, colorClass, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-500 font-medium">{label}</span>
        {icon && <span className={colorClass}>{icon}</span>}
      </div>
      <div className={`text-3xl font-bold ${colorClass}`}>
        {value}
      </div>
    </div>
  );
}
