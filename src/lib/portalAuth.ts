import { createHash } from 'crypto';

export const runtime = 'nodejs';
import { createClient } from '@supabase/supabase-js';
import type { GanttCell, ProjectContact, Task, TaskStatus, Workstream } from '@/types/ipo';

export type PortalPermission = 'readonly' | 'sponsor_h_edit';

export interface PortalSession {
  projectId: string;
  institution: string;
  permission: PortalPermission;
  canEdit: boolean;
}

export interface PortalTask extends Task {
  workstreamName: string;
  assigneeName?: string;
  assigneeEmail?: string;
}

export interface PortalPayload extends PortalSession {
  projectName: string;
  tasks: PortalTask[];
  workstreams: Workstream[];
  ganttCells: GanttCell[];
  contacts: Pick<ProjectContact, 'id' | 'name' | 'email' | 'institution' | 'isKeyContact'>[];
}

export const EDITABLE_TASK_FIELDS = ['status', 'currentProgress', 'currentBlocker', 'nextStep', 'remark', 'assigneeId'] as const;
export type EditableTaskField = typeof EDITABLE_TASK_FIELDS[number];

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) throw new Error('Missing Supabase URL/key');
  return createClient(url, key, { auth: { persistSession: false } });
}

export function hashPortalToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function normalize(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase();
}

function fieldContainsInstitution(value: string | undefined, institution: string): boolean {
  const text = normalize(value);
  const inst = normalize(institution);
  if (!text || !inst) return false;
  return text === inst || text.includes(inst) || inst.includes(text);
}

export function isCompanyInstitution(institution: string): boolean {
  return institution === '公司';
}

export function isSponsorHEditInstitution(institution: string): boolean {
  return institution === '保荐人H';
}

export function getPortalPermission(institution: string): PortalPermission {
  return isSponsorHEditInstitution(institution) ? 'sponsor_h_edit' : 'readonly';
}

export function filterTasksForInstitution(tasks: Task[], contacts: ProjectContact[], institution: string): Task[] {
  if (institution === '公司' || institution === '保荐人H') return tasks;

  const institutionContactIds = new Set(
    contacts.filter((contact) => normalize(contact.institution) === normalize(institution)).map((contact) => contact.id)
  );

  return tasks.filter((task) =>
    fieldContainsInstitution(task.sponsor, institution) ||
    fieldContainsInstitution(task.lawyer, institution) ||
    fieldContainsInstitution(task.otherParty, institution) ||
    Boolean(task.assigneeId && institutionContactIds.has(task.assigneeId))
  );
}

function mapTask(row: any): Task {
  return {
    id: row.id,
    workstreamId: row.workstream_id,
    title: row.title || '',
    sponsor: row.sponsor || '',
    lawyer: row.lawyer || '',
    otherParty: row.other_party || '',
    currentProgress: row.current_progress || '',
    currentBlocker: row.current_blocker || '',
    nextStep: row.next_step || '',
    remark: row.remark || '',
    assignee: row.assignee || '',
    assigneeId: row.assignee_id || undefined,
    status: row.status || 'pending',
  };
}

function mapWorkstream(row: any): Workstream {
  return { id: row.id, name: row.name || '', sortOrder: row.sort_order || 0 };
}

function mapContact(row: any): ProjectContact {
  return {
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    institution: row.institution || '',
    role: row.role || undefined,
    department: row.department || undefined,
    phone: row.phone || undefined,
    isKeyContact: Boolean(row.is_key_contact),
  };
}

function mapGanttCell(row: any): GanttCell {
  return {
    id: row.id,
    taskId: row.task_id,
    date: row.cell_date,
    label: row.label || '',
    type: row.cell_type || 'event',
  };
}

function isEditableGanttType(type: GanttCell['type']): boolean {
  return type === 'keynode' || type === 'milestone' || type === 'ddl' || type === 'event' || type === 'start' || type === 'end';
}

