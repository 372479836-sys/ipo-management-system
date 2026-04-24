'use client';

import React, { useMemo, useState } from 'react';
import { GanttCell, Task, Workstream } from '@/types/ipo';

interface GanttGridProps {
  workstreams: Workstream[];
  tasks: Task[];
  ganttCells: GanttCell[];
}

interface WeekDef {
  label: string;
  short: string;
  start: string;
  end: string;
}

const WEEKS: WeekDef[] = [
  { label: 'W1 (3/30-4/5)', short: 'W1', start: '2026-03-30', end: '2026-04-05' },
  { label: 'W2 (4/6-4/12)', short: 'W2', start: '2026-04-06', end: '2026-04-12' },
  { label: 'W3 (4/13-4/19)', short: 'W3', start: '2026-04-13', end: '2026-04-19' },
  { label: 'W4 (4/20-4/26)', short: 'W4', start: '2026-04-20', end: '2026-04-26' },
  { label: 'W5 (4/27-5/3)', short: 'W5', start: '2026-04-27', end: '2026-05-03' },
  { label: 'W6 (5/4-5/10)', short: 'W6', start: '2026-05-04', end: '2026-05-10' },
  { label: 'W7 (5/11-5/17)', short: 'W7', start: '2026-05-11', end: '2026-05-17' },
  { label: 'W8 (5/18-5/24)', short: 'W8', start: '2026-05-18', end: '2026-05-24' },
  { label: 'W9 (5/25-5/31)', short: 'W9', start: '2026-05-25', end: '2026-05-31' },
];

const WS_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-cyan-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-orange-500', 'bg-teal-500',
  'bg-sky-500', 'bg-purple-500', 'bg-pink-500', 'bg-lime-500',
  'bg-slate-500',
];

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const d = new Date(start);
  const endDate = new Date(end);
  while (d <= endDate) {
    dates.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function formatShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr);
  return d.getDay() === 0 || d.getDay() === 6;
}

function getWeekIndex(dateStr: string): number {
  return WEEKS.findIndex(w => dateStr >= w.start && dateStr <= w.end);
}

