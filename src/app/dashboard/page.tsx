'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useIpoData } from '@/context/IpoDataContext';
import { TaskStatus, STATUS_LABEL, STATUS_COLOR } from '@/types/ipo';
import StatCard from '@/components/StatCard';

type FilterKey = 'completed' | 'in_progress' | 'blocked' | 'pending' | null;

const FILTER_MAP: Record<string, TaskStatus> = {
  completed: 'completed',
  in_progress: 'in_progress',
  blocked: 'blocked',
  pending: 'pending',
};

const FILTER_LABELS: Record<string, string> = {
  completed: '已完成',
  in_progress: '进行中',
  blocked: '卡点',
  pending: '待开始',
};

export default function DashboardPage() {
  const { data, hasImported } = useIpoData();
  const { workstreams, tasks } = data;
  const [activeFilter, setActiveFilter] = useState<FilterKey>(null);

  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    pending: tasks.filter(t => t.status === 'pending').length,
  }), [tasks]);

  const wsStats = useMemo(() => {
    return workstreams.map(ws => ({
      ...ws,
      total: tasks.filter(t => t.workstreamId === ws.id).length,
      completed: tasks.filter(t => t.workstreamId === ws.id && t.status === 'completed').length,
      blocked: tasks.filter(t => t.workstreamId === ws.id && t.status === 'blocked').length,
    }));
  }, [workstreams, tasks]);

  const filteredTasks = useMemo(() => {
    if (!activeFilter) return [];
    const status = FILTER_MAP[activeFilter];
    return tasks.filter(t => t.status === status).map(t => {
      const ws = workstreams.find(w => w.id === t.workstreamId);
      return { ...t, wsName: ws?.name || '' };
    });
  }, [activeFilter, tasks, workstreams]);

  const toggleFilter = (key: FilterKey) => {
    setActiveFilter(prev => prev === key ? null : key);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Dashboard</h1>
        {hasImported && (
          <span className="text-[11px] text-green-600 bg-green-50 px-2 py-1 rounded-full">已加载导入数据</span>
        )}
      </div>

      {/* 概览卡片 — 可点击展开 */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="总事项" value={stats.total} colorClass="text-slate-800" />
        <StatCard label="已完成" value={stats.completed} colorClass="text-green-600"
          active={activeFilter === 'completed'} onClick={() => toggleFilter('completed')} />
        <StatCard label="进行中" value={stats.inProgress} colorClass="text-blue-600"
          active={activeFilter === 'in_progress'} onClick={() => toggleFilter('in_progress')} />
        <StatCard label="卡点" value={stats.blocked} colorClass="text-red-600"
          active={activeFilter === 'blocked'} onClick={() => toggleFilter('blocked')} />
        <StatCard label="待开始" value={stats.pending} colorClass="text-slate-400"
          active={activeFilter === 'pending'} onClick={() => toggleFilter('pending')} />
      </div>

      {/* 展开的事项列表 */}
      {activeFilter && filteredTasks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-[12px] font-semibold text-slate-700">
              {FILTER_LABELS[activeFilter]}事项（{filteredTasks.length}项）
            </h2>
            <button
              onClick={() => setActiveFilter(null)}
              className="text-[11px] text-slate-400 hover:text-slate-600"
            >✕ 收起</button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-2 px-4 text-slate-400 font-medium text-[11px] w-[140px]">条线</th>
                <th className="text-left py-2 px-4 text-slate-400 font-medium text-[11px]">事项</th>
                <th className="text-left py-2 px-4 text-slate-400 font-medium text-[11px] w-[200px]">当前进度</th>
                <th className="text-center py-2 px-4 text-slate-400 font-medium text-[11px] w-[80px]">状态</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(t => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-brand-50/30 transition-colors">
                  <td className="py-2 px-4 text-[11px] text-slate-500">{t.wsName}</td>
                  <td className="py-2 px-4 text-xs font-medium text-slate-800">{t.title}</td>
                  <td className="py-2 px-4 text-[11px] text-slate-500">{t.currentProgress || '-'}</td>
                  <td className="py-2 px-4 text-center">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS_COLOR[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {activeFilter && filteredTasks.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-400">
          暂无{FILTER_LABELS[activeFilter]}事项
        </div>
      )}

      {/* 进度条 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">总体进度</h2>
        <div className="w-full bg-slate-100 rounded-full h-5 overflow-hidden relative">
          {stats.total > 0 && (
            <div className="flex h-full">
              <div className="bg-green-500 transition-all duration-500 flex items-center justify-center" style={{ width: `${(stats.completed / stats.total) * 100}%` }}>
                {stats.completed > 0 && <span className="text-[10px] text-white font-bold">{Math.round((stats.completed / stats.total) * 100)}%</span>}
              </div>
              <div className="bg-blue-500 transition-all duration-500 flex items-center justify-center" style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}>
                {stats.inProgress > 0 && <span className="text-[10px] text-white font-bold">{Math.round((stats.inProgress / stats.total) * 100)}%</span>}
              </div>
              <div className="bg-red-500 transition-all duration-500 flex items-center justify-center" style={{ width: `${(stats.blocked / stats.total) * 100}%` }}>
                {stats.blocked > 0 && <span className="text-[10px] text-white font-bold">{Math.round((stats.blocked / stats.total) * 100)}%</span>}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-4 mt-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />已完成 {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />进行中 {stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />卡点 {stats.total > 0 ? Math.round((stats.blocked / stats.total) * 100) : 0}%</span>
        </div>
      </div>

      {/* 各条线统计 — 可点击跳转 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">各条线事项分布</h2>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {wsStats.map((ws, idx) => {
              const pct = ws.total > 0 ? (ws.completed / ws.total) * 100 : 0;
              const colors = [
                'bg-indigo-500', 'bg-violet-500', 'bg-cyan-500', 'bg-emerald-500',
                'bg-amber-500', 'bg-rose-500', 'bg-orange-500', 'bg-teal-500',
                'bg-sky-500', 'bg-purple-500', 'bg-pink-500', 'bg-lime-500',
                'bg-slate-500',
              ];
              return (
                <Link key={ws.id} href="/workstreams" className="block group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]}`} />
                      <span className="text-xs font-medium text-slate-700 group-hover:text-brand-600 transition-colors">
                        {ws.name}
                      </span>
                      <span className="text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">→ 查看详情</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {ws.completed}/{ws.total}
                      {ws.blocked > 0 && <span className="text-red-500 ml-2">⚠ {ws.blocked}个卡点</span>}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${colors[idx % colors.length]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
