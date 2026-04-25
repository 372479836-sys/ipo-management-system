'use client';

import React, { useMemo, useState } from 'react';
import { GanttCell, Task, Workstream, STATUS_LABEL, STATUS_COLOR } from '@/types/ipo';

interface WeeklyViewProps {
  workstreams: Workstream[];
  tasks: Task[];
  ganttCells: GanttCell[];
}

interface WeekDef {
  label: string;
  start: string;
  end: string;
}

// 固定周次定义：W1(3/30-4/5) 到 W9(5/25-5/31)
const WEEKS: WeekDef[] = [
  { label: '3.30 周次 (3/30-4/5)', start: '2026-03-30', end: '2026-04-05' },
  { label: '4.06 周次 (4/6-4/12)', start: '2026-04-06', end: '2026-04-12' },
  { label: '4.13 周次 (4/13-4/19)', start: '2026-04-13', end: '2026-04-19' },
  { label: '4.20 周次 (4/20-4/26)', start: '2026-04-20', end: '2026-04-26' },
  { label: '4.27 周次 (4/27-5/3)', start: '2026-04-27', end: '2026-05-03' },
  { label: '5.04 周次 (5/4-5/10)', start: '2026-05-04', end: '2026-05-10' },
  { label: '5.11 周次 (5/11-5/17)', start: '2026-05-11', end: '2026-05-17' },
  { label: '5.18 周次 (5/18-5/24)', start: '2026-05-18', end: '2026-05-24' },
  { label: '5.25 周次 (5/25-5/31)', start: '2026-05-25', end: '2026-05-31' },
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

function inWeek(dateStr: string, week: WeekDef): boolean {
  return dateStr >= week.start && dateStr <= week.end;
}

export default function WeeklyView({ workstreams, tasks, ganttCells }: WeeklyViewProps) {
  const [selectedWeeks, setSelectedWeeks] = useState<Set<number>>(() => new Set([0]));

  const toggleWeek = (i: number) => {
    setSelectedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(i)) {
        if (next.size > 1) next.delete(i); // 至少保留一个
      } else {
        next.add(i);
      }
      return next;
    });
  };

  const selectedWeekDefs = WEEKS.filter((_, i) => selectedWeeks.has(i));

  // 所有选中周的事件
  const weekData = useMemo(() => {
    const weekCells = ganttCells.filter(gc => selectedWeekDefs.some(w => inWeek(gc.date, w)));
    const taskIdsWithEvents = new Set(weekCells.map(gc => gc.taskId));
    const cellsByTask: Record<string, GanttCell[]> = {};
    weekCells.forEach(gc => {
      if (!cellsByTask[gc.taskId]) cellsByTask[gc.taskId] = [];
      cellsByTask[gc.taskId].push(gc);
    });
    return { taskIdsWithEvents, cellsByTask };
  }, [ganttCells, selectedWeekDefs]);

  // 按条线分组
  const wsGroups = useMemo(() => {
    return workstreams.map(ws => {
      const wsTasks = tasks.filter(t => t.workstreamId === ws.id);
      const activeTasks = wsTasks.filter(t => weekData.taskIdsWithEvents.has(t.id));
      return { ws, allTasks: wsTasks, activeTasks };
    }).filter(g => g.activeTasks.length > 0);
  }, [workstreams, tasks, weekData]);

  const totalEvents = Object.values(weekData.cellsByTask).reduce((s, arr) => s + arr.length, 0);

  return (
    <div className="space-y-5">
      {/* 周次选择器 */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-slate-500">选择周次：</span>
        <div className="flex gap-1.5 flex-wrap">
          {WEEKS.map((w, i) => (
            <button
              key={i}
              onClick={() => toggleWeek(i)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                selectedWeeks.has(i)
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              W{i + 1} ({w.label.split(' ')[0]})
            </button>
          ))}
        </div>
      </div>

      {/* 周次概览 */}
      <div className="bg-gradient-to-r from-brand-50 to-violet-50 rounded-xl border border-brand-100 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {selectedWeeks.size === 1 
                ? selectedWeekDefs[0].label
                : `已选 ${selectedWeeks.size} 个周次`}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {wsGroups.length} 个条线有活动 · {totalEvents} 个事件节点
            </p>
          </div>
        </div>
      </div>

      {/* 无数据提示 */}
      {wsGroups.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">本周暂无事件安排</p>
        </div>
      )}

      {/* 按条线展示 */}
      {wsGroups.map(({ ws, activeTasks }, wsIdx) => {
        const colorIdx = workstreams.findIndex(w => w.id === ws.id);
        return (
          <div key={ws.id} className={`rounded-xl border-l-4 ${WS_COLORS[colorIdx % WS_COLORS.length]} border border-slate-200 overflow-hidden`}>
            <div className="px-5 py-3 flex items-center gap-2 bg-white/60">
              <div className={`w-2.5 h-2.5 rounded-full ${WS_DOT_COLORS[colorIdx % WS_DOT_COLORS.length]}`} />
              <h4 className="font-semibold text-slate-800 text-sm">{ws.name}</h4>
              <span className="text-xs text-slate-400 ml-1">({activeTasks.length} 项)</span>
            </div>
            <div className="divide-y divide-slate-100">
              {activeTasks.map(task => {
                const cells = weekData.cellsByTask[task.id] || [];
                return (
                  <div key={task.id} className="px-5 py-3 bg-white hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-800 text-sm">{task.title}</span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLOR[task.status]}`}>
                            {STATUS_LABEL[task.status]}
                          </span>
                        </div>
                        {task.sponsor && (
                          <p className="text-xs text-slate-400">
                            {task.sponsor}{task.lawyer ? ` · ${task.lawyer}` : ''}{task.otherParty ? ` · ${task.otherParty}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                        {cells.sort((a, b) => a.date.localeCompare(b.date)).map(cell => (
                          <span
                            key={cell.id}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ${
                              cell.type === 'milestone'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-brand-100 text-brand-800 border border-brand-200'
                            }`}
                          >
                            <span className="text-[10px] opacity-60">{cell.date.slice(5).replace('-', '/')}</span>
                            {cell.label}
                          </span>
                        ))}
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
  );
}
