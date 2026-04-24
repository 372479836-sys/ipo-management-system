'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { IpoProjectData, Workstream, Task, GanttCell } from '@/types/ipo';
import { supabase } from '@/lib/supabase';

const LOCAL_STORAGE_KEY = 'ipo-local-data';
const LOCAL_MODE_KEY = 'ipo-local-mode';

function loadLocalData(): IpoProjectData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as IpoProjectData;
  } catch { return null; }
}

function saveLocalData(data: IpoProjectData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

function loadLocalMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(LOCAL_MODE_KEY) === 'true';
}

function saveLocalMode(v: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_MODE_KEY, String(v));
}

interface IpoDataContextType {
  data: IpoProjectData;
  loading: boolean;
  error: string | null;
  hasImported: boolean;
  isLocalMode: boolean;
  setLocalMode: (v: boolean) => void;
  syncToCloud: () => Promise<void>;
  setImportedData: (data: IpoProjectData) => Promise<void>;
  resetToSeed: () => Promise<void>;
  refresh: () => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  updateGanttCell: (cellId: string, updates: Partial<GanttCell>) => void;
  addGanttCell: (cell: GanttCell) => void;
  removeGanttCell: (cellId: string) => void;
}

const emptyData: IpoProjectData = { workstreams: [], tasks: [], ganttCells: [] };

const IpoDataContext = createContext<IpoDataContextType | undefined>(undefined);

/** 动态获取第一个 project 的 ID；如果不存在则创建 */
async function getOrCreateProjectId(): Promise<string> {
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1);
  if (error) throw new Error(`projects query: ${error.message}`);
  if (data && data.length > 0) return data[0].id;
  // 不存在则创建
  const { data: created, error: createErr } = await supabase
    .from('projects')
    .insert({ name: 'Project Yangtze 进度跟踪' })
    .select('id')
    .single();
  if (createErr) throw new Error(`projects create: ${createErr.message}`);
  return created.id;
}

async function fetchProjectData(): Promise<IpoProjectData> {
  const projectId = await getOrCreateProjectId();

  const [wsRes, taskRes, gcRes] = await Promise.all([
    supabase.from('workstreams').select('*').eq('project_id', projectId).order('sort_order', { ascending: true }),
    supabase.from('tasks').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
    supabase.from('gantt_cells').select('*'),
  ]);

  if (wsRes.error) throw new Error(`workstreams: ${wsRes.error.message}`);
  if (taskRes.error) throw new Error(`tasks: ${taskRes.error.message}`);
  if (gcRes.error) throw new Error(`gantt_cells: ${gcRes.error.message}`);

  const workstreams: Workstream[] = (wsRes.data || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    sortOrder: r.sort_order,
  }));

  const tasks: Task[] = (taskRes.data || []).map((r: any) => ({
    id: r.id,
    workstreamId: r.workstream_id,
    title: r.title,
    sponsor: r.sponsor || '',
    lawyer: r.lawyer || '',
    otherParty: r.other_party || '',
    currentProgress: r.current_progress || '',
    currentBlocker: r.current_blocker || '',
    nextStep: r.next_step || '',
    status: r.status || 'pending',
  }));

  const taskIds = new Set(tasks.map(t => t.id));
  const ganttCells: GanttCell[] = (gcRes.data || [])
    .filter((r: any) => taskIds.has(r.task_id))
    .map((r: any) => ({
      id: r.id,
      taskId: r.task_id,
      date: r.cell_date,
      label: r.label || '',
      type: r.cell_type || 'event',
    }));

  return { workstreams, tasks, ganttCells };
}

