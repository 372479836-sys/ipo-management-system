'use client';

import React, { useState } from 'react';
import { useIpoData } from '@/context/IpoDataContext';
import WorkstreamSection from '@/components/WorkstreamSection';
import KanbanBoard from '@/components/KanbanBoard';
export default function WorkstreamsPage() {
  const { data, hasImported, updateTask, updateFeedback, addWorkstream, removeWorkstream, renameWorkstream, addTask, removeTask } = useIpoData();
  const { workstreams, tasks, contacts } = data;
  const [assigneeFilter, setAssigneeFilter] = React.useState('');
  const [institutionFilter, setInstitutionFilter] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'list' | 'kanban'>('list');
  const [addingWs, setAddingWs] = useState(false);
  const [newWsName, setNewWsName] = useState('');

  const allAssignees = React.useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => { if (t.assignee) set.add(t.assignee); });
    return Array.from(set).sort();
  }, [tasks]);

  const allInstitutions = React.useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      if (t.sponsor && t.sponsor.trim() !== '' && t.sponsor !== '无') set.add(t.sponsor);
      if (t.lawyer && t.lawyer.trim() !== '' && t.lawyer !== '无') set.add(t.lawyer);
      if (t.otherParty && t.otherParty.trim() !== '' && t.otherParty !== '无') set.add(t.otherParty);
    });
    return Array.from(set).sort();
  }, [tasks]);

  const filteredTasks = React.useMemo(() => {
    let result = tasks;
    if (assigneeFilter) result = result.filter(t => t.assignee === assigneeFilter);
    if (institutionFilter) result = result.filter(t =>
      t.sponsor === institutionFilter || t.lawyer === institutionFilter || t.otherParty === institutionFilter
    );
    return result;
  }, [tasks, assigneeFilter, institutionFilter]);

  const handleAddWorkstream = () => {
    if (newWsName.trim() && addWorkstream) {
      addWorkstream(newWsName.trim());
      setNewWsName('');
      setAddingWs(false);
    }
  };

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
          {allInstitutions.length > 0 && (
            <select
              value={institutionFilter}
              onChange={e => setInstitutionFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-400"
            >
              <option value="">全部机构</option>
              {allInstitutions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          )}
          {(assigneeFilter || institutionFilter) && (
            <button
              onClick={() => { setAssigneeFilter(''); setInstitutionFilter(''); }}
              className="text-[11px] text-slate-500 hover:text-red-500 underline"
            >清除筛选</button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasImported && (
            <span className="text-[11px] text-green-600 bg-green-50 px-2 py-1 rounded-full">已加载导入数据</span>
          )}
          {!addingWs ? (
            <button
              onClick={() => setAddingWs(true)}
              className="text-xs px-3 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
            >
              + 新增条线
            </button>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newWsName}
                onChange={e => setNewWsName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newWsName.trim()) { addWorkstream(newWsName.trim()); setNewWsName(''); setAddingWs(false); }
                  if (e.key === 'Escape') { setNewWsName(''); setAddingWs(false); }
                }}
                placeholder="输入条线名称..."
                className="text-xs border border-slate-300 rounded px-2 py-1 w-48 focus:outline-none focus:ring-1 focus:ring-brand-400"
                autoFocus
              />
              <button
                onClick={() => { if (newWsName.trim()) { addWorkstream(newWsName.trim()); setNewWsName(''); setAddingWs(false); } }}
                className="text-xs px-3 py-1 bg-brand-500 text-white rounded hover:bg-brand-600"
              >确定</button>
              <button
                onClick={() => { setNewWsName(''); setAddingWs(false); }}
                className="text-xs px-3 py-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
              >取消</button>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <KanbanBoard tasks={filteredTasks} workstreams={workstreams} onUpdateTask={updateTask} />
      ) : (
        workstreams
          .map((ws) => {
            const wsTasks = filteredTasks.filter(t => t.workstreamId === ws.id)
              .sort((a, b) => a.id.localeCompare(b.id));
            return { ws, wsTasks };
          })
          .sort((a, b) => {
            // 有筛选条件时，有事项的排前面，空的排后面
            if (institutionFilter || assigneeFilter) {
              if (a.wsTasks.length > 0 && b.wsTasks.length === 0) return -1;
              if (a.wsTasks.length === 0 && b.wsTasks.length > 0) return 1;
            }
            return 0;
          })
          .map(({ ws, wsTasks }) => (
            <WorkstreamSection
              key={ws.id}
              workstreamId={ws.id}
              workstreamName={ws.name}
              tasks={wsTasks}
              contacts={data.contacts}
              onUpdateTask={updateTask}
              onAddTask={addTask}
              onRemoveTask={removeTask}
              onRenameWorkstream={renameWorkstream}
              onRemoveWorkstream={removeWorkstream}
              feedbacks={data.feedbacks || []}
              onUpdateFeedback={updateFeedback}
              defaultOpen={!((institutionFilter || assigneeFilter) && wsTasks.length === 0)}
            />
          ))
      )}
    </div>
  );
}
