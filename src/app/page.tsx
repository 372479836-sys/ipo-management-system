'use client';

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-xl font-bold mb-1.5 text-white">IPO 事项管理系统</h1>
        <p className="text-brand-100 text-sm mb-4">Project Yangtze — 港股 IPO 项目进度跟踪与协作平台</p>
        <div className="flex gap-3">
          <Link href="/dashboard" className="inline-flex items-center px-4 py-2 text-xs bg-white text-brand-700 font-semibold rounded-xl hover:bg-brand-50 transition-colors shadow-sm">
            查看 Dashboard
            <svg className="w-3.5 h-3.5 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link href="/gantt" className="inline-flex items-center px-4 py-2 text-xs bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-colors">
            甘特图概览
          </Link>
        </div>
      </div>

      {/* 快速入口 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: '/dashboard', label: 'Dashboard', desc: '项目整体进度概览', icon: '📊' },
          { href: '/workstreams', label: '条线视图', desc: '按条线分类查看所有事项', icon: '📋' },
          { href: '/gantt', label: '甘特图', desc: '时间轴上的进度可视化', icon: '📅' },
          { href: '/admin', label: '管理', desc: 'Excel导入 · 数据管理', icon: '⚙️' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-brand-300 hover:shadow-md transition-all group"
          >
            <div className="text-lg mb-1">{item.icon}</div>
            <h3 className="font-semibold text-sm text-slate-800 group-hover:text-brand-600 transition-colors">{item.label}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
