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
  } catch {
    return null;
  }
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
  lastSyncTime: string | null;
  setLocalMode: (v: boolean) => void;
  syncToCloud: () => Promise<void>;
  pullFromCloud: () => Promise<void>;
  setImportedData: (data: IpoProjectData) => Promise<void>;
  importWorkstreamsAndTasks: (data: Pick<IpoProjectData, 'workstreams' | 'tasks'>) => Promise<void>;
  importGanttOnly: (data: Pick<IpoProjectData, 'ganttCells'>) => Promise<void>;
  resetToSeed: () => Promise<void>;
  refresh: () => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  updateGanttCell: (cellId: string, updates: Partial<GanttCell>) => void;
  addGanttCell: (cell: GanttCell) => void;
  removeGanttCell: (cellId: string) => void;
  moveGanttCell: (cellId: string, newDate: string) => void;
  addWorkstream: (name: string) => Promise<void>;
  removeWorkstream: (wsId: string) => Promise<void>;
  renameWorkstream: (wsId: string, newName: string) => Promise<void>;
  addTask: (workstreamId: string, title: string) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
}

const emptyData: IpoProjectData = { workstreams: [], tasks: [], ganttCells: [] };

const IpoDataContext = createContext<IpoDataContextType | undefined>(undefined);

async function getOrCreateProjectId(): Promise<string> {
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1);
  if (error) throw new Error(`projects query: ${error.message}`);
  if (data && data.length > 0) return data[0].id;
  const { data: created, error: createErr } = await supabase
    .from('projects')
    .insert({ name: 'Project Yangtze 进度跟踪' })
    .select('id')
    .single();
  if (createErr) throw new Error(`projects create: ${createErr.message}`);
  return created.id;
}

interface FetchResult {
  data: IpoProjectData;
  lastSyncTime: string | null;
}

async function fetchProjectData(): Promise<FetchResult> {
  const projectId = await getOrCreateProjectId();

  const [wsRes, taskRes, gcRes] = await Promise.all([
    supabase.from('workstreams').select('*').eq('project_id', projectId).order('sort_order', { ascending: true }),
    supabase.from('tasks').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
    supabase.from('gantt_cells').select('*'),
  ]);

  if (wsRes.error) throw new Error(`workstreams: ${wsRes.error.message}`);
  if (taskRes.error) throw new Error(`tasks: ${taskRes.error.message}`);
  if (gcRes.error) throw new Error(`gantt_cells: ${gcRes.error.message}`);

  const allTimes = [
    ...(taskRes.data || []).map((r: any) => r.updated_at),
    ...(wsRes.data || []).map((r: any) => r.created_at),
  ].filter(Boolean);
  const lastSyncTime = allTimes.length > 0 ? allTimes.sort().reverse()[0] : null;

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
    remark: r.remark || '',
    assignee: r.assignee || '',
    status: r.status || 'pending',
  }));

  const taskIds = new Set(tasks.map((t) => t.id));
  const ganttCells: GanttCell[] = (gcRes.data || [])
    .filter((r: any) => taskIds.has(r.task_id))
    .map((r: any) => ({
      id: r.id,
      taskId: r.task_id,
      date: r.cell_date,
      label: r.label || '',
      type: r.cell_type || 'event',
    }));

  return { data: { workstreams, tasks, ganttCells }, lastSyncTime };
}

async function deleteProjectGanttCells(projectId: string) {
  const { data: taskRows, error: taskError } = await supabase
    .from('tasks')
    .select('id')
    .eq('project_id', projectId);

  if (taskError) {
    throw new Error(`tasks query for gantt delete: ${taskError.message}`);
  }

  const taskIds = (taskRows || []).map((row: any) => row.id).filter(Boolean);
  if (taskIds.length === 0) return;

  const BATCH = 100;
  for (let i = 0; i < taskIds.length; i += BATCH) {
    const batch = taskIds.slice(i, i + BATCH);
    const { error } = await supabase.from('gantt_cells').delete().in('task_id', batch);
    if (error) {
      throw new Error(`gantt_cells delete batch ${i}: ${error.message}`);
    }
  }
}

async function clearProjectData(projectId: string) {
  await deleteProjectGanttCells(projectId);

  const { error: taskDeleteError } = await supabase
    .from('tasks')
    .delete()
    .eq('project_id', projectId);
  if (taskDeleteError) {
    throw new Error(`tasks delete: ${taskDeleteError.message}`);
  }

  const { error: wsDeleteError } = await supabase
    .from('workstreams')
    .delete()
    .eq('project_id', projectId);
  if (wsDeleteError) {
    throw new Error(`workstreams delete: ${wsDeleteError.message}`);
  }
}

