'use client';

import React, { useMemo, useState, useRef, useCallback } from 'react';
import { GanttCell, Task, Workstream } from '@/types/ipo';

interface GanttGridProps {
  workstreams: Workstream[];
  tasks: Task[];
  ganttCells: GanttCell[];
  onAddMarker?: (taskId: string, date: string, type: 'start' | 'ddl' | 'keynode', label: string) => void;
  onRemoveCell?: (cellId: string) => void;
}

interface WeekDef {
  label: string;
  short: string;
  start: string;
  end: string;
}

const WEEKS: WeekDef[] = [
  { label: '3.30 周次', short: '3.30', start: '2026-03-30', end: '2026-04-05' },
  { label: '4.06 周次', short: '4.06', start: '2026-04-06', end: '2026-04-12' },
  { label: '4.13 周次', short: '4.13', start: '2026-04-13', end: '2026-04-19' },
  { label: '4.20 周次', short: '4.20', start: '2026-04-20', end: '2026-04-26' },
  { label: '4.27 周次', short: '4.27', start: '2026-04-27', end: '2026-05-03' },
  { label: '5.04 周次', short: '5.04', start: '2026-05-04', end: '2026-05-10' },
  { label: '5.11 周次', short: '5.11', start: '2026-05-11', end: '2026-05-17' },
  { label: '5.18 周次', short: '5.18', start: '2026-05-18', end: '2026-05-24' },
  { label: '5.25 周次', short: '5.25', start: '2026-05-25', end: '2026-05-31' },
];

const WS_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-cyan-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-orange-500', 'bg-teal-500',
  'bg-sky-500', 'bg-purple-500', 'bg-pink-500', 'bg-lime-500',
  'bg-slate-500',
];

const MARKER_STYLES: Record<string, string> = {
  start: 'bg-green-500',
  ddl: 'bg-red-500',
  keynode: 'bg-amber-500',
  milestone: 'bg-amber-500',
  event: 'bg-brand-500',
  progress: 'bg-brand-400',
};

const MARKER_LABELS: Record<string, string> = {
  start: '▶ 开始',
  ddl: '⏰ DDL',
  keynode: '⭐ 关键',
};

const COL_W = 36;
const ROW_H = 28;
const LEFT_W = 192;
const HEADER_H = 64; // 周次22 + 日期22 + 周几20

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

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];
function getDayName(dateStr: string): string {
  return DAY_NAMES[new Date(dateStr).getDay()];
}

/* 右键菜单 */
function CellContextMenu({
  x, y, onAdd, onClose,
}: {
  x: number; y: number;
  onAdd: (type: 'start' | 'ddl' | 'keynode') => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[120px]"
        style={{ left: x, top: y }}
      >
        <div className="px-3 py-1 text-[10px] text-slate-400 border-b border-slate-100">标注节点</div>
        {(['start', 'ddl', 'keynode'] as const).map(type => (
          <button
            key={type}
            onClick={() => { onAdd(type); onClose(); }}
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center gap-2"
          >
            <span className={`w-2 h-2 rounded-full ${MARKER_STYLES[type]}`} />
            {MARKER_LABELS[type]}
          </button>
        ))}
      </div>
    </>
  );
}

