'use client';

import React, { useMemo, useState } from 'react';
import { GanttCell, Task, Workstream, STATUS_LABEL, STATUS_COLOR } from '@/types/ipo';

interface MonthlyViewProps {
  workstreams: Workstream[];
  tasks: Task[];
  ganttCells: GanttCell[];
}

interface MonthDef {
  label: string;
  value: string; // YYYY-MM
  start: string;
  end: string;
}

const MONTHS: MonthDef[] = [
  { label: '2026年3月', value: '2026-03', start: '2026-03-30', end: '2026-03-31' },
  { label: '2026年4月', value: '2026-04', start: '2026-04-01', end: '2026-04-30' },
  { label: '2026年5月', value: '2026-05', start: '2026-05-01', end: '2026-05-31' },
];

const WS_COLORS = [
  'border-indigo-400 bg-indigo-50', 'border-violet-400 bg-violet-50',
  'border-cyan-400 bg-cyan-50', 'border-emerald-400 bg-emerald-50',
  'border-amber-400 bg-amber-50', 'border-rose-400 bg-rose-50',
  'border-orange-400 bg-orange-50', 'border-teal-400 bg-teal-50',
  'border-sky-400 bg-sky-50', 'border-purple-400 bg-purple-50',
  'border-pink-400 bg-pink-50', 'border-lime-400 bg-lime-50',
  'border-slate-400 bg-slate-50',
];

const WS_DOT_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-cyan-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-orange-500', 'bg-teal-500',
  'bg-sky-500', 'bg-purple-500', 'bg-pink-500', 'bg-lime-500',
  'bg-slate-500',
];

const TYPE_STYLE: Record<string, string> = {
  start: 'bg-green-100 text-green-800 border-green-200',
  end: 'bg-red-100 text-red-800 border-red-200',
  ddl: 'bg-red-100 text-red-800 border-red-200',
  keynode: 'bg-amber-100 text-amber-800 border-amber-200',
  milestone: 'bg-amber-100 text-amber-800 border-amber-200',
  event: 'bg-brand-100 text-brand-800 border-brand-200',
  progress: 'bg-blue-100 text-blue-800 border-blue-200',
};

const TYPE_LABEL: Record<string, string> = {
  start: '开始',
  end: '结束',
  ddl: 'DDL',
  keynode: '关键',
  milestone: '里程碑',
  event: '事件',
};

function inMonth(dateStr: string, month: MonthDef): boolean {
  return dateStr >= month.start && dateStr <= month.end;
}

