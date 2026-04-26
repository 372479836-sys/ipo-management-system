'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { STATUS_LABEL, STATUS_COLOR, type TaskStatus } from '@/types/ipo';

type GanttCellType = 'milestone' | 'event' | 'progress' | 'start' | 'end' | 'ddl' | 'keynode';
type PortalGanttCell = { id: string; taskId: string; date: string; label?: string; type?: GanttCellType };
type PortalTask = {
  id: string;
  title: string;
  workstreamId: string;
  workstreamName: string;
  sponsor: string;
  lawyer: string;
  otherParty: string;
  currentProgress: string;
  currentBlocker: string;
  nextStep: string;
  remark?: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  status: TaskStatus;
};
type PortalContact = { id: string; name: string; email: string; institution: string; isKeyContact?: boolean };
type PortalWorkstream = { id: string; name: string; sortOrder: number };
type PortalData = { ok: true; readonly?: boolean; canEdit: boolean; institution: string; permission: 'readonly' | 'sponsor_h_edit'; projectName: string; workstreams: PortalWorkstream[]; tasks: PortalTask[]; contacts: PortalContact[]; ganttCells: PortalGanttCell[] };

const GANTT_TYPE_OPTIONS: { value: GanttCellType; label: string }[] = [
  { value: 'keynode', label: '关键节点' },
  { value: 'milestone', label: '里程碑' },
  { value: 'ddl', label: 'DDL' },
  { value: 'event', label: '事件' },
  { value: 'start', label: '开始' },
  { value: 'end', label: '结束' },
];

function groupByWorkstream(tasks: PortalTask[]) {
  const map = new Map<string, PortalTask[]>();
  tasks.forEach((task) => {
    const key = task.workstreamName || '未分类';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(task);
  });
  return Array.from(map.entries());
}

function statusSummary(tasks: PortalTask[]) {
  return tasks.reduce<Record<TaskStatus, number>>((acc, task) => {
    acc[task.status] += 1;
    return acc;
  }, { pending: 0, in_progress: 0, completed: 0, blocked: 0 });
}

function cellsForTask(ganttCells: PortalGanttCell[], taskId: string) {
  return ganttCells.filter((cell) => cell.taskId === taskId).sort((a, b) => a.date.localeCompare(b.date));
}

function GanttCellReadonly({ cell }: { cell: PortalGanttCell }) {
  const label = GANTT_TYPE_OPTIONS.find((item) => item.value === cell.type)?.label || cell.type || '节点';
  return <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">{cell.date} · {label}{cell.label ? `：${cell.label}` : ''}</span>;
}

function GanttCellEditor({ cell, token, onUpdated }: { cell: PortalGanttCell; token: string; onUpdated: (data: PortalData) => void }) {
  const [draft, setDraft] = React.useState({ date: cell.date || '', label: cell.label || '', type: cell.type || 'keynode' as GanttCellType });
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState('');

  React.useEffect(() => setDraft({ date: cell.date || '', label: cell.label || '', type: cell.type || 'keynode' }), [cell]);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/portal/gantt', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, cellId: cell.id, updates: draft }) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || '甘特节点更新失败');
      onUpdated(json);
      setMsg('已保存');
    } catch (err: any) { setMsg(err?.message || '甘特节点更新失败'); }
    finally { setSaving(false); setTimeout(() => setMsg(''), 2500); }
  };

  const remove = async () => {
    if (!window.confirm('确认删除节点？')) return;
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/portal/gantt', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, cellId: cell.id }) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || '删除甘特节点失败');
      onUpdated(json);
    } catch (err: any) { setMsg(err?.message || '删除甘特节点失败'); }
    finally { setSaving(false); setTimeout(() => setMsg(''), 2500); }
  };

  return <div className="grid gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 md:grid-cols-[120px_1fr_110px_auto_auto]">
    <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="rounded-lg border border-indigo-100 bg-white px-2 py-1 text-xs text-slate-700" />
    <input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="关键节点说明" className="rounded-lg border border-indigo-100 bg-white px-2 py-1 text-xs text-slate-700" />
    <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as GanttCellType })} className="rounded-lg border border-indigo-100 bg-white px-2 py-1 text-xs text-slate-700">
      {GANTT_TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
    </select>
    <button onClick={save} disabled={saving} className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50">{saving ? '保存中' : '保存节点'}</button>
    <button onClick={remove} disabled={saving} className="rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-600 disabled:opacity-50">删除节点</button>
    {msg && <div className="text-xs text-indigo-600 md:col-span-5">{msg}</div>}
  </div>;
}

