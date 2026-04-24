'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus, STATUS_LABEL, STATUS_COLOR } from '@/types/ipo';

interface WorkstreamSectionProps {
  workstreamName: string;
  tasks: Task[];
  defaultOpen?: boolean;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
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

export default function WorkstreamSection({ workstreamName, tasks, defaultOpen = true, onUpdateTask }: WorkstreamSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const completed = tasks.filter(t => t.status === 'completed').length;
  const total = tasks.length;

  const handleUpdate = (taskId: string, updates: Partial<Task>) => {
    if (onUpdateTask) onUpdateTask(taskId, updates);
  };

  /* 拼接负责机构小字 */
  const getParties = (t: Task) => {
    const parts = [t.sponsor, t.lawyer, t.otherParty].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : '';
  };

  return (
    <div className="mb-4 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div
        className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 cursor-pointer select-none hover:bg-slate-100/80 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <span className={`text-slate-400 text-[11px] transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>▶</span>
          <div>
            <h3 className="font-semibold text-slate-800 text-[13px]">{workstreamName}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{completed}/{total} 项已完成</p>
          </div>
        </div>
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
      </div>
      {open && <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-white">
              <th className="text-left py-2 px-3 text-slate-400 font-medium text-[11px] w-[180px]">事项</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium text-[11px] w-[180px]">当前进度</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium text-[11px] w-[180px]">下一步计划</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium text-[11px] w-[200px]">备注</th>
              <th className="text-center py-2 px-3 text-slate-400 font-medium text-[11px] w-[80px]">状态</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const parties = getParties(task);
              return (
                <tr key={task.id} className="border-b border-slate-50 hover:bg-brand-50/30 transition-colors align-top">
                  <td className="py-2 px-3">
                    <EditableCell
                      value={task.title}
                      onSave={v => handleUpdate(task.id, { title: v })}
                      className="font-medium text-slate-800 text-xs"
                    />
                    {parties && (
                      <div className="text-[10px] text-slate-400 mt-0.5 px-1">{parties}</div>
                    )}
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
                  <td className="py-2 px-3 text-center">
                    <StatusSelect
                      value={task.status}
                      onChange={v => handleUpdate(task.id, { status: v })}
                    />
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
