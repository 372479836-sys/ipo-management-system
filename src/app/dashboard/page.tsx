'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useIpoData } from '@/context/IpoDataContext';
import { Task, TaskStatus, STATUS_LABEL, STATUS_COLOR } from '@/types/ipo';
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

function normalizeInstitution(value?: string): string {
  return (value || '').trim();
}

function isValidInstitution(value?: string): boolean {
  const v = normalizeInstitution(value);
  return v !== '' && v !== '无';
}

function taskMatchesInstitution(task: Task, institution: string): boolean {
  if (!institution) return true;
  return [task.sponsor, task.lawyer, task.otherParty]
    .map(normalizeInstitution)
    .includes(institution);
}

export default function DashboardPage() {
  const { data, hasImported } = useIpoData();
  const { workstreams, tasks, ganttCells } = data;
  const [activeFilter, setActiveFilter] = useState<FilterKey>(null);
  const [institutionFilter, setInstitutionFilter] = useState('');

  const allInstitutions = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      if (isValidInstitution(t.sponsor)) set.add(normalizeInstitution(t.sponsor));
      if (isValidInstitution(t.lawyer)) set.add(normalizeInstitution(t.lawyer));
      if (isValidInstitution(t.otherParty)) set.add(normalizeInstitution(t.otherParty));
    });
    return Array.from(set).sort();
  }, [tasks]);

  const scopedTasks = useMemo(() => {
    return tasks.filter(t => taskMatchesInstitution(t, institutionFilter));
  }, [tasks, institutionFilter]);

  const scopedTaskIds = useMemo(() => new Set(scopedTasks.map(t => t.id)), [scopedTasks]);

  const scopedWorkstreams = useMemo(() => {
    if (!institutionFilter) return workstreams;
    const wsIds = new Set(scopedTasks.map(t => t.workstreamId));
    return workstreams.filter(ws => wsIds.has(ws.id));
  }, [workstreams, scopedTasks, institutionFilter]);

  const stats = useMemo(() => ({
    total: scopedTasks.length,
    completed: scopedTasks.filter(t => t.status === 'completed').length,
    inProgress: scopedTasks.filter(t => t.status === 'in_progress').length,
    blocked: scopedTasks.filter(t => t.status === 'blocked').length,
    pending: scopedTasks.filter(t => t.status === 'pending').length,
  }), [scopedTasks]);

  const wsStats = useMemo(() => {
    return scopedWorkstreams.map(ws => ({
      ...ws,
      total: scopedTasks.filter(t => t.workstreamId === ws.id).length,
      completed: scopedTasks.filter(t => t.workstreamId === ws.id && t.status === 'completed').length,
      blocked: scopedTasks.filter(t => t.workstreamId === ws.id && t.status === 'blocked').length,
    }));
  }, [scopedWorkstreams, scopedTasks]);

  // DDL预警：未来7天内的ddl/milestone/keynode
  const ddlWarnings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7 = new Date(today);
    in7.setDate(in7.getDate() + 7);

    const importantTypes = ['ddl', 'milestone', 'keynode'];
    return ganttCells
      .filter(gc => {
        if (!scopedTaskIds.has(gc.taskId)) return false;
        if (!importantTypes.includes(gc.type || '')) return false;
        const d = new Date(gc.date);
        return d >= today && d <= in7;
      })
      .map(gc => {
        const task = tasks.find(t => t.id === gc.taskId);
        const ws = workstreams.find(w => w.id === task?.workstreamId);
        const d = new Date(gc.date);
        const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...gc,
          taskTitle: task?.title || '',
          taskStatus: task?.status || 'pending',
          wsName: ws?.name || '',
          diffDays,
        };
      })
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [ganttCells, tasks, workstreams, scopedTaskIds]);

  const filteredTasks = useMemo(() => {
    if (!activeFilter) return [];
    const status = FILTER_MAP[activeFilter];
    return scopedTasks.filter(t => t.status === status).map(t => {
      const ws = workstreams.find(w => w.id === t.workstreamId);
      return { ...t, wsName: ws?.name || '' };
    });
  }, [activeFilter, scopedTasks, workstreams]);

  const toggleFilter = (key: FilterKey) => {
    setActiveFilter(prev => prev === key ? null : key);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-800">Dashboard</h1>
          {allInstitutions.length > 0 && (
            <select
              value={institutionFilter}
              onChange={e => {
                setInstitutionFilter(e.target.value);
                setActiveFilter(null);
              }}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-400"
            >
              <option value="">全部机构</option>
              {allInstitutions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          )}
          {institutionFilter && (
            <>
              <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-normal text-brand-600">
                {institutionFilter}
              </span>
              <button
                onClick={() => { setInstitutionFilter(''); setActiveFilter(null); }}
                className="text-[11px] text-slate-500 hover:text-red-500 underline"
              >清除筛选</button>
            </>
          )}
        </div>
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

      {/* DDL预警看板 */}
      {ddlWarnings.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
            <span className="text-red-500">⏰</span>
            <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              未来7天 DDL / 里程碑（{ddlWarnings.length}项{institutionFilter ? ` · ${institutionFilter}` : ''}）
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {ddlWarnings.map((w, i) => {
              const urgencyClass = w.diffDays <= 3
                ? 'bg-red-50 border-l-4 border-l-red-400'
                : w.diffDays <= 7
                  ? 'bg-amber-50 border-l-4 border-l-amber-400'
                  : 'bg-slate-50 border-l-4 border-l-slate-300';
              const typeLabel = w.type === 'ddl' ? '截止' : w.type === 'keynode' ? '关键' : '里程碑';
              const typeColor = w.type === 'ddl' ? 'text-red-600 bg-red-100' : w.type === 'keynode' ? 'text-amber-700 bg-amber-100' : 'text-blue-600 bg-blue-100';
              return (
                <div key={`${w.id}-${i}`} className={`px-4 py-3 flex items-center gap-3 ${urgencyClass}`}>
                  <div className="flex-shrink-0 text-center w-14">
                    <div className="text-[10px] text-slate-400">{new Date(w.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</div>
                    <div className={`text-xs font-bold ${w.diffDays <= 3 ? 'text-red-600' : w.diffDays <= 7 ? 'text-amber-600' : 'text-slate-500'}`}>
                      {w.diffDays === 0 ? '今天' : `${w.diffDays}天后`}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeColor}`}>{typeLabel}</span>
                      <span className="text-xs font-medium text-slate-800 truncate">{w.label || w.taskTitle}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{w.wsName} · {w.taskTitle}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLOR[w.taskStatus as TaskStatus] || ''}`}>
                    {STATUS_LABEL[w.taskStatus as TaskStatus] || w.taskStatus}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 各条线统计 — 可点击跳转 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">各条线事项分布{institutionFilter ? ` · ${institutionFilter}` : ''}</h2>
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