function NewGanttCellForm({ taskId, token, onUpdated }: { taskId: string; token: string; onUpdated: (data: PortalData) => void }) {
  const [draft, setDraft] = React.useState({ date: '', label: '', type: 'keynode' as GanttCellType });
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/portal/gantt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, taskId, updates: draft }) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || '新增甘特节点失败');
      onUpdated(json);
      setDraft({ date: '', label: '', type: 'keynode' });
      setMsg('已新增节点');
    } catch (err: any) { setMsg(err?.message || '新增甘特节点失败'); }
    finally { setSaving(false); setTimeout(() => setMsg(''), 2500); }
  };
  return <div className="grid gap-2 rounded-xl border border-dashed border-indigo-200 bg-white p-3 md:grid-cols-[120px_1fr_110px_auto]">
    <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="rounded-lg border border-indigo-100 bg-white px-2 py-1 text-xs text-slate-700" />
    <input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="新增节点说明" className="rounded-lg border border-indigo-100 bg-white px-2 py-1 text-xs text-slate-700" />
    <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as GanttCellType })} className="rounded-lg border border-indigo-100 bg-white px-2 py-1 text-xs text-slate-700">{GANTT_TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
    <button onClick={save} disabled={saving} className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 disabled:opacity-50">新增节点</button>
    {msg && <div className="text-xs text-indigo-600 md:col-span-4">{msg}</div>}
  </div>;
}

