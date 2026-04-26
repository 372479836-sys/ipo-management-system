'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FeedbackStatus, Task, TaskFeedback, TaskStatus, STATUS_LABEL, STATUS_COLOR, ProjectContact } from '@/types/ipo';

interface WorkstreamSectionProps {
  workstreamName: string;
  workstreamId: string;
  tasks: Task[];
  contacts?: ProjectContact[];
  defaultOpen?: boolean;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onAddTask?: (workstreamId: string, title: string) => void;
  onRemoveTask?: (taskId: string) => void;
  onRenameWorkstream?: (wsId: string, newName: string) => void;
  onRemoveWorkstream?: (wsId: string) => void;
  feedbacks?: TaskFeedback[];
  readOnly?: boolean;
  hideAssignee?: boolean;
  onUpdateFeedback?: (feedbackId: string, updates: { status: FeedbackStatus; adminReply?: string; applyToOfficial?: boolean }) => Promise<void>;
}

/* 行内编辑单元格 */
function EditableCell({
  value,
  onSave,
  placeholder = '-',
  className = '',
  multiline = false,
  readOnly = false,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing]);

  if (!editing) {
    return (
      <div
        className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:bg-slate-50'} rounded px-1 py-0.5 min-h-[22px] ${className}`}
        onClick={() => { if (!readOnly) { setDraft(value); setEditing(true); } }}
        title={readOnly ? undefined : '点击编辑'}
      >
        {value || <span className="text-slate-300">{placeholder}</span>}
      </div>
    );
  }

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  if (multiline) {
    return (
      <textarea
        ref={ref as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className="w-full text-xs border border-brand-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400 resize-y min-h-[48px]"
        rows={2}
      />
    );
  }

  return (
    <input
      ref={ref as React.RefObject<HTMLInputElement>}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') { setDraft(value); setEditing(false); }
      }}
      className="w-full text-xs border border-brand-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400"
    />
  );
}

/* 状态下拉选择 */
function normalizePartyName(value: string): string[] {
  const text = (value || '').trim();
  if (!text || text === '无') return [];
  const aliases: Record<string, string[]> = {
    '华泰': ['保荐人H'],
    'HTSC': ['保荐人H'],
    'DB': ['保荐人D'],
    '德银': ['保荐人D'],
    'CMS': ['保荐人C'],
    '招商': ['保荐人C'],
    'DP': ['DP'],
    '达维': ['DP'],
    'FD': ['FD'],
    '方达': ['FD'],
    'HSF': ['HSF'],
    'JT': ['JT'],
    '竞天': ['JT'],
    'KP': ['KP'],
    '毕马威': ['KP'],
    '公司': ['公司'],
  };
  const result = new Set<string>();
  text.split(/[、,，/\s]+/).map(s => s.trim()).filter(Boolean).forEach((part) => {
    result.add(part);
    Object.entries(aliases).forEach(([key, values]) => {
      if (part.includes(key) || key.includes(part)) values.forEach(v => result.add(v));
    });
  });
  return Array.from(result);
}

function getCandidateContactsForTask(task: Task, contacts: ProjectContact[]): ProjectContact[] {
  const institutions = new Set([
    ...normalizePartyName(task.sponsor),
    ...normalizePartyName(task.lawyer),
    ...normalizePartyName(task.otherParty),
  ]);
  if (institutions.size === 0) return contacts;
  const matched = contacts.filter((c) => institutions.has(c.institution) || institutions.has(c.department || ''));
  return matched.length > 0 ? matched : contacts;
}




function feedbackFieldLabel(field: TaskFeedback['targetField']) {
  if (field === 'current_progress') return '当前进度';
  if (field === 'next_step') return '下一步计划';
  if (field === 'remark') return '备注';
  return '甘特节点';
}

