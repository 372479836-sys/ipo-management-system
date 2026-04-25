'use client';

import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { GanttCell, Task, Workstream } from '@/types/ipo';

interface GanttGridProps {
  workstreams: Workstream[];
  tasks: Task[];
  ganttCells: GanttCell[];
  onAddMarker?: (taskId: string, date: string, type: 'start' | 'ddl' | 'keynode', label: string) => void;
  onRemoveCell?: (cellId: string) => void;
  onMoveCell?: (cellId: string, newDate: string) => void;
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

/* 三层颜色：底色白色 → 条线区间(0.12) → 节点加深(0.45) */
const WS_BAR_COLORS = [
  'rgba(99,102,241,0.12)', 'rgba(139,92,246,0.12)', 'rgba(6,182,212,0.12)', 'rgba(16,185,129,0.12)',
  'rgba(245,158,11,0.12)', 'rgba(244,63,94,0.12)', 'rgba(249,115,22,0.12)', 'rgba(20,184,166,0.12)',
  'rgba(14,165,233,0.12)', 'rgba(168,85,247,0.12)', 'rgba(236,72,153,0.12)', 'rgba(132,204,22,0.12)',
  'rgba(100,116,139,0.12)',
];

const WS_NODE_COLORS = [
  'rgba(99,102,241,0.45)', 'rgba(139,92,246,0.45)', 'rgba(6,182,212,0.45)', 'rgba(16,185,129,0.45)',
  'rgba(245,158,11,0.45)', 'rgba(244,63,94,0.45)', 'rgba(249,115,22,0.45)', 'rgba(20,184,166,0.45)',
  'rgba(14,165,233,0.45)', 'rgba(168,85,247,0.45)', 'rgba(236,72,153,0.45)', 'rgba(132,204,22,0.45)',
  'rgba(100,116,139,0.45)',
];

const WS_BG_COLORS = [
  'rgba(99,102,241,0.06)', 'rgba(139,92,246,0.06)', 'rgba(6,182,212,0.06)', 'rgba(16,185,129,0.06)',
  'rgba(245,158,11,0.06)', 'rgba(244,63,94,0.06)', 'rgba(249,115,22,0.06)', 'rgba(20,184,166,0.06)',
  'rgba(14,165,233,0.06)', 'rgba(168,85,247,0.06)', 'rgba(236,72,153,0.06)', 'rgba(132,204,22,0.06)',
  'rgba(100,116,139,0.06)',
];

const MARKER_STYLES: Record<string, string> = {
  keynode: 'bg-amber-500',
  milestone: 'bg-amber-500',
  event: 'bg-brand-500',
  progress: 'bg-brand-400',
};

const MARKER_LABELS: Record<string, string> = {
  keynode: '⭐ 关键节点',
};

const COL_W = 36;
const WEEK_COL_W = 180;
const MONTH_COL_W = 260;
const ROW_H = 28;
const WEEK_ROW_H = 'auto';
const LEFT_W = 192;

const MONTHS: { label: string; start: string; end: string }[] = [
  { label: '2026年3月', start: '2026-03-30', end: '2026-03-31' },
  { label: '2026年4月', start: '2026-04-01', end: '2026-04-30' },
  { label: '2026年5月', start: '2026-05-01', end: '2026-05-31' },
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

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];
function getDayName(dateStr: string): string {
  return DAY_NAMES[new Date(dateStr).getDay()];
}

/* 右键菜单 */
function CellContextMenu({
  x, y, onAdd, onRemove, onClose, existingCellId, cellInfo,
}: {
  x: number; y: number;
  onAdd: (type: 'start' | 'ddl' | 'keynode', label?: string) => void;
  onRemove?: () => void;
  onClose: () => void;
  existingCellId?: string;
  cellInfo?: { label: string; date: string; type: string; taskTitle: string };
}) {
  const [showKeynodeInput, setShowKeynodeInput] = useState(false);
  const [keynodeLabel, setKeynodeLabel] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showKeynodeInput && inputRef.current) inputRef.current.focus();
  }, [showKeynodeInput]);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[160px]"
        style={{ left: x, top: y }}
      >
        {existingCellId && cellInfo ? (
          <>
            <div className="px-3 py-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${MARKER_STYLES[cellInfo.type] || 'bg-brand-500'}`} />
                <span className="text-[10px] font-medium text-slate-500">{MARKER_LABELS[cellInfo.type] || cellInfo.type}</span>
                <span className="text-[10px] text-slate-400 ml-auto">{cellInfo.date}</span>
              </div>
              {(cellInfo.type === 'ddl' || cellInfo.type === 'keynode') && cellInfo.label ? (
                <div className="text-xs text-slate-700 font-medium">{cellInfo.label}</div>
              ) : (
                <div className="text-xs text-slate-700 font-medium">{cellInfo.taskTitle}</div>
              )}
            </div>
            {onRemove && (
              <button
                onClick={() => { onRemove(); onClose(); }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-red-500" />
                删除标记
              </button>
            )}
          </>
        ) : showKeynodeInput ? (
          <div className="px-3 py-2">
            <div className="text-[10px] text-slate-500 mb-1.5">关键节点备注</div>
            <input
              ref={inputRef}
              type="text"
              value={keynodeLabel}
              onChange={(e) => setKeynodeLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onAdd('keynode', keynodeLabel.trim() || undefined);
                  onClose();
                } else if (e.key === 'Escape') {
                  setShowKeynodeInput(false);
                }
              }}
              placeholder="输入节点说明（可选）"
              className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-brand-400"
            />
            <div className="flex gap-1.5 mt-1.5">
              <button
                onClick={() => { onAdd('keynode', keynodeLabel.trim() || undefined); onClose(); }}
                className="flex-1 text-[10px] bg-amber-500 text-white rounded px-2 py-1 hover:bg-amber-600"
              >
                确定
              </button>
              <button
                onClick={() => setShowKeynodeInput(false)}
                className="flex-1 text-[10px] bg-slate-100 text-slate-600 rounded px-2 py-1 hover:bg-slate-200"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-3 py-1 text-[10px] text-slate-400 border-b border-slate-100">添加关键节点</div>
            <button
              onClick={() => setShowKeynodeInput(true)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center gap-2"
            >
              <span className={`w-2 h-2 rounded-full ${MARKER_STYLES.keynode}`} />
              {MARKER_LABELS.keynode}
            </button>
          </>
        )}
      </div>
    </>
  );
}

