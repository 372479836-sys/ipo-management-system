export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

export interface Workstream {
  id: string;
  name: string;
  sortOrder: number;
}

export interface ProjectContact {
  id: string;
  name: string;
  email: string;
  institution: string;
  role?: string;
  department?: string;
  phone?: string;
  isKeyContact?: boolean;
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
  remark?: string;
  assignee?: string;
  assigneeId?: string;
  status: TaskStatus;
}

export interface GanttCell {
  id: string;
  taskId: string;
  date: string;
  label?: string;
  type?: 'milestone' | 'event' | 'progress' | 'start' | 'end' | 'ddl' | 'keynode';
}

export type FeedbackTargetType = 'task_field' | 'gantt_cell';
export type FeedbackTargetField = 'current_progress' | 'next_step' | 'remark' | 'gantt_node';
export type FeedbackStatus = 'open' | 'accepted' | 'rejected' | 'resolved';

export interface TaskFeedback {
  id: string;
  projectId: string;
  taskId?: string;
  ganttCellId?: string;
  institution: string;
  contactName?: string;
  contactEmail?: string;
  targetType: FeedbackTargetType;
  targetField: FeedbackTargetField;
  originalValue?: string;
  suggestedValue?: string;
  comment?: string;
  status: FeedbackStatus;
  adminReply?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IpoProjectData {
  workstreams: Workstream[];
  tasks: Task[];
  ganttCells: GanttCell[];
  contacts: ProjectContact[];
  feedbacks?: TaskFeedback[];
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

// 变更日志
export interface AuditLog {
  id: string;
  taskId: string;
  action: string;       // 'update' | 'status_change' | 'create' | 'delete'
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  userName: string;
  createdAt: string;     // ISO string
}

// 评论
export interface Comment {
  id: string;
  taskId: string;
  content: string;
  userName: string;
  createdAt: string;     // ISO string
}