export default function GanttGrid({ workstreams, tasks, ganttCells, onAddMarker, onRemoveCell }: GanttGridProps) {
  const [selectedWeeks, setSelectedWeeks] = useState<Set<number>>(new Set());
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; taskId: string; date: string } | null>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  const syncScroll = useCallback((source: 'top' | 'main') => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    const from = source === 'top' ? topScrollRef.current : mainScrollRef.current;
    const to = source === 'top' ? mainScrollRef.current : topScrollRef.current;
    if (from && to) to.scrollLeft = from.scrollLeft;
    requestAnimationFrame(() => { isSyncing.current = false; });
  }, []);

  const toggleWeek = (idx: number) => {
    setSelectedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const showAll = selectedWeeks.size === 0;

  const { allDates, dateIndexMap, cellMap, wsTaskMap } = useMemo(() => {
    let dates: string[] = [];
    if (showAll) {
      dates = getDatesInRange('2026-03-30', '2026-05-31');
    } else {
      const selected = Array.from(selectedWeeks).sort((a, b) => a - b);
      selected.forEach(i => {
        const w = WEEKS[i];
        dates.push(...getDatesInRange(w.start, w.end));
      });
    }
    const diMap: Record<string, number> = {};
    dates.forEach((d, i) => { diMap[d] = i; });
    const map: Record<string, GanttCell> = {};
    ganttCells.forEach((c) => { map[`${c.taskId}_${c.date}`] = c; });
    const wsMap: Record<string, Task[]> = {};
    workstreams.forEach((ws) => { wsMap[ws.id] = []; });
    tasks.forEach((t) => {
      if (!wsMap[t.workstreamId]) wsMap[t.workstreamId] = [];
      wsMap[t.workstreamId].push(t);
    });
    return { allDates: dates, dateIndexMap: diMap, cellMap: map, wsTaskMap: wsMap };
  }, [workstreams, tasks, ganttCells, selectedWeeks, showAll]);

  const taskBarRanges = useMemo(() => {
    const ranges: Record<string, { startIdx: number; endIdx: number }> = {};
    tasks.forEach(t => {
      const taskCells = ganttCells.filter(c => c.taskId === t.id);
      const startCell = taskCells.find(c => c.type === 'start');
      const ddlCell = taskCells.find(c => c.type === 'ddl');
      if (startCell && ddlCell) {
        const si = dateIndexMap[startCell.date];
        const ei = dateIndexMap[ddlCell.date];
        if (si !== undefined && ei !== undefined && si < ei) {
          ranges[t.id] = { startIdx: si, endIdx: ei };
        }
      }
    });
    return ranges;
  }, [tasks, ganttCells, dateIndexMap]);

  const today = new Date().toISOString().slice(0, 10);

  const weekBoundaries = useMemo(() => {
    const boundaries = new Set<string>();
    WEEKS.forEach(w => boundaries.add(w.start));
    return boundaries;
  }, []);

  const handleContextMenu = (e: React.MouseEvent, taskId: string, date: string) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, taskId, date });
  };

  const handleAddMarker = (type: 'start' | 'ddl' | 'keynode') => {
    if (!ctxMenu || !onAddMarker) return;
    onAddMarker(ctxMenu.taskId, ctxMenu.date, type, MARKER_LABELS[type]);
  };

  const todayIdx = allDates.indexOf(today);

  const gridWidth = allDates.length * COL_W;
  const totalWidth = LEFT_W + gridWidth;

  /* ---- 渲染表头3行的helper ---- */
  const renderHeaderCols = () => (
    <>
      {/* 周次行 */}
      <div className="flex" style={{ height: 22 }}>
        <div className="flex-shrink-0 bg-slate-50 border-b border-r border-slate-200" style={{ width: LEFT_W, position: 'sticky', left: 0, zIndex: 30, background: '#f8fafc' }}>
          <div className="h-full flex items-center px-3">
            <span className="text-[10px] font-medium text-slate-400">周次</span>
          </div>
        </div>
        <div className="flex">
          {WEEKS.map((w) => {
            const wDates = allDates.filter(d => d >= w.start && d <= w.end);
            if (wDates.length === 0) return null;
            return (
              <div
                key={w.short}
                className="flex-shrink-0 flex items-center justify-center text-[10px] font-semibold text-brand-600 border-b border-r border-slate-300 bg-brand-50/40"
                style={{ width: wDates.length * COL_W }}
              >
                {w.label}
              </div>
            );
          })}
        </div>
      </div>
      {/* 日期行 */}
      <div className="flex" style={{ height: 22 }}>
        <div className="flex-shrink-0 border-b border-r border-slate-200 bg-white" style={{ width: LEFT_W, position: 'sticky', left: 0, zIndex: 30, background: '#fff' }}>
          <div className="h-full flex items-center px-3">
            <span className="text-[10px] font-medium text-slate-400">日期</span>
          </div>
        </div>
        <div className="flex">
          {allDates.map((date) => {
            const isBoundary = weekBoundaries.has(date);
            return (
              <div
                key={date}
                className={`flex-shrink-0 flex items-center justify-center text-[9px] border-b border-r ${
                  isBoundary ? 'border-r-slate-300' : 'border-r-slate-100'
                } ${date === today ? 'bg-brand-100 font-bold text-brand-700' : 'text-slate-500'
                } ${isWeekend(date) ? 'bg-slate-100/50' : 'bg-slate-50'}`}
                style={{ width: COL_W }}
              >
                {formatShort(date)}
              </div>
            );
          })}
        </div>
      </div>
      {/* 周几行 */}
      <div className="flex" style={{ height: 20 }}>
        <div className="flex-shrink-0 border-b border-r border-slate-200 bg-white" style={{ width: LEFT_W, position: 'sticky', left: 0, zIndex: 30, background: '#fff' }}>
          <div className="h-full flex items-center px-3">
            <span className="text-[10px] font-medium text-slate-400">周几</span>
          </div>
        </div>
        <div className="flex">
          {allDates.map((date) => {
            const isBoundary = weekBoundaries.has(date);
            const weekend = isWeekend(date);
            return (
              <div
                key={`day-${date}`}
                className={`flex-shrink-0 flex items-center justify-center text-[9px] border-b border-r ${
                  isBoundary ? 'border-r-slate-300' : 'border-r-slate-100'
                } ${weekend ? 'bg-slate-100/50 text-slate-400' : 'bg-slate-50 text-slate-500'} ${
                  date === today ? 'bg-brand-100 font-bold text-brand-700' : ''
                }`}
                style={{ width: COL_W }}
              >
                {getDayName(date)}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-3">
      {/* 周次筛选器 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-medium text-slate-500">周次筛选：</span>
        <button
          onClick={() => setSelectedWeeks(new Set())}
          className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-all ${
            showAll
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-brand-600'
          }`}
        >
          全部
        </button>
        {WEEKS.map((w, i) => (
          <button
            key={i}
            onClick={() => toggleWeek(i)}
            className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-all ${
              selectedWeeks.has(i)
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
      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        {/* 顶部滚动条 */}
        <div
          ref={topScrollRef}
          className="overflow-x-auto"
          style={{ height: 12 }}
          onScroll={() => syncScroll('top')}
        >
          <div style={{ width: totalWidth, height: 1 }} />
        </div>

        {/* 主体：sticky表头 + 可滚动数据 */}
        <div
          ref={mainScrollRef}
          className="overflow-x-auto overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 260px)' }}
          onScroll={() => syncScroll('main')}
        >
          <div style={{ minWidth: totalWidth }} className="relative">
            {/* 今日红色竖线 */}
            {todayIdx >= 0 && (
              <div
                className="absolute top-0 bottom-0 z-[15] pointer-events-none"
                style={{ left: LEFT_W + todayIdx * COL_W + COL_W / 2 - 1, width: 2, background: 'rgba(239,68,68,0.7)' }}
              />
            )}
            {/* 表头 sticky */}
            <div className="sticky top-0 z-20 bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {renderHeaderCols()}
            </div>

            {/* 数据行 */}
            {workstreams.map((ws, wsIdx) => (
              <React.Fragment key={ws.id}>
                {/* 条线标题行 */}
                <div className="flex" style={{ height: ROW_H }}>
                  <div className="flex-shrink-0 bg-slate-100 border-b border-r border-slate-200" style={{ width: LEFT_W, position: 'sticky', left: 0, zIndex: 10 }}>
                    <div className="h-full flex items-center px-3 gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${WS_COLORS[wsIdx % WS_COLORS.length]}`} />
                      <span className="text-[11px] font-semibold text-slate-700">{ws.name}</span>
                      <span className="text-[10px] text-slate-400">({wsTaskMap[ws.id]?.length || 0})</span>
                    </div>
                  </div>
                  <div className="flex">
                    {allDates.map((date) => {
                      const isBoundary = weekBoundaries.has(date);
                      return (
                        <div key={date} className={`flex-shrink-0 border-b border-r ${isBoundary ? 'border-r-slate-300' : 'border-r-slate-100'} bg-slate-100/50 ${isWeekend(date) ? 'bg-slate-100/30' : ''}`} style={{ width: COL_W }} />
                      );
                    })}
                  </div>
                </div>

                {/* 任务行 */}
                {(wsTaskMap[ws.id] || []).map((task) => {
                  const bar = taskBarRanges[task.id];
                  return (
                    <div key={task.id} className="flex" style={{ height: ROW_H }}>
                      <div className="flex-shrink-0 bg-white border-b border-r border-slate-100" style={{ width: LEFT_W, position: 'sticky', left: 0, zIndex: 10 }}>
                        <div className="h-full flex items-center px-3">
                          <span className="text-[11px] text-slate-700 truncate" title={task.title}>{task.title}</span>
                        </div>
                      </div>
                      <div className="flex relative">
                        {bar && (
                          <div
                            className="absolute bg-green-200/60 rounded-sm"
                            style={{
                              left: bar.startIdx * COL_W + COL_W / 2,
                              width: (bar.endIdx - bar.startIdx) * COL_W,
                              top: ROW_H / 2 - 3,
                              height: 6,
                              zIndex: 1,
                            }}
                          />
                        )}
                        {allDates.map((date) => {
                          const cell = cellMap[`${task.id}_${date}`];
                          const isBoundary = weekBoundaries.has(date);
                          const cellType = cell?.type || 'event';
                          return (
                            <div
                              key={`${task.id}_${date}`}
                              className={`flex-shrink-0 border-r ${isBoundary ? 'border-r-slate-300' : 'border-r-slate-50'} border-b border-b-slate-100 flex items-center justify-center relative ${
                                isWeekend(date) ? 'bg-slate-50/50' : ''
                              } ${date === today ? 'bg-brand-50/30' : ''}`}
                              style={{ width: COL_W }}
                              onContextMenu={(e) => handleContextMenu(e, task.id, date)}
                            >
                              {cell && (
                                <div
                                  className={`absolute inset-0.5 rounded flex items-center justify-center text-white text-[8px] font-medium leading-tight px-0.5 ${
                                    MARKER_STYLES[cellType] || 'bg-brand-500'
                                  } ${onRemoveCell ? 'cursor-pointer' : ''}`}
                                  style={{ zIndex: 2 }}
                                  title={`${cell.label} (${cell.date})${cellType !== 'event' ? ' [' + cellType + ']' : ''}\n点击删除`}
                                  onClick={() => {
                                    if (onRemoveCell && (cellType === 'start' || cellType === 'ddl' || cellType === 'keynode')) {
                                      onRemoveCell(cell.id);
                                    }
                                  }}
                                >
                                  <span className="truncate">{cell.label}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* 右键菜单 */}
      {ctxMenu && (
        <CellContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onAdd={handleAddMarker}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}