export default function GanttGrid({ workstreams, tasks, ganttCells, onAddMarker, onRemoveCell, onMoveCell }: GanttGridProps) {
  const [selectedWeeks, setSelectedWeeks] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; taskId: string; date: string; cellId?: string } | null>(null);
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
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
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
      if (taskCells.length === 0) return;
      // 按日期排序，第一个节点=起点，最后一个=终点
      const sorted = [...taskCells].sort((a, b) => a.date.localeCompare(b.date));
      const firstDate = sorted[0].date;
      const lastDate = sorted[sorted.length - 1].date;
      const si = dateIndexMap[firstDate];
      const ei = dateIndexMap[lastDate];
      if (si !== undefined && ei !== undefined && si <= ei) {
        ranges[t.id] = { startIdx: si, endIdx: ei };
      }
    });
    return ranges;
  }, [tasks, ganttCells, dateIndexMap]);

  const today = new Date().toISOString().slice(0, 10);

  const weekBoundaries = useMemo(() => {
    const boundaries = new Set<string>();
    WEEKS.forEach(w => boundaries.add(w.end));
    return boundaries;
  }, []);

  const handleCellClick = (e: React.MouseEvent, taskId: string, date: string, cellId?: string) => {
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, taskId, date, cellId });
  };

  const handleAddMarker = (type: 'start' | 'ddl' | 'keynode', customLabel?: string) => {
    if (!ctxMenu || !onAddMarker) return;
    onAddMarker(ctxMenu.taskId, ctxMenu.date, type, customLabel || MARKER_LABELS[type]);
  };

  const todayIdx = allDates.indexOf(today);

  const gridWidth = allDates.length * COL_W;
  const totalWidth = LEFT_W + gridWidth;

  /* ---- 渲染表头3行的helper ---- */
  const renderHeaderCols = () => (
    <>
      {/* 周次行 */}
      <div className="flex" style={{ height: 44 }}>
        <div className="flex-shrink-0 bg-slate-50 border-b border-r border-slate-200" style={{ width: LEFT_W, position: 'sticky', left: 0, zIndex: 30, background: '#f8fafc' }}>
          <div className="h-full flex items-center px-3">
            <span className="text-[10px] font-medium text-slate-400">周次</span>
          </div>
        </div>
        <div className="flex">
          {WEEKS.map((w) => {
            const wDates = getDatesInRange(w.start, w.end).filter(d => allDates.includes(d));
            if (wDates.length === 0) return null;
            
            // 汇总该周内的关键节点
            const weekNodes: { type: string; label: string; date: string }[] = [];
            ganttCells.forEach(cell => {
              if (wDates.includes(cell.date) && (cell.type === 'ddl' || cell.type === 'keynode' || cell.type === 'milestone' || cell.type === 'start' || cell.type === 'end')) {
                const task = tasks.find(t => t.id === cell.taskId);
                if (task) {
                  weekNodes.push({ type: cell.type, label: cell.label || '', date: cell.date });
                }
              }
            });
            
            return (
              <div
                key={w.short}
                className="flex-shrink-0 flex flex-col items-center justify-center text-[10px] font-semibold text-brand-600 border-b border-r border-slate-300 bg-brand-50/40 px-1 py-0.5"
                style={{ width: wDates.length * COL_W }}
              >
                <div className="mb-0.5">{w.label}</div>
                {weekNodes.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 justify-center max-w-full">
                    {weekNodes.slice(0, 3).map((node, idx) => (
                      <span
                        key={idx}
                        className="text-[8px] px-1 py-0.5 rounded bg-white/80 text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis"
                        style={{ maxWidth: '60px' }}
                        title={`${node.label} (${node.date})`}
                      >
                        {node.type === 'ddl' ? '⏰' : node.type === 'keynode' || node.type === 'milestone' ? '⭐' : node.type === 'start' ? '▶' : '⏹'}
                        {node.label.slice(0, 4)}
                      </span>
                    ))}
                    {weekNodes.length > 3 && (
                      <span className="text-[8px] px-1 py-0.5 rounded bg-white/80 text-slate-500">
                        +{weekNodes.length - 3}
                      </span>
                    )}
                  </div>
                )}
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

  // 关键节点类型集合
  const NODE_TYPES = new Set(['start', 'end', 'ddl', 'keynode', 'milestone']);

  // 按周/月汇总关键节点
  const getNodesForDateRange = useCallback((taskId: string, startDate: string, endDate: string) => {
    return ganttCells.filter(c =>
      c.taskId === taskId &&
      NODE_TYPES.has(c.type || '') &&
      c.date >= startDate &&
      c.date <= endDate
    ).sort((a, b) => a.date.localeCompare(b.date));
  }, [ganttCells]);

  // 周/月视图的时间段
  const viewPeriods = useMemo(() => {
    if (viewMode === 'week') {
      if (showAll) return WEEKS;
      return Array.from(selectedWeeks).sort((a, b) => a - b).map(i => WEEKS[i]);
    }
    if (viewMode === 'month') return MONTHS;
    return [];
  }, [viewMode, showAll, selectedWeeks]);

  return (
    <div className="space-y-3">
      {/* 视图切换 + 周次筛选器 */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
          {(['day', 'week', 'month'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-[11px] rounded-md font-medium transition-all ${
                viewMode === mode
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {mode === 'day' ? '日' : mode === 'week' ? '周' : '月'}
            </button>
          ))}
        </div>

        {viewMode === 'week' && (
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
        )}
      </div>

      {/* 甘特网格 */}
      {viewMode === 'day' ? (
        // ===== 日视图 =====
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
                  const isCompleted = task.status === 'completed' || (task.status as string) === '已完成';
                  const barColor = isCompleted ? 'rgba(148,163,184,0.12)' : WS_BAR_COLORS[wsIdx % WS_BAR_COLORS.length];
                  const nodeColor = WS_NODE_COLORS[wsIdx % WS_NODE_COLORS.length];
                  return (
                    <div key={task.id} className={`flex ${isCompleted ? 'opacity-50' : ''}`} style={{ height: ROW_H }}>
                      <div className="flex-shrink-0 border-b border-r border-slate-100" style={{ width: LEFT_W, position: 'sticky', left: 0, zIndex: 10, background: isCompleted ? '#f8fafc' : 'white' }}>
                        <div className="h-full flex items-center px-3">
                          <span className={`text-[11px] truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`} title={task.title}>{task.title}</span>
                        </div>
                      </div>
                      <div className="flex relative">
                        {allDates.map((date, dateIdx) => {
                          const cell = cellMap[`${task.id}_${date}`];
                          const isBoundary = weekBoundaries.has(date);
                          const inRange = bar && dateIdx >= bar.startIdx && dateIdx <= bar.endIdx;
                          const isNode = !!cell;
                          // 节点加深，区间内浅色，其余无色
                          const cellBg: string | undefined = isNode ? nodeColor : inRange ? barColor : undefined;
                          return (
                            <div
                              key={`${task.id}_${date}`}
                              className={`flex-shrink-0 border-r ${isBoundary ? 'border-r-slate-300' : 'border-r-slate-50'} border-b border-b-slate-100 flex items-center justify-center relative ${
                                isWeekend(date) ? 'bg-slate-50/50' : ''
                              } ${date === today ? 'bg-brand-50/30' : ''}`}
                              style={{
                                width: COL_W,
                                backgroundColor: cellBg,
                              }}
                              onClick={(e) => cell ? handleCellClick(e, task.id, date, cell.id) : handleCellClick(e, task.id, date)}
                              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                              onDrop={(e) => {
                                e.preventDefault();
                                const cellId = e.dataTransfer.getData('text/cell-id');
                                if (cellId && onMoveCell) onMoveCell(cellId, date);
                              }}
                            >
                              {isNode && (
                                <div
                                  draggable={!!onMoveCell}
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('text/cell-id', cell.id);
                                    e.dataTransfer.effectAllowed = 'move';
                                  }}
                                  className="cursor-pointer flex items-center justify-center w-full h-full"
                                  style={{ zIndex: 2 }}
                                  title={cell.label ? `${cell.label} (${cell.date})` : cell.date}
                                >
                                  <span className="text-white text-[8px] font-bold drop-shadow-sm">★</span>
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
      ) : (
        // ===== 周/月视图 =====
        <div className="space-y-3">
          {workstreams.map((ws, wsIdx) => {
            const wsTasks = wsTaskMap[ws.id] || [];
            // 收集该条线下所有关键节点
            const allWsCells = wsTasks.flatMap(t => ganttCells.filter(c => c.taskId === t.id)).sort((a, b) => a.date.localeCompare(b.date));
            if (allWsCells.length === 0) return null;

            // 过滤出有关键节点的任务（周视图展开用）
            const tasksWithNodes = viewMode === 'week' ? wsTasks.filter(t => ganttCells.some(c => c.taskId === t.id)) : [];

            return (
              <div key={ws.id} className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                {/* 条线标题 */}
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${WS_COLORS[wsIdx % WS_COLORS.length]}`} />
                  <span className="text-sm font-semibold text-slate-700">{ws.name}</span>
                  <span className="text-xs text-slate-400 ml-1">{allWsCells.length} 个节点</span>
                </div>

                {viewMode === 'month' ? (
                  /* 月视图：只显示条线级汇总，所有节点平铺 */
                  <div className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {allWsCells.map((cell) => {
                        const task = tasks.find(t => t.id === cell.taskId);
                        return (
                          <span
                            key={cell.id}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-pink-50 text-pink-700 border border-pink-200"
                            title={`${task?.title || ''} - ${cell.date}`}
                          >
                            <span className="font-medium">{cell.date.slice(5)}</span>
                            <span>{cell.label}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* 周视图：按任务展开 */
                  <div className="divide-y divide-slate-100">
                    {tasksWithNodes.map((task) => {
                      const taskCells = ganttCells.filter(c => c.taskId === task.id).sort((a, b) => a.date.localeCompare(b.date));
                      const isCompleted = task.status === 'completed' || (task.status as string) === '已完成';
                      const statusColor = isCompleted ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700';
                      const statusText = isCompleted ? '已完成' : '进行中';

                      return (
                        <div key={task.id} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
                          <div className="flex-shrink-0 w-48">
                            <div className="font-medium text-sm text-slate-700 mb-1">{task.title}</div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${statusColor}`}>
                              {statusText}
                            </span>
                          </div>
                          <div className="flex-1 flex flex-wrap gap-1.5">
                            {taskCells.map((cell) => (
                              <span
                                key={cell.id}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-pink-50 text-pink-700 border border-pink-200"
                                title={cell.date}
                              >
                                <span className="font-medium">{cell.date.slice(5)}</span>
                                <span>{cell.label}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 左键菜单 */}
      {ctxMenu && (() => {
        const cell = ctxMenu.cellId ? ganttCells.find(c => c.id === ctxMenu.cellId) : undefined;
        const task = tasks.find(t => t.id === ctxMenu.taskId);
        const cellInfo = cell ? { label: cell.label || '', date: cell.date, type: cell.type || 'event', taskTitle: task?.title || '' } : undefined;
        return (
          <CellContextMenu
            x={ctxMenu.x}
            y={ctxMenu.y}
            onAdd={handleAddMarker}
            onRemove={ctxMenu.cellId && onRemoveCell ? () => onRemoveCell(ctxMenu.cellId!) : undefined}
            existingCellId={ctxMenu.cellId}
            cellInfo={cellInfo}
            onClose={() => setCtxMenu(null)}
          />
        );
      })()}
    </div>
  );
}
