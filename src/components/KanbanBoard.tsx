'use client';

import React, { useState } from 'react';
import { Task, TaskStatus, STATUS_LABEL, STATUS_COLOR } from '@/types/ipo';
import { Workstream } from '@/types/ipo';

const COLUMNS: TaskStatus[] = ['pending', 'in_progress', 'blocked', 'completed'];

const COL_BG: Record<TaskStatus, string> = {
  pending: 'bg-gray-50',
  in_progress: 'bg-blue-50',
  blocked: 'bg-red-50',
  completed: 'bg-green-50',
};

interface KanbanBoardProps {
  tasks: Task[];
  workstreams: Workstream[];
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
}

export default function KanbanBoard({ tasks, workstreams, onUpdateTask }: KanbanBoardProps) {
  const [dragId, setDragId] = useState<string | null>(null);

  const wsMap = new Map(workstreams.map(w => [w.id, w.name]));

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDragId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (dragId && onUpdateTask) {
      onUpdateTask(dragId, { status });
    }
    setDragId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div className="grid grid-cols-4 gap-3 min-h-[400px]">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col);
        return (
          <div
            key={col}
            className={`rounded-xl border border-slate-200 ${COL_BG[col]} p-3 flex flex-col`}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, col)}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[col]}`}>
                {STATUS_LABEL[col]}
              </span>
              <span className="text-[11px] text-slate-400">{colTasks.length}</span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)]">
              {colTasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={e => handleDragStart(e, task.id)}
                  className={`bg-white rounded-lg border border-slate-200 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow ${
                    dragId === task.id ? 'opacity-50' : ''
                  }`}
                >
                  <div className="text-xs font-medium text-slate-800 mb-1">{task.title}</div>
                  <div className="text-[10px] text-slate-400 mb-1.5">
                    {wsMap.get(task.workstreamId) || ''}
                  </div>
                  {task.assignee && (
                    <span className="inline-block text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded-full mb-1">
                      {task.assignee}
                    </span>
                  )}
                  {task.currentProgress && (
                    <div className="text-[10px] text-slate-500 line-clamp-2">{task.currentProgress}</div>
                  )}
                </div>
              ))}
              {colTasks.length === 0 && (
                <div className="text-center text-[11px] text-slate-300 py-8">拖拽任务到此列</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