async function verifyPortalSession(token: string): Promise<PortalSession> {
  const cleanToken = token.trim();
  if (!cleanToken || cleanToken.length < 32) throw new Error('访问链接无效');

  const supabase = getSupabaseAdmin();
  const tokenHash = hashPortalToken(cleanToken);

  const { data: tokenRows, error: tokenError } = await supabase
    .from('institution_access_tokens')
    .select('project_id,institution,permission,expires_at,revoked_at')
    .eq('token_hash', tokenHash)
    .limit(1);
  if (tokenError) throw new Error(`token query failed: ${tokenError.message}`);
  const tokenRow = tokenRows?.[0];
  if (!tokenRow) throw new Error('访问链接不存在或已失效');
  if (tokenRow.revoked_at) throw new Error('访问链接已停用');
  if (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() < Date.now()) throw new Error('访问链接已过期');

  const expectedPermission = getPortalPermission(tokenRow.institution);
  const permission: PortalPermission = tokenRow.permission === 'sponsor_h_edit' ? 'sponsor_h_edit' : 'readonly';
  if (permission !== expectedPermission) throw new Error('访问权限配置与机构不匹配');

  await supabase
    .from('institution_access_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('token_hash', tokenHash);

  return {
    projectId: tokenRow.project_id,
    institution: tokenRow.institution,
    permission,
    canEdit: permission === 'sponsor_h_edit' && tokenRow.institution === '保荐人H',
  };
}

export async function verifyPortalToken(token: string): Promise<PortalPayload> {
  const session = await verifyPortalSession(token);
  const supabase = getSupabaseAdmin();

  const [projectRes, wsRes, taskRes, contactRes, ganttRes] = await Promise.all([
    supabase.from('projects').select('name').eq('id', session.projectId).limit(1),
    supabase.from('workstreams').select('*').eq('project_id', session.projectId).order('sort_order', { ascending: true }),
    supabase.from('tasks').select('*').eq('project_id', session.projectId).order('sort_order', { ascending: true }),
    supabase.from('project_contacts').select('*').eq('project_id', session.projectId).order('institution', { ascending: true }).order('name', { ascending: true }),
    supabase.from('gantt_cells').select('*').order('cell_date', { ascending: true }),
  ]);

  if (projectRes.error) throw new Error(`project query failed: ${projectRes.error.message}`);
  if (wsRes.error) throw new Error(`workstreams query failed: ${wsRes.error.message}`);
  if (taskRes.error) throw new Error(`tasks query failed: ${taskRes.error.message}`);
  if (contactRes.error) throw new Error(`contacts query failed: ${contactRes.error.message}`);
  if (ganttRes.error) throw new Error(`gantt_cells query failed: ${ganttRes.error.message}`);

  const workstreams = (wsRes.data || []).map(mapWorkstream);
  const tasks = (taskRes.data || []).map(mapTask);
  const contacts = (contactRes.data || []).map(mapContact);
  const workstreamMap = new Map(workstreams.map((ws) => [ws.id, ws.name]));
  const contactMap = new Map(contacts.map((contact) => [contact.id, contact]));
  const visibleTasks = filterTasksForInstitution(tasks, contacts, session.institution);
  const visibleTaskIds = new Set(visibleTasks.map((task) => task.id));
  const ganttCells = (ganttRes.data || []).map(mapGanttCell).filter((cell) => visibleTaskIds.has(cell.taskId));

  return {
    ...session,
    projectName: projectRes.data?.[0]?.name || 'Project Yangtze',
    workstreams,
    contacts: contacts
      .filter((contact) => session.canEdit || isCompanyInstitution(session.institution) || normalize(contact.institution) === normalize(session.institution))
      .map(({ id, name, email, institution, isKeyContact }) => ({ id, name, email, institution, isKeyContact })),
    ganttCells,
    tasks: visibleTasks.map((task) => {
      const assignee = task.assigneeId ? contactMap.get(task.assigneeId) : undefined;
      return {
        ...task,
        workstreamName: workstreamMap.get(task.workstreamId) || '未分类',
        assigneeName: assignee?.name || task.assignee,
        assigneeEmail: assignee?.email,
      };
    }),
  };
}

export async function updatePortalTask(token: string, taskId: string, updates: Partial<Record<EditableTaskField, string>>): Promise<PortalPayload> {
  const session = await verifyPortalSession(token);
  if (!session.canEdit || session.institution !== '保荐人H') throw new Error('当前机构没有编辑权限');
  if (!taskId) throw new Error('缺少事项 ID');

  const allowedStatuses: TaskStatus[] = ['pending', 'in_progress', 'completed', 'blocked'];
  const dbUpdates: Record<string, string | null> = {};
  for (const field of EDITABLE_TASK_FIELDS) {
    if (!(field in updates)) continue;
    const value = updates[field];
    if (field === 'status') {
      if (!allowedStatuses.includes(value as TaskStatus)) throw new Error('状态值无效');
      dbUpdates.status = value || 'pending';
    } else if (field === 'currentProgress') dbUpdates.current_progress = value || '';
    else if (field === 'currentBlocker') dbUpdates.current_blocker = value || '';
    else if (field === 'nextStep') dbUpdates.next_step = value || '';
    else if (field === 'remark') dbUpdates.remark = value || '';
    else if (field === 'assigneeId') dbUpdates.assignee_id = value || null;
  }
  if (Object.keys(dbUpdates).length === 0) throw new Error('没有可更新字段');

  const supabase = getSupabaseAdmin();
  const { data: existingRows, error: existingError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('project_id', session.projectId)
    .limit(1);
  if (existingError) throw new Error(`task query failed: ${existingError.message}`);
  const existingTask = existingRows?.[0];
  if (!existingTask) throw new Error('事项不存在');

  const [{ data: taskRows, error: allTasksError }, { data: contactRows, error: contactsError }] = await Promise.all([
    supabase.from('tasks').select('*').eq('project_id', session.projectId),
    supabase.from('project_contacts').select('*').eq('project_id', session.projectId),
  ]);
  if (allTasksError) throw new Error(`tasks query failed: ${allTasksError.message}`);
  if (contactsError) throw new Error(`contacts query failed: ${contactsError.message}`);
  const visibleIds = new Set(filterTasksForInstitution((taskRows || []).map(mapTask), (contactRows || []).map(mapContact), session.institution).map((task) => task.id));
  if (!visibleIds.has(taskId)) throw new Error('不可编辑非本机构可见事项');

  if (dbUpdates.assignee_id) {
    const assignee = (contactRows || []).find((row: any) => row.id === dbUpdates.assignee_id);
    if (!assignee) throw new Error('负责人必须从项目联系人中选择');
    dbUpdates.assignee = assignee.name || '';
  } else if ('assignee_id' in dbUpdates) {
    dbUpdates.assignee = '';
  }

  const { error: updateError } = await supabase.from('tasks').update(dbUpdates).eq('id', taskId).eq('project_id', session.projectId);
  if (updateError) throw new Error(`task update failed: ${updateError.message}`);

  return verifyPortalToken(token);
}


export async function updatePortalGanttCell(token: string, cellId: string, updates: Partial<Pick<GanttCell, 'date' | 'label' | 'type'>>): Promise<PortalPayload> {
  const session = await verifyPortalSession(token);
  if (!session.canEdit || session.institution !== '保荐人H') throw new Error('当前机构没有编辑甘特图权限');
  if (!cellId) throw new Error('缺少甘特节点 ID');

  const dbUpdates: Record<string, string | null> = {};
  if ('date' in updates) {
    const value = String(updates.date || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('日期格式无效');
    dbUpdates.cell_date = value;
  }
  if ('label' in updates) dbUpdates.label = String(updates.label || '').trim();
  if ('type' in updates) {
    const type = updates.type || 'keynode';
    if (!isEditableGanttType(type)) throw new Error('节点类型无效');
    dbUpdates.cell_type = type;
  }
  if (Object.keys(dbUpdates).length === 0) throw new Error('没有可更新字段');

  const supabase = getSupabaseAdmin();
  const { data: rows, error } = await supabase
    .from('gantt_cells')
    .select('id,task_id,cell_type')
    .eq('id', cellId)
    .limit(1);
  if (error) throw new Error(`gantt cell query failed: ${error.message}`);
  const cell = rows?.[0];
  if (!cell) throw new Error('甘特节点不存在');

  const { data: taskRows, error: taskError } = await supabase
    .from('tasks')
    .select('id,project_id')
    .eq('id', cell.task_id)
    .eq('project_id', session.projectId)
    .limit(1);
  if (taskError) throw new Error(`task query failed: ${taskError.message}`);
  if (!taskRows?.[0]) throw new Error('不可编辑非本项目甘特节点');

  const { error: updateError } = await supabase.from('gantt_cells').update(dbUpdates).eq('id', cellId);
  if (updateError) throw new Error(`gantt cell update failed: ${updateError.message}`);

  return verifyPortalToken(token);
}