export function IpoDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<IpoProjectData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasImported, setHasImported] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);

  // 初始化时读取 localStorage 的模式
  useEffect(() => {
    setIsLocalMode(loadLocalMode());
  }, []);

  const setLocalMode = useCallback((v: boolean) => {
    setIsLocalMode(v);
    saveLocalMode(v);
    if (v) {
      // 切到本地模式：把当前数据存入 localStorage
      saveLocalData(data);
    }
  }, [data]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isLocalMode) {
        const local = loadLocalData();
        if (local) {
          setData(local);
          setHasImported(local.tasks.length > 0);
        }
      } else {
        const d = await fetchProjectData();
        setData(d);
        setHasImported(d.tasks.length > 0);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [isLocalMode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setImportedData = async (newData: IpoProjectData) => {
    setLoading(true);
    setError(null);
    try {
      const projectId = await getOrCreateProjectId();

      // 1. 清除旧数据（按外键顺序）
      await supabase.from('gantt_cells').delete().gt('created_at', '1970-01-01');
      await supabase.from('tasks').delete().eq('project_id', projectId);
      await supabase.from('workstreams').delete().eq('project_id', projectId);

      // 2. 生成 UUID 映射（Excel 解析出的 slug ID → 真实 UUID）
      const wsIdMap = new Map<string, string>();
      const taskIdMap = new Map<string, string>();

      const wsRows = newData.workstreams.map((ws) => {
        const uuid = crypto.randomUUID();
        wsIdMap.set(ws.id, uuid);
        return {
          id: uuid,
          project_id: projectId,
          name: ws.name,
          sort_order: ws.sortOrder,
        };
      });

      // 3. 批量插入 workstreams
      if (wsRows.length > 0) {
        const { error: e } = await supabase.from('workstreams').insert(wsRows);
        if (e) throw new Error(`workstream insert: ${e.message}`);
      }

      // 4. 批量插入 tasks
      const taskRows = newData.tasks.map((t) => {
        const uuid = crypto.randomUUID();
        taskIdMap.set(t.id, uuid);
        return {
          id: uuid,
          project_id: projectId,
          workstream_id: wsIdMap.get(t.workstreamId) || null,
          title: t.title,
          sponsor: t.sponsor || null,
          lawyer: t.lawyer || null,
          other_party: t.otherParty || null,
          current_progress: t.currentProgress || null,
          current_blocker: t.currentBlocker || null,
          next_step: t.nextStep || null,
          status: t.status,
        };
      });

      if (taskRows.length > 0) {
        const { error: e } = await supabase.from('tasks').insert(taskRows);
        if (e) throw new Error(`task insert: ${e.message}`);
      }

      // 5. 批量插入 gantt_cells（分批，每批 500 条）
      const gcRows = newData.ganttCells.map((gc) => ({
        id: crypto.randomUUID(),
        task_id: taskIdMap.get(gc.taskId) || null,
        cell_date: gc.date,
        label: gc.label || null,
        cell_type: gc.type || 'event',
      }));

      const BATCH = 500;
      for (let i = 0; i < gcRows.length; i += BATCH) {
        const batch = gcRows.slice(i, i + BATCH);
        const { error: e } = await supabase.from('gantt_cells').insert(batch);
        if (e) throw new Error(`gantt_cell insert batch ${i}: ${e.message}`);
      }

      // 6. 刷新本地状态
      await refresh();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  const resetToSeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const projectId = await getOrCreateProjectId();
      await supabase.from('gantt_cells').delete().gt('created_at', '1970-01-01');
      await supabase.from('tasks').delete().eq('project_id', projectId);
      await supabase.from('workstreams').delete().eq('project_id', projectId);
      setData(emptyData);
      setHasImported(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (isLocalMode) {
      // 本地模式：只改内存 + localStorage
      setData(prev => {
        const next = {
          ...prev,
          tasks: prev.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t),
        };
        saveLocalData(next);
        return next;
      });
      return;
    }
    const dbUpdates: Record<string, any> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.sponsor !== undefined) dbUpdates.sponsor = updates.sponsor;
    if (updates.lawyer !== undefined) dbUpdates.lawyer = updates.lawyer;
    if (updates.otherParty !== undefined) dbUpdates.other_party = updates.otherParty;
    if (updates.currentProgress !== undefined) dbUpdates.current_progress = updates.currentProgress;
    if (updates.currentBlocker !== undefined) dbUpdates.current_blocker = updates.currentBlocker;
    if (updates.nextStep !== undefined) dbUpdates.next_step = updates.nextStep;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.workstreamId !== undefined) dbUpdates.workstream_id = updates.workstreamId;

    const { error: e } = await supabase.from('tasks').update(dbUpdates).eq('id', taskId);
    if (e) throw new Error(`task update: ${e.message}`);

    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t),
    }));
  };

  const updateGanttCell = (cellId: string, updates: Partial<GanttCell>) => {
    setData(prev => {
      const next = {
        ...prev,
        ganttCells: prev.ganttCells.map(c => c.id === cellId ? { ...c, ...updates } : c),
      };
      if (isLocalMode) saveLocalData(next);
      return next;
    });
  };

  const addGanttCell = (cell: GanttCell) => {
    setData(prev => {
      const next = { ...prev, ganttCells: [...prev.ganttCells, cell] };
      if (isLocalMode) saveLocalData(next);
      return next;
    });
  };

  const removeGanttCell = (cellId: string) => {
    setData(prev => {
      const next = { ...prev, ganttCells: prev.ganttCells.filter(c => c.id !== cellId) };
      if (isLocalMode) saveLocalData(next);
      return next;
    });
  };

  /** 把 localStorage 数据同步到 MemFire 云端 */
  const syncToCloud = async () => {
    const localData = loadLocalData();
    if (!localData || localData.tasks.length === 0) {
      throw new Error('本地无数据可同步');
    }
    setLoading(true);
    setError(null);
    try {
      const projectId = await getOrCreateProjectId();

      // 清除旧数据
      await supabase.from('gantt_cells').delete().gt('created_at', '1970-01-01');
      await supabase.from('tasks').delete().eq('project_id', projectId);
      await supabase.from('workstreams').delete().eq('project_id', projectId);

      // UUID 映射
      const wsIdMap = new Map<string, string>();
      const taskIdMap = new Map<string, string>();

      const wsRows = localData.workstreams.map((ws) => {
        const uuid = crypto.randomUUID();
        wsIdMap.set(ws.id, uuid);
        return { id: uuid, project_id: projectId, name: ws.name, sort_order: ws.sortOrder };
      });
      if (wsRows.length > 0) {
        const { error: e } = await supabase.from('workstreams').insert(wsRows);
        if (e) throw new Error(`workstream sync: ${e.message}`);
      }

      const taskRows = localData.tasks.map((t) => {
        const uuid = crypto.randomUUID();
        taskIdMap.set(t.id, uuid);
        return {
          id: uuid, project_id: projectId,
          workstream_id: wsIdMap.get(t.workstreamId) || null,
          title: t.title, sponsor: t.sponsor || null, lawyer: t.lawyer || null,
          other_party: t.otherParty || null, current_progress: t.currentProgress || null,
          current_blocker: t.currentBlocker || null, next_step: t.nextStep || null,
          status: t.status,
        };
      });
      if (taskRows.length > 0) {
        const { error: e } = await supabase.from('tasks').insert(taskRows);
        if (e) throw new Error(`task sync: ${e.message}`);
      }

      const gcRows = localData.ganttCells.map((gc) => ({
        id: crypto.randomUUID(),
        task_id: taskIdMap.get(gc.taskId) || null,
        cell_date: gc.date, label: gc.label || null, cell_type: gc.type || 'event',
      }));
      const BATCH = 500;
      for (let i = 0; i < gcRows.length; i += BATCH) {
        const batch = gcRows.slice(i, i + BATCH);
        const { error: e } = await supabase.from('gantt_cells').insert(batch);
        if (e) throw new Error(`gantt sync batch ${i}: ${e.message}`);
      }

      // 同步完成，切回云端模式
      setIsLocalMode(false);
      saveLocalMode(false);
      await refresh();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <IpoDataContext.Provider value={{
      data,
      loading,
      error,
      hasImported,
      isLocalMode,
      setLocalMode,
      syncToCloud,
      setImportedData,
      resetToSeed,
      refresh,
      updateTask,
      updateGanttCell,
      addGanttCell,
      removeGanttCell,
    }}>
      {children}
    </IpoDataContext.Provider>
  );
}

export function useIpoData(): IpoDataContextType {
  const ctx = useContext(IpoDataContext);
  if (!ctx) throw new Error('useIpoData must be used within IpoDataProvider');
  return ctx;
}