function buildUuidMaps(sourceData: IpoProjectData) {
  const wsIdMap = new Map<string, string>();
  const taskIdMap = new Map<string, string>();

  const wsRows = sourceData.workstreams.map((ws) => {
    const uuid = crypto.randomUUID();
    wsIdMap.set(ws.id, uuid);
    return { sourceId: ws.id, uuid };
  });

  const taskRows = sourceData.tasks.map((task) => {
    const uuid = crypto.randomUUID();
    taskIdMap.set(task.id, uuid);
    return { sourceId: task.id, uuid };
  });

  return { wsIdMap, taskIdMap, wsRows, taskRows };
}

async function persistFullDataset(projectId: string, sourceData: IpoProjectData) {
  const { wsIdMap, taskIdMap } = buildUuidMaps(sourceData);

  const wsRows = sourceData.workstreams.map((ws) => ({
    id: wsIdMap.get(ws.id)!,
    project_id: projectId,
    name: ws.name,
    sort_order: ws.sortOrder,
  }));

  if (wsRows.length > 0) {
    const { error } = await supabase.from('workstreams').insert(wsRows);
    if (error) throw new Error(`workstream insert: ${error.message}`);
  }

  const taskRows = sourceData.tasks.map((t) => ({
    id: taskIdMap.get(t.id)!,
    project_id: projectId,
    workstream_id: wsIdMap.get(t.workstreamId) || null,
    title: t.title,
    sponsor: t.sponsor || null,
    lawyer: t.lawyer || null,
    other_party: t.otherParty || null,
    current_progress: t.currentProgress || null,
    current_blocker: t.currentBlocker || null,
    next_step: t.nextStep || null,
    remark: t.remark || null,
    status: t.status,
  }));

  if (taskRows.length > 0) {
    const { error } = await supabase.from('tasks').insert(taskRows);
    if (error) throw new Error(`task insert: ${error.message}`);
  }

  const gcRows = sourceData.ganttCells
    .map((gc) => {
      const mappedTaskId = taskIdMap.get(gc.taskId);
      if (!mappedTaskId) return null;
      return {
        id: crypto.randomUUID(),
        task_id: mappedTaskId,
        cell_date: gc.date,
        label: gc.label || null,
        cell_type: gc.type || 'event',
      };
    })
    .filter(Boolean) as Array<{
      id: string;
      task_id: string;
      cell_date: string;
      label: string | null;
      cell_type: string;
    }>;

  const BATCH = 500;
  for (let i = 0; i < gcRows.length; i += BATCH) {
    const batch = gcRows.slice(i, i + BATCH);
    const { error } = await supabase.from('gantt_cells').insert(batch);
    if (error) throw new Error(`gantt_cell insert batch ${i}: ${error.message}`);
  }
}