export default function GanttGrid({ workstreams, tasks, ganttCells }: GanttGridProps) {
  // "all" = 全部, 0-8 = 对应周次
  const [weekFilter, setWeekFilter] = useState<'all' | number>('all');

  const { allDates, cellMap, wsTaskMap } = useMemo(() => {
    let dates: string[] = [];

    if (weekFilter !== 'all') {
      // 筛选特定周次
      const w = WEEKS[weekFilter];
      dates = getDatesInRange(w.start, w.end);
    } else if (ganttCells.length > 0) {
      // 全部：从 W1 开始到 W9 结束
      dates = getDatesInRange('2026-03-30', '2026-05-31');
    }

    const map: Record<string, GanttCell> = {};
    ganttCells.forEach((c) => { map[`${c.taskId}_${c.date}`] = c; });
    const wsMap: Record<string, Task[]> = {};
    workstreams.forEach((ws) => { wsMap[ws.id] = []; });
    tasks.forEach((t) => {
      if (!wsMap[t.workstreamId]) wsMap[t.workstreamId] = [];
      wsMap[t.workstreamId].push(t);
    });
    return { allDates: dates, cellMap: map, wsTaskMap: wsMap };
  }, [workstreams, tasks, ganttCells, weekFilter]);

  const today = new Date().toISOString().slice(0, 10);

  // 周次分隔线位置
  const weekBoundaries = useMemo(() => {
    if (weekFilter !== 'all') return new Set<string>();
    const boundaries = new Set<string>();
    WEEKS.forEach(w => boundaries.add(w.start));
    return boundaries;
  }, [weekFilter]);

  return (
    <div className="space-y-4">
      {/* 周次筛选器 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-slate-500">周次筛选：</span>
        <button
          onClick={() => setWeekFilter('all')}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
            weekFilter === 'all'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-brand-600'
          }`}
        >
          全部
        </button>
        {WEEKS.map((w, i) => (
          <button
            key={i}
            onClick={() => setWeekFilter(i)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
              weekFilter === i
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-brand-600'
            }`}
            title={w.label}
          >
            {w.short}
          </button>
        ))}
      </div>

      {/* 甘特网格 */}
      <div className="overflow-auto border border-slate-200 rounded-xl bg-white shadow-sm">
        <div className="flex min-w-max">
          {/* 左侧固定列 */}
          <div className="flex-shrink-0 w-56 border-r border-slate-200 bg-slate-50 sticky left-0 z-10">
            {/* 周次标题行（仅全部模式） */}
            {weekFilter === 'all' && (
              <div className="h-7 flex items-center px-4 border-b border-slate-200 bg-slate-100">
                <span className="text-[10px] font-medium text-slate-400">周次</span>
              </div>
            )}
            <div className="h-12 flex items-center px-4 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">事项</span>
            </div>
            {workstreams.map((ws, idx) => (
              <React.Fragment key={ws.id}>
                <div className="h-8 flex items-center px-4 bg-slate-100 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${WS_COLORS[idx % WS_COLORS.length]}`} />
                    <span className="text-xs font-semibold text-slate-700">{ws.name}</span>
                    <span className="text-xs text-slate-400">({wsTaskMap[ws.id]?.length || 0})</span>
                  </div>
                </div>
                {(wsTaskMap[ws.id] || []).map((task) => (
                  <div key={task.id} className="h-8 flex items-center px-4 border-b border-slate-100 bg-white">
                    <span className="text-xs text-slate-700 truncate" title={task.title}>{task.title}</span>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>

          {/* 右侧甘特网格 */}
          <div className="flex-1 overflow-x-auto">
            {/* 周次标题行（仅全部模式） */}
            {weekFilter === 'all' && (
              <div className="flex h-7 border-b border-slate-200 bg-slate-100">
                {WEEKS.map((w) => {
                  const wDates = allDates.filter(d => d >= w.start && d <= w.end);
                  if (wDates.length === 0) return null;
                  return (
                    <div
                      key={w.short}
                      className="flex-shrink-0 flex items-center justify-center text-[10px] font-semibold text-brand-600 border-r border-slate-300 bg-brand-50/40"
                      style={{ width: `${wDates.length * 2.5}rem` }}
                    >
                      {w.label}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 日期轴 */}
            <div className="flex h-12 border-b border-slate-200 bg-slate-50">
              {allDates.map((date) => {
                const isBoundary = weekBoundaries.has(date);
                return (
                  <div
                    key={date}
                    className={`flex-shrink-0 w-10 flex items-center justify-center text-[10px] border-r ${
                      isBoundary ? 'border-r-slate-300' : 'border-r-slate-100'
                    } ${
                      date === today ? 'bg-brand-100 font-bold text-brand-700' : 'text-slate-500'
                    } ${isWeekend(date) ? 'bg-slate-100/50' : ''}`}
                  >
                    {formatShort(date)}
                  </div>
                );
              })}
            </div>

            {/* 网格行 */}
            {workstreams.map((ws) => (
              <React.Fragment key={ws.id}>
                {/* workstream 占位行 */}
                <div className="flex h-8 bg-slate-100/50 border-b border-slate-200">
                  {allDates.map((date) => {
                    const isBoundary = weekBoundaries.has(date);
                    return (
                      <div key={date} className={`flex-shrink-0 w-10 border-r ${isBoundary ? 'border-r-slate-300' : 'border-r-slate-100'} ${isWeekend(date) ? 'bg-slate-100/30' : ''}`} />
                    );
                  })}
                </div>

                {/* task 行 */}
                {(wsTaskMap[ws.id] || []).map((task) => (
                  <div key={task.id} className="flex h-8 border-b border-slate-100 bg-white">
                    {allDates.map((date) => {
                      const cell = cellMap[`${task.id}_${date}`];
                      const isBoundary = weekBoundaries.has(date);
                      return (
                        <div
                          key={`${task.id}_${date}`}
                          className={`flex-shrink-0 w-10 border-r ${isBoundary ? 'border-r-slate-300' : 'border-r-slate-50'} flex items-center justify-center relative ${
                            isWeekend(date) ? 'bg-slate-50/50' : ''
                          } ${date === today ? 'bg-brand-50/30' : ''}`}
                        >
                          {cell && (
                            <div
                              className={`absolute inset-1 rounded flex items-center justify-center text-white text-[9px] font-medium leading-tight px-0.5 ${
                                cell.type === 'milestone' ? 'bg-amber-500' : 'bg-brand-500'
                              }`}
                              title={`${cell.label} (${cell.date})`}
                            >
                              <span className="truncate">{cell.label}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
