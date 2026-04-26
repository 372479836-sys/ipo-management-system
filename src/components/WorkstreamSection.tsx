'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus, STATUS_LABEL, STATUS_COLOR, ProjectContact } from '@/types/ipo';

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
}

/* 行内编辑单元格 */
function EditableCell({
  value,
  onSave,
  placeholder = '-',
  className = '',
  multiline = false,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
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
        className={`cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5 min-h-[22px] ${className}`}
        onClick={() => { setDraft(value); setEditing(true); }}
        title="点击编辑"
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


const INSTITUTION_GROUPS = {
  sponsor: ['保荐人H', '保荐人C', '保荐人D'],
  lawyer: ['DP', 'FD', 'HSF', 'JT'],
  otherParty: ['KP', 'CIC'],
} as const;

function getInstitutionOptions(contacts: ProjectContact[]): Record<'sponsor' | 'lawyer' | 'otherParty', string[]> {
  const fromContacts = new Set<string>();
  contacts.forEach((c) => {
    if (c.institution && c.institution.trim() && c.institution !== '无') fromContacts.add(c.institution.trim());
  });

  const ensureKnownAndImported = (base: readonly string[]) => {
    const merged = new Set<string>(base);
    base.forEach((institution) => {
      if (fromContacts.has(institution)) merged.add(institution);
    });
    return Array.from(merged);
  };

  return {
    sponsor: ensureKnownAndImported(INSTITUTION_GROUPS.sponsor),
    lawyer: ensureKnownAndImported(INSTITUTION_GROUPS.lawyer),
    otherParty: ensureKnownAndImported(INSTITUTION_GROUPS.otherParty),
  };
}


function parseInstitutionList(value?: string): string[] {
  return (value || '')
    .split(/[、,，/]+/)
    .map((v) => v.trim())
    .filter((v) => v && v !== '无');
}

function InstitutionMultiSelect({
  label,
  value,
  options,
  field,
  onSave,
}: {
  label: string;
  value?: string;
  options: string[];
  field: 'sponsor' | 'lawyer' | 'otherParty';
  onSave: (value: string) => void;
}) {
  const selected = new Set(parseInstitutionList(value));
  const [editing, setEditing] = useState(false);

  const toggle = (institution: string) => {
    const next = new Set(selected);
    if (next.has(institution)) next.delete(institution);
    else next.add(institution);
    onSave(Array.from(next).join('、'));
  };

  const selectedText = selected.size > 0 ? Array.from(selected).join('、') : '未分配';

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-2 py-1.5" data-field={field}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] text-slate-400">{label}</div>
          <div className={`mt-0.5 truncate text-[11px] ${selected.size > 0 ? 'text-slate-700' : 'text-slate-300'}`} title={selectedText}>
            {selectedText}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-500 hover:border-brand-200 hover:text-brand-600"
          title={`展开调整${label}分工`}
        >
          {editing ? '收起' : '调整'}
        </button>
      </div>
      {editing && (
        <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
          {options.map((institution) => {
            const active = selected.has(institution);
            return (
              <button
                key={`${field}-${institution}`}
                type="button"
                onClick={() => toggle(institution)}
                className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${active ? 'bg-brand-50 text-brand-700 border-brand-300 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:border-slate-300'}`}
                title={`点击调整${label}分工`}
              >
                {active ? '✓ ' : ''}{institution}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
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
  onRemoveWorkstream
}: WorkstreamSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => { setOpen(defaultOpen ?? true); }, [defaultOpen]);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingWsName, setEditingWsName] = useState(false);
  const [wsNameDraft, setWsNameDraft] = useState(workstreamName);
  const completed = tasks.filter(t => t.status === 'completed').length;
  const total = tasks.length;

  const handleUpdate = (taskId: string, updates: Partial<Task>) => {
    if (onUpdateTask) onUpdateTask(taskId, updates);
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim() && onAddTask) {
      onAddTask(workstreamId, newTaskTitle.trim());
      setNewTaskTitle('');
      setAddingTask(false);
    }
  };

  const handleRemoveTask = (taskId: string) => {
    if (onRemoveTask && confirm('确认删除此事项？')) {
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
  const institutionOptions = getInstitutionOptions(contacts);

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
                  if (wsNameDraft.trim() && wsNameDraft !== workstreamName && onRenameWorkstream) {
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
                onDoubleClick={e => { e.stopPropagation(); setEditingWsName(true); }}
                title="双击重命名"
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
          {onRemoveWorkstream && (
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
        <div className="px-3 py-2 border-b border-slate-100 flex justify-end">
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
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-white">
              <th className="text-left py-2 px-3 text-slate-400 font-medium text-[11px] w-[180px]">事项</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium text-[11px] w-[260px]">分工</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium text-[11px] w-[180px]">当前进度</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium text-[11px] w-[180px]">下一步计划</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium text-[11px] w-[200px]">备注</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium text-[11px] w-[80px]">负责人</th>
              <th className="text-center py-2 px-3 text-slate-400 font-medium text-[11px] w-[80px]">状态</th>
              <th className="text-center py-2 px-3 text-slate-400 font-medium text-[11px] w-[50px]">操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((task) => {
              const parties = getParties(task);
              const isBlocked = task.status === 'blocked';
              return (
                <tr key={task.id} className={`border-b border-slate-50 hover:bg-brand-50/30 transition-colors align-top ${isBlocked ? 'bg-red-50/40 border-l-2 border-l-red-400' : ''}`}>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      {isBlocked && <span className="text-red-500 text-[10px]" title="卡点">⚠️</span>}
                      <EditableCell
                        value={task.title}
                        onSave={v => handleUpdate(task.id, { title: v })}
                        className="font-medium text-slate-800 text-xs"
                      />
                    </div>
                    {parties && (
                      <div className="text-[10px] text-slate-400 mt-0.5 px-1">当前分工：{parties}</div>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <div className="space-y-1.5">
                    <InstitutionMultiSelect
                      label="保荐人"
                      field="sponsor"
                      value={task.sponsor || ''}
                      options={institutionOptions.sponsor}
                      onSave={(value) => handleUpdate(task.id, { sponsor: value })}
                    />
                    <InstitutionMultiSelect
                      label="律师/顾问"
                      field="lawyer"
                      value={task.lawyer || ''}
                      options={institutionOptions.lawyer}
                      onSave={(value) => handleUpdate(task.id, { lawyer: value })}
                    />
                    <InstitutionMultiSelect
                      label="其他参与方"
                      field="otherParty"
                      value={task.otherParty || ''}
                      options={institutionOptions.otherParty}
                      onSave={(value) => handleUpdate(task.id, { otherParty: value })}
                    />
                    <div className="rounded-md bg-amber-50 px-2 py-1 text-[10px] leading-relaxed text-amber-700">机构访问按分工过滤；点击“调整”后再修改，避免误触。</div>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <EditableCell
                      value={task.currentProgress}
                      onSave={v => handleUpdate(task.id, { currentProgress: v })}
                      className="text-slate-600 text-xs"
                      multiline
                    />
                  </td>
                  <td className="py-2 px-3">
                    <EditableCell
                      value={task.nextStep}
                      onSave={v => handleUpdate(task.id, { nextStep: v })}
                      className="text-slate-600 text-xs"
                      multiline
                    />
                  </td>
                  <td className="py-2 px-3">
                    <EditableCell
                      value={task.remark || task.currentBlocker || ''}
                      onSave={v => handleUpdate(task.id, { remark: v })}
                      className="text-slate-600 text-xs"
                      multiline
                      placeholder="添加备注..."
                    />
                  </td>
                  <td className="py-2 px-3">
                    <AssigneeSelect
                      task={task}
                      contacts={contacts}
                      onChange={updates => handleUpdate(task.id, updates)}
                    />
                    {task.assignee && !task.assigneeId && (
                      <div className="mt-1 text-[10px] text-amber-600">原：{task.assignee}</div>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <StatusSelect
                      value={task.status}
                      onChange={v => handleUpdate(task.id, { status: v })}
                    />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => handleRemoveTask(task.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                      title="删除事项"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>}
    </div>
  );
}
