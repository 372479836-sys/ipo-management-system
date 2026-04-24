'use client';

import React from 'react';
import { useIpoData } from '@/context/IpoDataContext';
import WorkstreamSection from '@/components/WorkstreamSection';
import KanbanBoard from '@/components/KanbanBoard';
import ExcelImport from '@/components/ExcelImport';
import ExportButtons from '@/components/ExportButtons';

export default function WorkstreamsPage() {
  const { data, hasImported, updateTask } = useIpoData();
  const { workstreams, tasks } = data;
  const [assigneeFilter, setAssigneeFilter] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'list' | 'kanban'>('list');

  const allAssignees = React.useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => { if (t.assignee) set.add(t.assignee); });
    return Array.from(set).sort();
  }, [tasks]);

  const filteredTasks = assigneeFilter
    ? tasks.filter(t => t.assignee === assigneeFilter)
    : tasks;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-800">条线视图</h1>
          {/* 列表/看板切换 */}
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'}`}
            >
              列表
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white text-slate-800 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'}`}
            >
              看板
            </button>
          </div>
          {allAssignees.length > 0 && (
            <select
              value={assigneeFilter}
              onChange={e => setAssigneeFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-400"
            >
              <option value="">全部负责人</option>
              {allAssignees.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          )}
        </div>
        {hasImported && (
          <span className="text-[11px] text-green-600 bg-green-50 px-2 py-1 rounded-full">已加载导入数据</span>
        )}
        <ExportButtons tasks={filteredTasks} workstreams={workstreams} />
      </div>

      <ExcelImport />

      {viewMode === 'kanban' ? (
        <KanbanBoard tasks={filteredTasks} workstreams={workstreams} onUpdateTask={updateTask} />
      ) : (
        workstreams.map((ws) => {
          const wsTasks = filteredTasks.filter(t => t.workstreamId === ws.id)
            .sort((a, b) => a.id.localeCompare(b.id));
          if (wsTasks.length === 0) return null;
          return (
            <WorkstreamSection
              key={ws.id}
              workstreamName={ws.name}
              tasks={wsTasks}
              onUpdateTask={updateTask}
            />
          );
        })
      )}
    </div>
  );
}
