'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useIpoData } from '@/context/IpoDataContext';

export default function GlobalSearch() {
  const pathname = usePathname();
  const { data } = useIpoData();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Ctrl+K / Cmd+K 快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const results = useMemo(() => {
    if (pathname?.startsWith('/portal')) return [];
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return data.tasks
      .filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.currentProgress.toLowerCase().includes(q) ||
        t.nextStep.toLowerCase().includes(q) ||
        (t.remark || '').toLowerCase().includes(q) ||
        t.sponsor.toLowerCase().includes(q) ||
        t.lawyer.toLowerCase().includes(q)
      )
      .slice(0, 8)
      .map(t => {
        const ws = data.workstreams.find(w => w.id === t.workstreamId);
        return { ...t, wsName: ws?.name || '' };
      });
  }, [query, data, pathname]);

  return (
    <div ref={ref} className="relative">
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:border-slate-300 transition-colors"
        onClick={() => setOpen(true)}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>搜索事项...</span>
        <kbd className="ml-2 text-[10px] bg-white border border-slate-200 rounded px-1 py-0.5">⌘K</kbd>
      </div>

      {open && (
        <div className="absolute top-full mt-1 right-0 w-[400px] bg-white rounded-xl border border-slate-200 shadow-xl z-[60] overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="输入关键词搜索事项、负责人..."
              className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {query.trim() && results.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400">无匹配结果</div>
            )}
            {results.map(t => (
              <div
                key={t.id}
                className="px-3 py-2 hover:bg-brand-50/50 cursor-pointer border-b border-slate-50 last:border-0"
                onClick={() => { setOpen(false); setQuery(''); }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{t.wsName}</span>
                  <span className="text-xs font-medium text-slate-800 truncate">{t.title}</span>
                </div>
                {t.currentProgress && (
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">{t.currentProgress}</div>
                )}
              </div>
            ))}
            {!query.trim() && (
              <div className="p-4 text-center text-xs text-slate-400">输入关键词开始搜索</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