function FeedbackDrawer({ task, feedbacks, onUpdateFeedback, onClose }: { task: Task; feedbacks: TaskFeedback[]; onUpdateFeedback?: (feedbackId: string, updates: { status: FeedbackStatus; adminReply?: string; applyToOfficial?: boolean }) => Promise<void>; onClose: () => void }) {
  const [reply, setReply] = React.useState<Record<string, string>>({});
  const [savingId, setSavingId] = React.useState('');
  const handle = async (feedback: TaskFeedback, status: FeedbackStatus, applyToOfficial = false) => {
    if (!onUpdateFeedback) return;
    setSavingId(feedback.id);
    try { await onUpdateFeedback(feedback.id, { status, adminReply: reply[feedback.id] || '', applyToOfficial }); }
    finally { setSavingId(''); }
  };
  return <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-slate-900">反馈处理</h2><p className="mt-1 text-xs text-slate-500">{task.title}</p></div><button onClick={onClose} className="rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-600">关闭</button></div><div className="mt-4 space-y-3">{feedbacks.length === 0 ? <p className="text-sm text-slate-400">暂无反馈。</p> : feedbacks.map((fb) => <div key={fb.id} className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-amber-700">💬 {feedbackFieldLabel(fb.targetField)} · {fb.status}</span><span className="text-[11px] text-slate-400">{fb.institution} {fb.contactName ? `｜${fb.contactName}` : ''}</span></div><div className="mt-3 grid gap-2 text-xs"><div><span className="font-semibold text-slate-500">原内容：</span><p className="mt-1 whitespace-pre-wrap rounded-lg bg-white p-2 text-slate-600">{fb.originalValue || '-'}</p></div><div><span className="font-semibold text-slate-500">建议：</span><p className="mt-1 whitespace-pre-wrap rounded-lg bg-white p-2 text-slate-700">{fb.suggestedValue || '-'}</p></div>{fb.comment && <div><span className="font-semibold text-slate-500">说明：</span><p className="mt-1 whitespace-pre-wrap rounded-lg bg-white p-2 text-slate-700">{fb.comment}</p></div>}</div><textarea value={reply[fb.id] || fb.adminReply || ''} onChange={(e) => setReply({ ...reply, [fb.id]: e.target.value })} placeholder="处理回复（可选）" className="mt-3 min-h-16 w-full rounded-lg border border-amber-100 bg-white p-2 text-xs text-slate-700" /><div className="mt-3 flex flex-wrap gap-2"><button disabled={savingId === fb.id} onClick={() => handle(fb, 'accepted', true)} className="rounded-lg bg-green-600 px-3 py-1 text-xs text-white disabled:opacity-50">采纳并写入</button><button disabled={savingId === fb.id} onClick={() => handle(fb, 'accepted', false)} className="rounded-lg bg-green-50 px-3 py-1 text-xs text-green-700 disabled:opacity-50">采纳</button><button disabled={savingId === fb.id} onClick={() => handle(fb, 'resolved', false)} className="rounded-lg bg-blue-50 px-3 py-1 text-xs text-blue-700 disabled:opacity-50">标记已处理</button><button disabled={savingId === fb.id} onClick={() => handle(fb, 'rejected', false)} className="rounded-lg bg-red-50 px-3 py-1 text-xs text-red-600 disabled:opacity-50">驳回</button></div></div>)}</div></div>;
}

function AssigneeSelect({
  task,
  contacts,
  onChange,
}: {
  task: Task;
  contacts: ProjectContact[];
  onChange: (updates: Partial<Task>) => void;
}) {
  const candidates = getCandidateContactsForTask(task, contacts);
  const selected = task.assigneeId || '';

  if (contacts.length === 0) {
    return <span className="text-[11px] text-slate-300">未导入通讯录</span>;
  }

  return (
    <select
      value={selected}
      onChange={(e) => {
        const contact = contacts.find((c) => c.id === e.target.value);
        onChange({ assigneeId: contact?.id || '', assignee: contact?.name || '' });
      }}
      className="w-full text-[11px] border border-slate-200 rounded px-1.5 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-400"
      title={selected ? contacts.find(c => c.id === selected)?.email : '选择负责人'}
    >
      <option value="">未指定</option>
      {candidates.length === contacts.length && (
        <option value="" disabled>未匹配机构人员，显示全部</option>
      )}
      {candidates.map((c) => (
        <option key={c.id} value={c.id}>
          {c.isKeyContact ? '★ ' : ''}{c.name} - {c.institution}
        </option>
      ))}
    </select>
  );
}

function StatusSelect({
  value,
  onChange,
}: {
  value: TaskStatus;
  onChange: (v: TaskStatus) => void;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as TaskStatus)}
      className={`text-[11px] font-medium rounded-full px-2 py-0.5 border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-400 ${STATUS_COLOR[value]}`}
    >
      {(Object.keys(STATUS_LABEL) as TaskStatus[]).map(s => (
        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
      ))}
    </select>
  );
}

