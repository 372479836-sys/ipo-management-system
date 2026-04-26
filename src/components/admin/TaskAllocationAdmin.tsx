'use client';

import React from 'react';
import { Task, Workstream } from '@/types/ipo';

const INSTITUTION_GROUPS = {
  sponsor: ['保荐人H', '保荐人C', '保荐人D'],
  lawyer: ['DP', 'FD', 'HSF', 'JT'],
  otherParty: ['KP', 'CIC'],
} as const;

type AllocationField = keyof typeof INSTITUTION_GROUPS;

const FIELD_META: Record<AllocationField, { label: string; hint: string }> = {
  sponsor: { label: '保荐人', hint: '仅保荐人H / C / D' },
  lawyer: { label: '律师/顾问', hint: '仅DP / FD / HSF / JT' },
  otherParty: { label: '其他参与方', hint: '仅KP / CIC' },
};

function parseInstitutionList(value?: string): string[] {
  return (value || '')
    .split(/[、,，/]+/)
    .map((v) => v.trim())
    .filter((v) => v && v !== '无');
}

function joinInstitutionList(values: string[]): string {
  return values.join('、');
}

function AllocationSelector({
  field,
  value,
  onChange,
}: {
  field: AllocationField;
  value?: string;
  onChange: (value: string) => void;
}) {
  const selected = new Set(parseInstitutionList(value));
  const options = INSTITUTION_GROUPS[field];
  const meta = FIELD_META[field];

  const toggle = (institution: string) => {
    const next = new Set(selected);
    if (next.has(institution)) next.delete(institution);
    else next.add(institution);
    onChange(joinInstitutionList(Array.from(next)));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-slate-700">{meta.label}</div>
          <div className="text-[11px] text-slate-400">{meta.hint}</div>
        </div>
        <div className="max-w-[180px] truncate text-right text-[11px] text-slate-500" title={Array.from(selected).join('、') || '未分配'}>
          {selected.size > 0 ? Array.from(selected).join('、') : '未分配'}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((institution) => {
          const active = selected.has(institution);
          return (
            <button
              key={`${field}-${institution}`}
              type="button"
              onClick={() => toggle(institution)}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${active ? 'border-brand-300 bg-brand-50 text-brand-700 shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}
              title={`调整${meta.label}分工`}
            >
              {active ? '✓ ' : ''}{institution}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getParties(task: Task): string {
  const groups = [
    task.sponsor ? `保荐人：${task.sponsor}` : '',
    task.lawyer ? `律师/顾问：${task.lawyer}` : '',
    task.otherParty ? `其他：${task.otherParty}` : '',
  ].filter(Boolean);
  return groups.length > 0 ? groups.join(' ｜ ') : '未分配';
}

export default function TaskAllocationAdmin({
  workstreams,
  tasks,
  onUpdateTask,
}: {
  workstreams: Workstream[];
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}) {
  const [selectedWorkstreamId, setSelectedWorkstreamId] = React.useState('');
  const [query, setQuery] = React.useState('');

  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      if (selectedWorkstreamId && task.workstreamId !== selectedWorkstreamId) return false;
      if (query.trim() && !task.title.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [tasks, selectedWorkstreamId, query]);

  const workstreamNameById = React.useMemo(() => {
    return new Map(workstreams.map((ws) => [ws.id, ws.name]));
  }, [workstreams]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">🏷️ 事项机构分工</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            管理员在这里维护事项归属。条线视图和机构门户只读取分工结果；外部机构包括保荐人H均不能调整分工。
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={selectedWorkstreamId}
            onChange={(e) => setSelectedWorkstreamId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-400"
          >
            <option value="">全部条线</option>
            {workstreams.map((ws) => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
          </select>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索事项..."
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <div key={task.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-1 border-b border-slate-100 pb-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-800" title={task.title}>{task.title}</div>
                <div className="mt-1 text-[11px] text-slate-400">{workstreamNameById.get(task.workstreamId) || '未归属条线'}</div>
              </div>
              <div className="text-[11px] text-slate-500 md:max-w-[420px] md:text-right" title={getParties(task)}>
                当前：{getParties(task)}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <AllocationSelector
                field="sponsor"
                value={task.sponsor || ''}
                onChange={(value) => onUpdateTask(task.id, { sponsor: value })}
              />
              <AllocationSelector
                field="lawyer"
                value={task.lawyer || ''}
                onChange={(value) => onUpdateTask(task.id, { lawyer: value })}
              />
              <AllocationSelector
                field="otherParty"
                value={task.otherParty || ''}
                onChange={(value) => onUpdateTask(task.id, { otherParty: value })}
              />
            </div>
          </div>
        ))}
        {filteredTasks.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-400">
            没有匹配的事项
          </div>
        )}
      </div>
    </div>
  );
}
