'use client';

import React, { useState } from 'react';
import { useIpoData } from '@/context/IpoDataContext';
import GanttGrid from '@/components/GanttGrid';
import WeeklyView from '@/components/WeeklyView';
import ExcelImport from '@/components/ExcelImport';

type ViewTab = 'daily' | 'weekly';

export default function GanttPage() {
  const { data, loading, error, hasImported, addGanttCell, removeGanttCell } = useIpoData();
  const { workstreams, tasks, ganttCells } = data;
  const [activeTab, setActiveTab] = useState<ViewTab>('daily');

  const handleAddMarker = (taskId: string, date: string, type: 'start' | 'ddl' | 'keynode', label: string) => {
    const id = crypto.randomUUID();
    addGanttCell({ id, taskId, date, label, type });
  };

  const handleRemoveCell = (cellId: string) => {
    removeGanttCell(cellId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">甘特图</h1>
        {hasImported && (
          <span className="text-[11px] text-green-600 bg-green-50 px-2 py-1 rounded-full">已加载导入数据</span>
        )}
      </div>

      <ExcelImport />

      {/* Tab 切换 */}
      {!loading && tasks.length > 0 && (
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'daily'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            日视图
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'weekly'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            周次视图
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-500 text-xs">
          <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          正在加载数据...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-xs text-red-700">
          加载失败：{error}
        </div>
      )}

      {!loading && !error && tasks.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-xs">
          暂无数据，请上传 Excel 文件导入
        </div>
      )}

      {!loading && tasks.length > 0 && activeTab === 'daily' && (
        <>
          <GanttGrid
            workstreams={workstreams}
            tasks={tasks}
            ganttCells={ganttCells}
            onAddMarker={handleAddMarker}
            onRemoveCell={handleRemoveCell}
          />
          <div className="text-[11px] text-slate-400 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
            <span className="inline-flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500" /> 开始</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500" /> DDL</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> 关键节点</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-brand-500" /> 事件</span>
              <span className="text-slate-300">|</span>
              右键单元格可标注节点 · 点击标注可删除
            </span>
          </div>
        </>
      )}

      {!loading && tasks.length > 0 && activeTab === 'weekly' && (
        <WeeklyView
          workstreams={workstreams}
          tasks={tasks}
          ganttCells={ganttCells}
        />
      )}
    </div>
  );
}