export default function WorkstreamSection({ 
  workstreamName, 
  workstreamId,
  tasks, 
  contacts = [],
  defaultOpen = true, 
  onUpdateTask,
  onAddTask,
  onRemoveTask,
  onRenameWorkstream,
  onRemoveWorkstream,
  feedbacks = [],
  onUpdateFeedback,
  readOnly = false,
  hideAssignee = false
}: WorkstreamSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => { setOpen(defaultOpen ?? true); }, [defaultOpen]);
  const [addingTask, setAddingTask] = useState(false);
  const [feedbackTaskId, setFeedbackTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingWsName, setEditingWsName] = useState(false);
  const [wsNameDraft, setWsNameDraft] = useState(workstreamName);
  const completed = tasks.filter(t => t.status === 'completed').length;
  const total = tasks.length;

  const handleUpdate = (taskId: string, updates: Partial<Task>) => {
    if (!readOnly && onUpdateTask) onUpdateTask(taskId, updates);
  };

  const handleAddTask = () => {
    if (!readOnly && newTaskTitle.trim() && onAddTask) {
      onAddTask(workstreamId, newTaskTitle.trim());
      setNewTaskTitle('');
      setAddingTask(false);
    }
  };

  const handleRemoveTask = (taskId: string) => {
    if (!readOnly && onRemoveTask && confirm('确认删除此事项？')) {
      onRemoveTask(taskId);
    }
  };

  /* 拼接负责机构小字 */
  const getParties = (t: Task) => {
    const parts = [t.sponsor, t.lawyer, t.otherParty].filter(p => p && p.trim() !== '' && p !== '无');
    return parts.length > 0 ? parts.join(' · ') : '';
  };

  /* 卡点置顶排序 */
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === 'blocked' && b.status !== 'blocked') return -1;
    if (a.status !== 'blocked' && b.status === 'blocked') return 1;
    return 0;
  });

  return (
    <div className="mb-4 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div
        className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 cursor-pointer select-none hover:bg-slate-100/80 transition-colors"
      >
        <div className="flex items-center gap-2" onClick={() => setOpen(!open)}>
          <span className={`text-slate-400 text-[11px] transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>▶</span>
          <div>
            {editingWsName ? (
              <input
                value={wsNameDraft}
                onChange={e => setWsNameDraft(e.target.value)}
                onBlur={() => {
                  setEditingWsName(false);
                  if (!readOnly && wsNameDraft.trim() && wsNameDraft !== workstreamName && onRenameWorkstream) {
                    onRenameWorkstream(workstreamId, wsNameDraft.trim());
                  } else {
                    setWsNameDraft(workstreamName);
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  if (e.key === 'Escape') { setWsNameDraft(workstreamName); setEditingWsName(false); }
                }}
                onClick={e => e.stopPropagation()}
                className="font-semibold text-slate-800 text-[13px] border border-brand-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-400"
                autoFocus
              />
            ) : (
              <h3
                className="font-semibold text-slate-800 text-[13px] hover:text-brand-600"
                onDoubleClick={e => { if (!readOnly && onRenameWorkstream) { e.stopPropagation(); setEditingWsName(true); } }}
                title={readOnly ? undefined : '双击重命名'}
              >
                {workstreamName}
              </h3>
            )}
            <p className="text-[11px] text-slate-500 mt-0.5">{completed}/{total} 项已完成</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
          {(['pending', 'in_progress', 'completed', 'blocked'] as TaskStatus[]).map((s) => {
            const count = tasks.filter(t => t.status === s).length;
            if (count === 0) return null;
            return (
              <span key={s} className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS_COLOR[s]}`}>
                {STATUS_LABEL[s]} {count}
              </span>
            );
          })}
          </div>
          {!readOnly && onRemoveWorkstream && (
            <button
              onClick={(e) => { e.stopPropagation(); if (confirm(`确认删除条线「${workstreamName}」及其所有事项？`)) onRemoveWorkstream(workstreamId); }}
              className="text-red-400 hover:text-red-600 text-xs ml-1"
              title="删除条线"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
      {open && <div className="overflow-x-auto">
        {!readOnly && onAddTask && <div className="px-3 py-2 border-b border-slate-100 flex justify-end">
          {!addingTask ? (
            <button
              onClick={() => setAddingTask(true)}
              className="text-xs px-3 py-1 bg-brand-500 text-white rounded hover:bg-brand-600 transition-colors"
            >
              + 新增事项
            </button>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddTask();
                  if (e.key === 'Escape') { setNewTaskTitle(''); setAddingTask(false); }
                }}
                placeholder="输入事项名称..."
                className="text-xs border border-slate-300 rounded px-2 py-1 w-64 focus:outline-none focus:ring-1 focus:ring-brand-400"
                autoFocus
              />
              <button
                onClick={handleAddTask}
                className="text-xs px-3 py-1 bg-brand-500 text-white rounded hover:bg-brand-600"
              >
                确定
              </button>
              <button
                onClick={() => { setNewTaskTitle(''); setAddingTask(false); }}
                className="text-xs px-3 py-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
              >
                取消
              </button>
            </div>
          )}
        </div>}
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-white">
              <th className="text-left py-2 px-3 text-slate-400 font-medium text-[11px] w-[240px]">事项</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium text-[11px] w-[180px]">当前进度</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium text-[11px] w-[180px]">下一步计划</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium text-[11px] w-[200px]">备注</th>
              {!hideAssignee && <th className="text-left py-2 px-3 text-slate-400 font-medium text-[11px] w-[80px]">负责人</th>}
              <th className="text-center py-2 px-3 text-slate-400 font-medium text-[11px] w-[80px]">状态</th>
              {!readOnly && <th className="text-center py-2 px-3 text-slate-400 font-medium text-[11px] w-[50px]">操作</th>}
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((task) => {
              const parties = getParties(task);
              const isBlocked = task.status === 'blocked';
              const taskFeedbacks = feedbacks.filter(fb => fb.taskId === task.id);
              const openFeedbackCount = taskFeedbacks.filter(fb => fb.status === 'open').length;
              return (
                <tr key={task.id} className={`border-b border-slate-50 hover:bg-brand-50/30 transition-colors align-top ${isBlocked ? 'bg-red-50/40 border-l-2 border-l-red-400' : ''}`}>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      {isBlocked && <span className="text-red-500 text-[10px]" title="卡点">⚠️</span>}
                      <EditableCell
                        value={task.title}
                        onSave={v => handleUpdate(task.id, { title: v })}
                        className="font-medium text-slate-800 text-xs"
                        readOnly={readOnly}
                      />
                    </div>
                    {parties && (
                      <div className="text-[10px] text-slate-400 mt-0.5 px-1">当前分工：{parties}</div>
                    )}
                    {taskFeedbacks.length > 0 && (
                      <button onClick={() => setFeedbackTaskId(task.id)} className="mt-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 hover:bg-amber-100">💬 反馈 {openFeedbackCount}/{taskFeedbacks.length}</button>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <EditableCell
                      value={task.currentProgress}
                      onSave={v => handleUpdate(task.id, { currentProgress: v })}
                      className="text-slate-600 text-xs"
                      multiline
                      readOnly={readOnly}
                    />
                  </td>
                  <td className="py-2 px-3">
                    <EditableCell
                      value={task.nextStep}
                      onSave={v => handleUpdate(task.id, { nextStep: v })}
                      className="text-slate-600 text-xs"
                      multiline
                      readOnly={readOnly}
                    />
                  </td>
                  <td className="py-2 px-3">
                    <EditableCell
                      value={task.remark || task.currentBlocker || ''}
                      onSave={v => handleUpdate(task.id, { remark: v })}
                      className="text-slate-600 text-xs"
                      multiline
                      placeholder="添加备注..."
                      readOnly={readOnly}
                    />
                  </td>
                  {!hideAssignee && <td className="py-2 px-3">
                    <AssigneeSelect
                      task={task}
                      contacts={contacts}
                      onChange={updates => handleUpdate(task.id, updates)}
                    />
                    {task.assignee && !task.assigneeId && (
                      <div className="mt-1 text-[10px] text-amber-600">原：{task.assignee}</div>
                    )}
                  </td>}
                  <td className="py-2 px-3 text-center">
                    {readOnly ? <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLOR[task.status]}`}>{STATUS_LABEL[task.status]}</span> : <StatusSelect
                      value={task.status}
                      onChange={v => handleUpdate(task.id, { status: v })}
                    />}
                  </td>
                  {!readOnly && <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => handleRemoveTask(task.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                      title="删除事项"
                    >
                      🗑️
                    </button>
                  </td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>}
      {feedbackTaskId && (
        <FeedbackDrawer
          task={tasks.find(t => t.id === feedbackTaskId)!}
          feedbacks={feedbacks.filter(fb => fb.taskId === feedbackTaskId)}
          onUpdateFeedback={onUpdateFeedback}
          onClose={() => setFeedbackTaskId(null)}
        />
      )}
    </div>
  );
}