function EditableTaskCard({ task, contacts, ganttCells, token, onUpdated }: { task: PortalTask; contacts: PortalContact[]; ganttCells: PortalGanttCell[]; token: string; onUpdated: (data: PortalData) => void }) {
  const [draft, setDraft] = React.useState({ status: task.status, currentProgress: task.currentProgress || '', currentBlocker: task.currentBlocker || '', nextStep: task.nextStep || '', remark: task.remark || '', assigneeId: task.assigneeId || '' });
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const taskCells = cellsForTask(ganttCells, task.id);

  React.useEffect(() => { setDraft({ status: task.status, currentProgress: task.currentProgress || '', currentBlocker: task.currentBlocker || '', nextStep: task.nextStep || '', remark: task.remark || '', assigneeId: task.assigneeId || '' }); }, [task]);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/portal/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, taskId: task.id, updates: draft }) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || '更新失败');
      onUpdated(json);
      setMsg('已保存');
    } catch (err: any) { setMsg(err?.message || '更新失败'); }
    finally { setSaving(false); setTimeout(() => setMsg(''), 2500); }
  };

  return <article className="p-5">
    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"><div><h3 className="text-sm font-semibold text-slate-900">{task.title}</h3><p className="mt-1 text-xs text-slate-400">保荐人：{task.sponsor || '-'} ｜ 律师：{task.lawyer || '-'} ｜ 其他：{task.otherParty || '-'}</p></div><select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as TaskStatus })} className="w-fit rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700">{(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
    <div className="mt-4 grid gap-3 md:grid-cols-3"><label className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-semibold text-slate-400">当前进展</p><textarea value={draft.currentProgress} onChange={(e) => setDraft({ ...draft, currentProgress: e.target.value })} className="mt-1 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white p-2 text-sm leading-6 text-slate-700" /></label><label className="rounded-xl bg-red-50/60 p-3"><p className="text-[11px] font-semibold text-red-300">卡点</p><textarea value={draft.currentBlocker} onChange={(e) => setDraft({ ...draft, currentBlocker: e.target.value })} className="mt-1 min-h-24 w-full resize-y rounded-lg border border-red-100 bg-white p-2 text-sm leading-6 text-slate-700" /></label><label className="rounded-xl bg-blue-50/60 p-3"><p className="text-[11px] font-semibold text-blue-300">下一步</p><textarea value={draft.nextStep} onChange={(e) => setDraft({ ...draft, nextStep: e.target.value })} className="mt-1 min-h-24 w-full resize-y rounded-lg border border-blue-100 bg-white p-2 text-sm leading-6 text-slate-700" /></label></div>
    <div className="mt-3 grid gap-2 md:grid-cols-2"><select value={draft.assigneeId} onChange={(e) => setDraft({ ...draft, assigneeId: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"><option value="">未指定负责人</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name} - {contact.institution}</option>)}</select><input value={draft.remark} onChange={(e) => setDraft({ ...draft, remark: e.target.value })} placeholder="备注" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700" /></div>
    <div className="mt-4 space-y-2"><div className="text-xs font-semibold text-indigo-500">甘特节点</div>{taskCells.map((cell) => <GanttCellEditor key={cell.id} cell={cell} token={token} onUpdated={onUpdated} />)}<NewGanttCellForm taskId={task.id} token={token} onUpdated={onUpdated} /></div>
    <div className="mt-4 flex items-center gap-3"><button onClick={save} disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-50">{saving ? '保存中' : '保存事项'}</button>{msg && <span className="text-xs text-brand-600">{msg}</span>}</div>
  </article>;
}

function ReadonlyTaskCard({ task, ganttCells }: { task: PortalTask; ganttCells: PortalGanttCell[] }) {
  const taskCells = cellsForTask(ganttCells, task.id);
  return <article className="p-5"><div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"><div><h3 className="text-sm font-semibold text-slate-900">{task.title}</h3><p className="mt-1 text-xs text-slate-400">保荐人：{task.sponsor || '-'} ｜ 律师：{task.lawyer || '-'} ｜ 其他：{task.otherParty || '-'}</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[task.status]}`}>{STATUS_LABEL[task.status]}</span></div><div className="mt-4 grid gap-3 md:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-semibold text-slate-400">当前进展</p><p className="mt-1 text-sm leading-6 text-slate-700 whitespace-pre-wrap">{task.currentProgress || '-'}</p></div><div className="rounded-xl bg-red-50/60 p-3"><p className="text-[11px] font-semibold text-red-300">卡点</p><p className="mt-1 text-sm leading-6 text-slate-700 whitespace-pre-wrap">{task.currentBlocker || '-'}</p></div><div className="rounded-xl bg-blue-50/60 p-3"><p className="text-[11px] font-semibold text-blue-300">下一步</p><p className="mt-1 text-sm leading-6 text-slate-700 whitespace-pre-wrap">{task.nextStep || '-'}</p></div></div>{taskCells.length > 0 && <div className="mt-3 flex flex-wrap gap-2"><span className="text-xs font-semibold text-indigo-500">关键节点：</span>{taskCells.map((cell) => <GanttCellReadonly key={cell.id} cell={cell} />)}</div>}{(task.assigneeName || task.remark) && <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">{task.assigneeName && <span className="rounded-full bg-slate-100 px-2 py-1">负责人：{task.assigneeName}{task.assigneeEmail ? ` (${task.assigneeEmail})` : ''}</span>}{task.remark && <span className="rounded-full bg-slate-100 px-2 py-1">备注：{task.remark}</span>}</div>}</article>;
}

function NewPortalTaskForm({ data, token, onUpdated }: { data: PortalData; token: string; onUpdated: (data: PortalData) => void }) {
  const [draft, setDraft] = React.useState({ workstreamId: data.workstreams[0]?.id || '', title: '', sponsor: '保荐人H', lawyer: '', otherParty: '', assigneeId: '', currentProgress: '', currentBlocker: '', nextStep: '', remark: '', status: 'pending' as TaskStatus });
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  React.useEffect(() => setDraft((prev) => ({ ...prev, workstreamId: prev.workstreamId || data.workstreams[0]?.id || '' })), [data.workstreams]);
  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/portal/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, task: draft }) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || '新增事项失败');
      onUpdated(json);
      setDraft({ ...draft, title: '', currentProgress: '', currentBlocker: '', nextStep: '', remark: '' });
      setMsg('已新增事项');
    } catch (err: any) { setMsg(err?.message || '新增事项失败'); }
    finally { setSaving(false); setTimeout(() => setMsg(''), 2500); }
  };
  return <div className="rounded-2xl border border-green-100 bg-green-50/50 p-5 shadow-sm"><h2 className="text-sm font-semibold text-green-800">保荐人H｜新增事项</h2><div className="mt-3 grid gap-2 md:grid-cols-3"><select value={draft.workstreamId} onChange={(e) => setDraft({ ...draft, workstreamId: e.target.value })} className="rounded-lg border border-green-100 bg-white px-3 py-2 text-xs text-slate-700">{data.workstreams.map((ws) => <option key={ws.id} value={ws.id}>{ws.name}</option>)}</select><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="事项名称" className="rounded-lg border border-green-100 bg-white px-3 py-2 text-xs text-slate-700 md:col-span-2" /><input value={draft.sponsor} onChange={(e) => setDraft({ ...draft, sponsor: e.target.value })} placeholder="保荐人" className="rounded-lg border border-green-100 bg-white px-3 py-2 text-xs text-slate-700" /><input value={draft.lawyer} onChange={(e) => setDraft({ ...draft, lawyer: e.target.value })} placeholder="律师" className="rounded-lg border border-green-100 bg-white px-3 py-2 text-xs text-slate-700" /><input value={draft.otherParty} onChange={(e) => setDraft({ ...draft, otherParty: e.target.value })} placeholder="其他机构" className="rounded-lg border border-green-100 bg-white px-3 py-2 text-xs text-slate-700" /><select value={draft.assigneeId} onChange={(e) => setDraft({ ...draft, assigneeId: e.target.value })} className="rounded-lg border border-green-100 bg-white px-3 py-2 text-xs text-slate-700"><option value="">未指定负责人</option>{data.contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name} - {contact.institution}</option>)}</select><select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as TaskStatus })} className="rounded-lg border border-green-100 bg-white px-3 py-2 text-xs text-slate-700">{(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div><div className="mt-3 grid gap-2 md:grid-cols-3"><textarea value={draft.currentProgress} onChange={(e) => setDraft({ ...draft, currentProgress: e.target.value })} placeholder="当前进展" className="min-h-20 rounded-lg border border-green-100 bg-white p-2 text-xs text-slate-700" /><textarea value={draft.currentBlocker} onChange={(e) => setDraft({ ...draft, currentBlocker: e.target.value })} placeholder="卡点" className="min-h-20 rounded-lg border border-green-100 bg-white p-2 text-xs text-slate-700" /><textarea value={draft.nextStep} onChange={(e) => setDraft({ ...draft, nextStep: e.target.value })} placeholder="下一步" className="min-h-20 rounded-lg border border-green-100 bg-white p-2 text-xs text-slate-700" /></div><div className="mt-3 flex items-center gap-3"><button onClick={save} disabled={saving} className="rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-50">{saving ? '新增中' : '新增事项'}</button>{msg && <span className="text-xs text-green-700">{msg}</span>}</div></div>;
}

function FullGanttDistribution({ tasks, ganttCells }: { tasks: PortalTask[]; ganttCells: PortalGanttCell[] }) {
  const rows = tasks.map((task) => ({ task, cells: cellsForTask(ganttCells, task.id) })).filter((row) => row.cells.length > 0);
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold text-slate-700">完整甘特分布</h2><p className="mt-1 text-xs text-slate-400">展示所有机构事项的节点分布，便于保荐人H统一排期。</p><div className="mt-4 space-y-3">{rows.length === 0 ? <p className="text-xs text-slate-400">暂无甘特节点。</p> : rows.map(({ task, cells }) => <div key={task.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="text-xs font-semibold text-slate-700">{task.workstreamName}｜{task.title}</div><div className="mt-2 flex flex-wrap gap-2">{cells.map((cell) => <GanttCellReadonly key={cell.id} cell={cell} />)}</div><div className="mt-2 text-[11px] text-slate-400">保荐人：{task.sponsor || '-'} ｜ 律师：{task.lawyer || '-'} ｜ 其他：{task.otherParty || '-'}</div></div>)}</div></div>;
}

function PortalContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [data, setData] = React.useState<PortalData | null>(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => { let cancelled = false; async function load() { setLoading(true); setError(''); try { const res = await fetch('/api/portal/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }); const json = await res.json(); if (!res.ok || !json.ok) throw new Error(json.error || '访问链接无效'); if (!cancelled) setData(json); } catch (err: any) { if (!cancelled) setError(err?.message || '访问链接无效'); } finally { if (!cancelled) setLoading(false); } } load(); return () => { cancelled = true; }; }, [token]);

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">正在验证访问链接...</div>;
  if (error || !data) return <div className="rounded-2xl border border-red-100 bg-red-50 p-8 shadow-sm"><h1 className="text-lg font-semibold text-red-700">无法访问项目门户</h1><p className="mt-2 text-sm text-red-600">{error || '访问链接无效'}</p><p className="mt-4 text-xs text-red-500">请确认链接完整，或联系项目管理员重新生成机构访问链接。</p></div>;

  const summary = statusSummary(data.tasks);
  const groupedTasks = groupByWorkstream(data.tasks);

  return <div className="space-y-6"><div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">External Portal · {data.canEdit ? 'sponsor_h_edit' : 'readonly'}</p><h1 className="mt-2 text-2xl font-semibold text-slate-900">{data.projectName}｜{data.institution} 工作门户</h1><p className="mt-2 text-sm leading-6 text-slate-500">{data.institution === '公司' ? '公司账号可查看全部事项。' : data.institution === '保荐人H' ? '保荐人H负责项目进度管控，可查看全部事项和完整甘特分布。' : '当前展示与本机构相关的事项。'} {data.canEdit ? '可编辑事项、负责人、进度字段，并可新增/删除/调整甘特节点、增加事项。' : '当前为只读模式，暂不支持外部编辑。'}</p></div><div className={`rounded-2xl border px-4 py-3 text-xs leading-5 ${data.canEdit ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>{data.canEdit ? 'editable' : 'readonly'}<br />{data.canEdit ? '事项 + 甘特完整维护' : '不能修改状态 / 负责人 / 备注'}</div></div></div><div className="grid gap-3 md:grid-cols-4">{(Object.keys(STATUS_LABEL) as TaskStatus[]).map((status) => <div key={status} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-400">{STATUS_LABEL[status]}</p><p className="mt-1 text-2xl font-semibold text-slate-900">{summary[status]}</p></div>)}</div>{data.canEdit && <NewPortalTaskForm data={data} token={token} onUpdated={setData} />}{data.canEdit && <FullGanttDistribution tasks={data.tasks} ganttCells={data.ganttCells} />}{data.contacts.length > 0 && <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold text-slate-700">{data.canEdit ? '项目联系人' : data.institution === '公司' ? '项目联系人' : '本机构联系人'}</h2><div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3">{data.contacts.map((contact) => <div key={contact.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"><div className="flex items-center gap-2 text-sm font-medium text-slate-800">{contact.name}{contact.isKeyContact && <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] text-brand-600">重点</span>}</div><div className="mt-1 text-xs text-slate-400">{contact.institution}｜{contact.email}</div></div>)}</div></div>}<div className="space-y-5">{groupedTasks.map(([workstream, tasks]) => <section key={workstream} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 bg-slate-50 px-5 py-3"><h2 className="text-sm font-semibold text-slate-700">{workstream}</h2><p className="text-xs text-slate-400">{tasks.length} 个事项</p></div>{tasks.map((task) => data.canEdit ? <EditableTaskCard key={task.id} task={task} contacts={data.contacts} ganttCells={data.ganttCells} token={token} onUpdated={setData} /> : <ReadonlyTaskCard key={task.id} task={task} ganttCells={data.ganttCells} />)}</section>)}</div></div>;
}

export default function PortalPage() {
  return <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">正在加载门户...</div>}><PortalContent /></Suspense>;
}