export function IpoDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<IpoProjectData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasImported, setHasImported] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    setIsLocalMode(loadLocalMode());
  }, []);

  const setLocalMode = useCallback((v: boolean) => {
    setIsLocalMode(v);
    saveLocalMode(v);
    if (v) {
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
        } else {
          setData(emptyData);
          setHasImported(false);
        }
      } else {
        const result = await fetchProjectData();
        setData(result.data);
        setHasImported(result.data.tasks.length > 0);
        setLastSyncTime(result.lastSyncTime);
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
      if (isLocalMode) {
        setData(newData);
        saveLocalData(newData);
        setHasImported(newData.tasks.length > 0);
        return;
      }

      const projectId = await getOrCreateProjectId();
      await clearProjectData(projectId);
      await persistFullDataset(projectId, newData);
      await refresh();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  const importWorkstreamsAndTasks = async (partialData: Pick<IpoProjectData, 'workstreams' | 'tasks'>) => {
    const mergedData: IpoProjectData = {
      workstreams: partialData.workstreams,
      tasks: partialData.tasks,
      ganttCells: [],
    };
    await setImportedData(mergedData);
  };

  const importGanttOnly = async (partialData: Pick<IpoProjectData, 'ganttCells'>) => {
    setLoading(true);
    setError(null);
    try {
      if (isLocalMode) {
        setData((prev) => {
          const next = { ...prev, ganttCells: partialData.ganttCells };
          saveLocalData(next);
          return next;
        });
        return;
      }

      const projectId = await getOrCreateProjectId();
      const { data: taskRows, error: taskError } = await supabase
        .from('tasks')
        .select('id')
        .eq('project_id', projectId);
      if (taskError) throw new Error(`tasks query: ${taskError.message}`);
      const taskIds = new Set((taskRows || []).map((row: any) => row.id));

      await deleteProjectGanttCells(projectId);

      const gcRows = partialData.ganttCells
        .filter((gc) => taskIds.has(gc.taskId))
        .map((gc) => ({
          id: crypto.randomUUID(),
          task_id: gc.taskId,
          cell_date: gc.date,
          label: gc.label || null,
          cell_type: gc.type || 'event',
        }));

      const BATCH = 500;
      for (let i = 0; i < gcRows.length; i += BATCH) {
        const batch = gcRows.slice(i, i + BATCH);
        const { error } = await supabase.from('gantt_cells').insert(batch);
        if (error) throw new Error(`gantt import batch ${i}: ${error.message}`);
      }

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
      if (isLocalMode) {
        setData(emptyData);
        saveLocalData(emptyData);
        setHasImported(false);
        return;
      }
      const projectId = await getOrCreateProjectId();
      await clearProjectData(projectId);
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
      setData((prev) => {
        const next = {
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
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
    if (updates.remark !== undefined) dbUpdates.remark = updates.remark;
    if (updates.assignee !== undefined) dbUpdates.assignee = updates.assignee;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.workstreamId !== undefined) dbUpdates.workstream_id = updates.workstreamId;

    const { error: e } = await supabase.from('tasks').update(dbUpdates).eq('id', taskId);
    if (e) throw new Error(`task update: ${e.message}`);

    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
    }));
  };

  const updateGanttCell = (cellId: string, updates: Partial<GanttCell>) => {
    setData((prev) => {
      const next = {
        ...prev,
        ganttCells: prev.ganttCells.map((c) => (c.id === cellId ? { ...c, ...updates } : c)),
      };
      if (isLocalMode) saveLocalData(next);
      return next;
    });
  };

  const addGanttCell = (cell: GanttCell) => {
    setData((prev) => {
      const next = { ...prev, ganttCells: [...prev.ganttCells, cell] };
      if (isLocalMode) saveLocalData(next);
      return next;
    });
  };

  const removeGanttCell = (cellId: string) => {
    setData((prev) => {
      const next = { ...prev, ganttCells: prev.ganttCells.filter((c) => c.id !== cellId) };
      if (isLocalMode) saveLocalData(next);
      return next;
    });
  };

  const moveGanttCell = (cellId: string, newDate: string) => {
    setData((prev) => {
      const next = {
        ...prev,
        ganttCells: prev.ganttCells.map((c) => (c.id === cellId ? { ...c, date: newDate } : c)),
      };
      if (isLocalMode) saveLocalData(next);
      return next;
    });
    if (!isLocalMode) {
      supabase.from('gantt_cells').update({ cell_date: newDate }).eq('id', cellId).then();
    }
  };

  const syncToCloud = async () => {
    setLoading(true);
    setError(null);
    try {
      const projectId = await getOrCreateProjectId();
      const currentData = data;
      await clearProjectData(projectId);
      await persistFullDataset(projectId, currentData);
      setLastSyncTime(new Date().toISOString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const pullFromCloud = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProjectData();
      saveLocalData(result.data);
      setData(result.data);
      setHasImported(result.data.tasks.length > 0);
      setLastSyncTime(result.lastSyncTime);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const addWorkstream = async (name: string) => {
    const maxSort = data.workstreams.reduce((m, w) => Math.max(m, w.sortOrder), 0);
    if (isLocalMode) {
      const ws: Workstream = { id: crypto.randomUUID(), name, sortOrder: maxSort + 1 };
      setData((prev) => {
        const next = { ...prev, workstreams: [...prev.workstreams, ws] };
        saveLocalData(next);
        return next;
      });
      return;
    }
    const projectId = await getOrCreateProjectId();
    const id = crypto.randomUUID();
    const { error: e } = await supabase.from('workstreams').insert({ id, project_id: projectId, name, sort_order: maxSort + 1 });
    if (e) throw new Error(`addWorkstream: ${e.message}`);
    setData((prev) => ({ ...prev, workstreams: [...prev.workstreams, { id, name, sortOrder: maxSort + 1 }] }));
  };

  const removeWorkstream = async (wsId: string) => {
    if (isLocalMode) {
      setData((prev) => {
        const next = {
          ...prev,
          workstreams: prev.workstreams.filter((w) => w.id !== wsId),
          tasks: prev.tasks.filter((t) => t.workstreamId !== wsId),
          ganttCells: prev.ganttCells.filter((c) => !prev.tasks.some((t) => t.workstreamId === wsId && t.id === c.taskId)),
        };
        saveLocalData(next);
        return next;
      });
      return;
    }
    const taskIds = data.tasks.filter((t) => t.workstreamId === wsId).map((t) => t.id);
    if (taskIds.length > 0) {
      await supabase.from('gantt_cells').delete().in('task_id', taskIds);
      await supabase.from('tasks').delete().in('id', taskIds);
    }
    const { error: e } = await supabase.from('workstreams').delete().eq('id', wsId);
    if (e) throw new Error(`removeWorkstream: ${e.message}`);
    setData((prev) => ({
      ...prev,
      workstreams: prev.workstreams.filter((w) => w.id !== wsId),
      tasks: prev.tasks.filter((t) => t.workstreamId !== wsId),
      ganttCells: prev.ganttCells.filter((c) => !taskIds.includes(c.taskId)),
    }));
  };

  const renameWorkstream = async (wsId: string, newName: string) => {
    if (isLocalMode) {
      setData((prev) => {
        const next = { ...prev, workstreams: prev.workstreams.map((w) => (w.id === wsId ? { ...w, name: newName } : w)) };
        saveLocalData(next);
        return next;
      });
      return;
    }
    const { error: e } = await supabase.from('workstreams').update({ name: newName }).eq('id', wsId);
    if (e) throw new Error(`renameWorkstream: ${e.message}`);
    setData((prev) => ({ ...prev, workstreams: prev.workstreams.map((w) => (w.id === wsId ? { ...w, name: newName } : w)) }));
  };

  const addTask = async (workstreamId: string, title: string) => {
    if (isLocalMode) {
      const t: Task = { id: crypto.randomUUID(), workstreamId, title, sponsor: '', lawyer: '', otherParty: '', currentProgress: '', currentBlocker: '', nextStep: '', status: 'pending' };
      setData((prev) => {
        const next = { ...prev, tasks: [...prev.tasks, t] };
        saveLocalData(next);
        return next;
      });
      return;
    }
    const projectId = await getOrCreateProjectId();
    const id = crypto.randomUUID();
    const { error: e } = await supabase.from('tasks').insert({ id, project_id: projectId, workstream_id: workstreamId, title, status: 'pending' });
    if (e) throw new Error(`addTask: ${e.message}`);
    setData((prev) => ({
      ...prev,
      tasks: [...prev.tasks, { id, workstreamId, title, sponsor: '', lawyer: '', otherParty: '', currentProgress: '', currentBlocker: '', nextStep: '', status: 'pending' as const }],
    }));
  };

  const removeTask = async (taskId: string) => {
    if (isLocalMode) {
      setData((prev) => {
        const next = { ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId), ganttCells: prev.ganttCells.filter((c) => c.taskId !== taskId) };
        saveLocalData(next);
        return next;
      });
      return;
    }
    await supabase.from('gantt_cells').delete().eq('task_id', taskId);
    const { error: e } = await supabase.from('tasks').delete().eq('id', taskId);
    if (e) throw new Error(`removeTask: ${e.message}`);
    setData((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId), ganttCells: prev.ganttCells.filter((c) => c.taskId !== taskId) }));
  };

  return (
    <IpoDataContext.Provider
      value={{
        data,
        loading,
        error,
        hasImported,
        isLocalMode,
        lastSyncTime,
        setLocalMode,
        syncToCloud,
        pullFromCloud,
        setImportedData,
        importWorkstreamsAndTasks,
        importGanttOnly,
        resetToSeed,
        refresh,
        updateTask,
        updateGanttCell,
        addGanttCell,
        removeGanttCell,
        moveGanttCell,
        addWorkstream,
        removeWorkstream,
        renameWorkstream,
        addTask,
        removeTask,
      }}
    >
      {children}
    </IpoDataContext.Provider>
  );
}

export function useIpoData(): IpoDataContextType {
  const ctx = useContext(IpoDataContext);
  if (!ctx) throw new Error('useIpoData must be used within IpoDataProvider');
  return ctx;
}
