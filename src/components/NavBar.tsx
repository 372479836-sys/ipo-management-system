'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GlobalSearch from './GlobalSearch';
import { useIpoData } from '@/context/IpoDataContext';

const NAV_ITEMS = [
  { href: '/', label: '首页', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/dashboard', label: 'Dashboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href: '/workstreams', label: '条线视图', icon: 'M4 6h16M4 12h16M4 18h16' },
  { href: '/gantt', label: '甘特图', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/admin', label: '管理', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export default function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isLocalMode, setLocalMode, syncToCloud, pullFromCloud } = useIpoData();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const handleSyncToCloud = async () => {
    setSyncing(true); setSyncMsg(null);
    try { await syncToCloud(); setSyncMsg('✅ 已同步到云端'); }
    catch (e: any) { setSyncMsg(`❌ ${e.message}`); }
    finally { setSyncing(false); setTimeout(() => setSyncMsg(null), 3000); }
  };
  const handlePullFromCloud = async () => {
    setSyncing(true); setSyncMsg(null);
    try { await pullFromCloud(); setSyncMsg('✅ 已从云端拉取'); }
    catch (e: any) { setSyncMsg(`❌ ${e.message}`); }
    finally { setSyncing(false); setTimeout(() => setSyncMsg(null), 3000); }
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
        {/* Left: logo + nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-1.5 text-brand-700 font-bold text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">IPO 跟踪</span>
          </Link>
          <nav className="hidden md:flex gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Right: sync buttons + mode toggle + search + project */}
        <div className="flex items-center gap-1.5">
          {/* 云端/本地模式切换 */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 rounded-lg px-1.5 py-0.5">
            <button
              onClick={() => setLocalMode(false)}
              className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-all ${
                !isLocalMode ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="云端模式"
            >
              ☁️ 云端
            </button>
            <button
              onClick={() => setLocalMode(true)}
              className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-all ${
                isLocalMode ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="本地模式"
            >
              💾 本地
            </button>
          </div>
          {/* 同步按钮 */}
          <button
            onClick={handleSyncToCloud}
            disabled={syncing}
            className="hidden lg:flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-brand-300 hover:text-brand-600 transition-all disabled:opacity-50"
            title="将本地数据推送到云端"
          >
            {syncing ? '⏳' : '⬆️'}
          </button>
          <button
            onClick={handlePullFromCloud}
            disabled={syncing}
            className="hidden lg:flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-brand-300 hover:text-brand-600 transition-all disabled:opacity-50"
            title="从云端拉取数据到本地"
          >
            {syncing ? '⏳' : '⬇️'}
          </button>
          {syncMsg && (
            <span className={`hidden lg:inline text-[10px] ${syncMsg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{syncMsg}</span>
          )}
          <div className="hidden sm:block"><GlobalSearch /></div>
          <span className="text-xs text-slate-400 hidden xl:inline">Project Yangtze</span>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200/60 bg-white/95 backdrop-blur-lg px-4 py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
          <div className="pt-1"><GlobalSearch /></div>
        </div>
      )}
    </header>
  );
}