export default function MonthlyView({ workstreams, tasks, ganttCells }: MonthlyViewProps) {
  const [selectedMonth, setSelectedMonth] = useState(1); // 默认4月
  const month = MONTHS[selectedMonth];

  const monthData = useMemo(() => {
    const monthCells = ganttCells.filter(gc => inMonth(gc.date, month));
    const taskIdsWithEvents = new Set(monthCells.map(gc => gc.taskId));
    const cellsByTask: Record<string, GanttCell[]> = {};
    monthCells.forEach(gc => {
      if (!cellsByTask[gc.taskId]) cellsByTask[gc.taskId] = [];
      cellsByTask[gc.taskId].push(gc);
    });
    return { taskIdsWithEvents, cellsByTask };
  }, [ganttCells, month]);

  const wsGroups = useMemo(() => {
    return workstreams.map(ws => {
      const wsTasks = tasks.filter(t => t.workstreamId === ws.id);
      const activeTasks = wsTasks.filter(t => monthData.taskIdsWithEvents.has(t.id));
      return { ws, allTasks: wsTasks, activeTasks };
    }).filter(g => g.activeTasks.length > 0);
  }, [workstreams, tasks, monthData]);

  const totalEvents = Object.values(monthData.cellsByTask).reduce((s, arr) => s + arr.length, 0);

  // 按周分组事件
  const weekGroups = useMemo(() => {
    const weeks: { label: string; cells: { task: Task; cell: GanttCell }[] }[] = [];
    // 获取月内所有日期，按周分组
    const allCells: { task: Task; cell: GanttCell }[] = [];
    Object.entries(monthData.cellsByTask).forEach(([taskId, cells]) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      cells.forEach(c => allCells.push({ task, cell: c }));
    });
    allCells.sort((a, b) => a.cell.date.localeCompare(b.cell.date));

    // 按自然周分组
    const grouped: Record<string, { task: Task; cell: GanttCell }[]> = {};
    allCells.forEach(item => {
      const d = new Date(item.cell.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay()); // 周日开始
      const key = weekStart.toISOString().slice(0, 10);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    Object.keys(grouped).sort().forEach(key => {
      const d = new Date(key);
      const endD = new Date(d);
      endD.setDate(d.getDate() + 6);
      weeks.push({
        label: `${d.getMonth() + 1}/${d.getDate()} - ${endD.getMonth() + 1}/${endD.getDate()}`,
        cells: grouped[key],
      });
    });

    return weeks;
  }, [monthData, tasks]);

  return (
    <div className="space-y-5">
      {/* 月份选择器 */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-slate-500">选择月份：</span>
        <div className="flex gap-1.5">
          {MONTHS.map((m, i) => (
            <button
              key={i}
              onClick={() => setSelectedMonth(i)}
              className={`px-4 py-1.5 text-xs rounded-lg font-medium transition-all ${
                i === selectedMonth
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* 月份概览 */}
      <div className="bg-gradient-to-r from-brand-50 to-violet-50 rounded-xl border border-brand-100 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{month.label}</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {wsGroups.length} 个条线有活动 · {totalEvents} 个事件节点 · {weekGroups.length} 个活跃周
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedMonth(Math.max(0, selectedMonth - 1))}
              disabled={selectedMonth === 0}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedMonth(Math.min(MONTHS.length - 1, selectedMonth + 1))}
              disabled={selectedMonth === MONTHS.length - 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 无数据 */}
      {wsGroups.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">本月暂无事件安排</p>
        </div>
      )}

      {/* 按周展示时间线 */}
      {weekGroups.map((wg, wIdx) => (
        <div key={wIdx} className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-semibold text-slate-700">{wg.label}</span>
            <span className="text-xs text-slate-400">({wg.cells.length} 个节点)</span>
          </div>
          <div className="divide-y divide-slate-100">
            {wg.cells.map(({ task, cell }, ci) => {
              const wsIdx = workstreams.findIndex(w => w.id === task.workstreamId);
              const cellType = cell.type || 'event';
              return (
                <div key={ci} className="px-5 py-2.5 bg-white hover:bg-slate-50/50 transition-colors flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 font-mono w-12 flex-shrink-0">
                    {cell.date.slice(5).replace('-', '/')}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${TYPE_STYLE[cellType] || TYPE_STYLE.event}`}>
                    {TYPE_LABEL[cellType] || cellType}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-slate-800">{cell.label}</span>
                    <span className="text-xs text-slate-400 ml-2">— {task.title}</span>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLOR[task.status]}`}>
                    {STATUS_LABEL[task.status]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* 按条线汇总 */}
      {wsGroups.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-600">按条线汇总</h4>
          {wsGroups.map(({ ws, activeTasks }, wsIdx) => {
            const colorIdx = workstreams.findIndex(w => w.id === ws.id);
            return (
              <div key={ws.id} className={`rounded-xl border-l-4 ${WS_COLORS[colorIdx % WS_COLORS.length]} border border-slate-200 overflow-hidden`}>
                <div className="px-5 py-2.5 flex items-center gap-2 bg-white/60">
                  <div className={`w-2.5 h-2.5 rounded-full ${WS_DOT_COLORS[colorIdx % WS_DOT_COLORS.length]}`} />
                  <h4 className="font-semibold text-slate-800 text-sm">{ws.name}</h4>
                  <span className="text-xs text-slate-400 ml-1">({activeTasks.length} 项任务)</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {activeTasks.map(task => {
                    const cells = monthData.cellsByTask[task.id] || [];
                    return (
                      <div key={task.id} className="px-5 py-2.5 bg-white hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-slate-800 text-sm">{task.title}</span>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLOR[task.status]}`}>
                                {STATUS_LABEL[task.status]}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                            {cells.sort((a, b) => a.date.localeCompare(b.date)).map(cell => {
                              const ct = cell.type || 'event';
                              return (
                                <span
                                  key={cell.id}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border ${TYPE_STYLE[ct] || TYPE_STYLE.event}`}
                                >
                                  <span className="text-[10px] opacity-60">{cell.date.slice(5).replace('-', '/')}</span>
                                  {cell.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
