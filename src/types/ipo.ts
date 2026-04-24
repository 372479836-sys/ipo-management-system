export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

export interface Workstream {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Task {
  id: string;
  workstreamId: string;
  title: string;
  sponsor: string;
  lawyer: string;
  otherParty: string;
  currentProgress: string;
  currentBlocker: string;
  nextStep: string;
  status: TaskStatus;
}

export interface GanttCell {
  id: string;
  taskId: string;
  date: string;
  label?: string;
  type?: 'milestone' | 'event' | 'progress';
}

export interface IpoProjectData {
  workstreams: Workstream[];
  tasks: Task[];
  ganttCells: GanttCell[];
}

export const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  blocked: '卡点',
};

export const STATUS_COLOR: Record<TaskStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
};
