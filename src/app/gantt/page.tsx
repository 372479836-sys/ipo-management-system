'use client';

import React, { useState } from 'react';
import { useIpoData } from '@/context/IpoDataContext';
import GanttGrid from '@/components/GanttGrid';
import WeeklyView from '@/components/WeeklyView';
import MonthlyView from '@/components/MonthlyView';


type ViewTab = 'daily' | 'weekly';

export default function GanttPage() {
  const { data, loading, error, hasImported, addGanttCell, removeGanttCell, moveGanttCell, isLocalMode, setLocalMode, syncToCloud, pullFromCloud, updateTask } = useIpoData();
  const { workstreams, tasks, ganttCells } = data;
  const [activeTab, setActiveTab] = useState<ViewTab>('daily');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const handleAddMarker = (taskId: string, date: string, type: 'start' | 'ddl' | 'keynode', label: string) => {
    const id = crypto.randomUUID();
    addGanttCell({ id, taskId, date, label, type });
  };

  const handleRemoveCell = (cellId: string) => {
    removeGanttCell(cellId);
  };

  const [autoSyncMsg, setAutoSyncMsg] = useState<string | null>(null);
  const handleAutoComplete = async () => {
    const today = new Date().toISOString().slice(0, 10);
    let count = 0;
    for (const task of tasks) {
      const taskCells = ganttCells.filter(c => c.taskId === task.id);
      const startCell = taskCells.find(c => c.type === 'start');
      const ddlCell = taskCells.find(c => c.type === 'ddl' || c.type === 'end');
      let newStatus: string | null = null;
      if (ddlCell && ddlCell.date < today) {
        newStatus = 'completed';
      } else if (startCell && startCell.date <= today && (!ddlCell || ddlCell.date >= today)) {
        newStatus = 'in_progress';
      } else if (startCell && startCell.date > today) {
        newStatus = 'pending';
      }
      if (newStatus && newStatus !== task.status) {
        await updateTask(task.id, { status: newStatus as any });
        count++;
      }
    }
    setAutoSyncMsg(count > 0 ? `✅ 已自动更新 ${count} 项状态` : '所有事项状态已是最新');
    setTimeout(() => setAutoSyncMsg(null), 3000);
  };

  const handleSyncToCloud = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      await syncToCloud();
      setSyncMsg('✅ 已同步到云端');
    } catch (e: any) {
      setSyncMsg(`❌ ${e.message}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 3000);
    }
  };

  const handlePullFromCloud = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      await pullFromCloud();
      setSyncMsg('✅ 已从云端拉取到本地');
    } catch (e: any) {
      setSyncMsg(`❌ ${e.message}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">甘特图</h1>
        <div className="flex items-center gap-2">
          {/* 云端/本地模式切换 */}
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2 py-1">
            <button
              onClick={() => setLocalMode(false)}
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${
                !isLocalMode ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              ☁️ 云端
            </button>
            <button
              onClick={() => setLocalMode(true)}
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${
                isLocalMode ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              💾 本地
            </button>
          </div>
          {/* 同步按钮 */}
          <button
            onClick={handleSyncToCloud}
            disabled={syncing}
            className="px-2 py-1 text-[10px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-brand-300 hover:text-brand-600 transition-all disabled:opacity-50"
            title="将本地数据推送到云端"
          >
            {syncing ? '⏳' : '⬆️'} 本地数据同步到云端
          </button>
          <button
            onClick={handlePullFromCloud}
            disabled={syncing}
            className="px-2 py-1 text-[10px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-brand-300 hover:text-brand-600 transition-all disabled:opacity-50"
            title="从云端拉取数据到本地"
          >
            {syncing ? '⏳' : '⬇️'} 用云端数据覆盖本地
          </button>
          {syncMsg && (
            <span className={`text-[10px] ${syncMsg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{syncMsg}</span>
          )}
          <button
            onClick={handleAutoComplete}
            className="px-2 py-1 text-[10px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-emerald-300 hover:text-emerald-600 transition-all"
            title="DDL已过的事项自动标为完成"
          >
            🤖 自动识别完成
          </button>
          {autoSyncMsg && (
            <span className={`text-[10px] ${autoSyncMsg.startsWith('✅') ? 'text-green-600' : 'text-slate-500'}`}>{autoSyncMsg}</span>
          )}
          {hasImported && (
            <span className="text-[11px] text-green-600 bg-green-50 px-2 py-1 rounded-full">已加载导入数据</span>
          )}
        </div>
      </div>

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
            onMoveCell={moveGanttCell}
          />
          <div className="text-[11px] text-slate-400 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
            <span className="inline-flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500" /> 开始</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500" /> DDL</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> 关键节点</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-brand-500" /> 事件</span>
              <span className="text-slate-300">|</span>
              右键单元格可标注节点 · 点击标注可删除 · 拖拽标注可调整日期
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
