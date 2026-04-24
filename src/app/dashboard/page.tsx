'use client';

import React, { useMemo } from 'react';
import { useIpoData } from '@/context/IpoDataContext';
import StatCard from '@/components/StatCard';

export default function DashboardPage() {
  const { data, hasImported } = useIpoData();
  const { workstreams, tasks } = data;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Dashboard</h1>
        {hasImported && (
          <span className="text-[11px] text-green-600 bg-green-50 px-2 py-1 rounded-full">已加载导入数据</span>
        )}
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="总事项" value={stats.total} colorClass="text-slate-800" />
        <StatCard label="已完成" value={stats.completed} colorClass="text-green-600" />
        <StatCard label="进行中" value={stats.inProgress} colorClass="text-blue-600" />
        <StatCard label="卡点" value={stats.blocked} colorClass="text-red-600" />
        <StatCard label="待开始" value={stats.pending} colorClass="text-slate-400" />
      </div>

      {/* 进度条 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">总体进度</h2>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          {stats.total > 0 && (
            <div className="flex h-full">
              <div
                className="bg-green-500 transition-all duration-500"
                style={{ width: `${(stats.completed / stats.total) * 100}%` }}
              />
              <div
                className="bg-blue-500 transition-all duration-500"
                style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}
              />
              <div
                className="bg-red-500 transition-all duration-500"
                style={{ width: `${(stats.blocked / stats.total) * 100}%` }}
              />
            </div>
          )}
        </div>
        <div className="flex gap-4 mt-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />已完成 {Math.round((stats.completed / stats.total) * 100)}%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />进行中 {Math.round((stats.inProgress / stats.total) * 100)}%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />卡点 {Math.round((stats.blocked / stats.total) * 100)}%</span>
        </div>
      </div>

      {/* 各条线统计 */}
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
                <div key={ws.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]}`} />
                      <span className="text-xs font-medium text-slate-700">{ws.name}</span>
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
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
