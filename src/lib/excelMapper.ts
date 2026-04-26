'use client';

import * as XLSX from 'xlsx';
import type { GanttCell, IpoProjectData, Task, TaskStatus, Workstream } from '@/types/ipo';

type HeaderMap = {
  otherPartyCol: number;
  lawyerCol: number;
  sponsorCol: number;
  titleCol: number;
  progressCol: number;
  blockerCol: number;
  nextStepCol: number;
  firstTimelineCol: number;
};

type RawRow = Array<string | number | null | undefined>;

type ParseMode = 'full' | 'workstreams' | 'gantt';

type GanttParseOptions = {
  mode: ParseMode;
  existingTasks?: Task[];
};

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function normalizeTitleKey(value: string): string {
  return value.replace(/\s+/g, '').trim().toLowerCase();
}

function normalizeDateValue(value: unknown): string | null {
  if (!value && value !== 0) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const d = new Date(parsed.y, parsed.m - 1, parsed.d);
    return d.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  if (!text) return null;
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function inferTaskStatus(progress: string, blocker: string, nextStep: string): TaskStatus {
  const p = progress.trim();
  const b = blocker.trim();
  if (!p || p === '无') return 'pending';

  const hasRealBlocker = !!b && b !== '无' && b !== '-' && b.toLowerCase() !== 'none';
  if (hasRealBlocker) return 'blocked';

  const startedKeywords = ['已完成', '已签署', '已选定', '已确定', '已传阅', '已发出', '已开始', '已提供', '已TMF'];
  const pendingKeywords = ['待', '暂未', '尚未'];

  if (startedKeywords.some((kw) => p.includes(kw))) return 'in_progress';
  if (pendingKeywords.some((kw) => p.startsWith(kw))) return 'pending';
  if (p || nextStep.trim()) return 'in_progress';
  return 'pending';
}

function findHeaderRow(rows: RawRow[]): number {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = (rows[i] || []).map(normalizeCell);
    const joined = row.join('|');
    if (joined.includes('事项')) {
      return i;
    }
  }
  return -1;
}

function detectFirstTimelineCol(normalized: string[], titleCol: number): number {
  for (let col = titleCol + 1; col < normalized.length; col++) {
    if (normalizeDateValue(normalized[col])) {
      return col;
    }
  }
  return -1;
}

function buildHeaderMap(headerRow: RawRow): HeaderMap {
  const normalized = headerRow.map(normalizeCell);
  const idx = (name: string) => normalized.findIndex((x) => x === name);
  const otherPartyCol = idx('分工-其他机构');
  const lawyerCol = idx('分工-律师');
  const sponsorCol = idx('分工-保荐人');
  const titleCol = idx('事项');
  const progressCol = idx('当前进度');
  const blockerCol = idx('当前卡点');
  const nextStepCol = idx('下一步');

  if (titleCol < 0) {
    throw new Error('Excel表头识别失败，请确认至少包含“事项”列');
  }

  const explicitBoundary = Math.max(otherPartyCol, lawyerCol, sponsorCol, progressCol, blockerCol, nextStepCol);
  const timelineByBoundary = explicitBoundary >= 0 ? explicitBoundary + 2 : -1;
  const timelineByDate = detectFirstTimelineCol(normalized, titleCol);
  const firstTimelineCol = timelineByBoundary >= 0 ? timelineByBoundary : timelineByDate;

  return { otherPartyCol, lawyerCol, sponsorCol, titleCol, progressCol, blockerCol, nextStepCol, firstTimelineCol };
}

function hasRequiredStructuredColumns(headerMap: HeaderMap): boolean {
  return [
    headerMap.otherPartyCol,
    headerMap.lawyerCol,
    headerMap.sponsorCol,
    headerMap.progressCol,
    headerMap.blockerCol,
    headerMap.nextStepCol,
  ].every((col) => col >= 0);
}

function isBlankRow(row: RawRow): boolean {
  return row.every((cell) => !normalizeCell(cell));
}

function getStructuredFilledCount(row: RawRow, headerMap: HeaderMap): number {
  const cols = [
    headerMap.sponsorCol,
    headerMap.lawyerCol,
    headerMap.otherPartyCol,
    headerMap.progressCol,
    headerMap.blockerCol,
    headerMap.nextStepCol,
  ].filter((col) => col >= 0);

  return cols
    .map((col) => normalizeCell(row[col] ?? ''))
    .filter(Boolean)
    .length;
}

function isWorkstreamRow(row: RawRow, headerMap: HeaderMap): boolean {
  const title = normalizeCell(row[headerMap.titleCol] ?? '');
  if (!title || !hasRequiredStructuredColumns(headerMap)) return false;
  return getStructuredFilledCount(row, headerMap) === 0;
}

function isTaskRow(row: RawRow, headerMap: HeaderMap): boolean {
  const title = normalizeCell(row[headerMap.titleCol] ?? '');
  if (!title) return false;

  if (hasRequiredStructuredColumns(headerMap)) {
    return getStructuredFilledCount(row, headerMap) > 0;
  }

  return true;
}

function extractTimelineDates(dateRow: RawRow, startCol: number): Record<number, string> {
  const map: Record<number, string> = {};
  if (startCol < 0) return map;
  for (let col = startCol; col < dateRow.length; col++) {
    const date = normalizeDateValue(dateRow[col]);
    if (date) map[col] = date;
  }
  return map;
}

function inferCellType(label: string): GanttCell['type'] {
  const lower = label.toLowerCase();
  if (lower === '开始' || lower === 'start' || lower === '▶ 开始' || lower.includes('启动')) return 'start';
  if (lower === 'ddl' || lower === '截止' || lower === '⏰ ddl' || lower.includes('deadline') || lower.includes('截止日')) return 'ddl';
  if (lower === '关键' || lower === '关键节点' || lower === '⭐ 关键' || lower === 'keynode' || lower === 'key node' || lower.includes('关键节点')) return 'keynode';
  if (lower.includes('签署') || lower.includes('定稿') || lower.includes('递交') || lower.includes('a1') || lower.includes('完成')) return 'milestone';
  return 'event';
}

function extractGanttCells(row: RawRow, taskId: string, timelineDates: Record<number, string>): GanttCell[] {
  const result: GanttCell[] = [];
  Object.entries(timelineDates).forEach(([colIndexStr, date]) => {
    const colIndex = Number(colIndexStr);
    const label = normalizeCell(row[colIndex] ?? '');
    if (!label) return;
    const type = inferCellType(label);
    result.push({ id: `gc-${taskId}-${date}-${colIndex}`, taskId, date, label, type });
  });

  const hasExplicitStart = result.some(c => c.type === 'start');
  const hasExplicitDdl = result.some(c => c.type === 'ddl');
  if (!hasExplicitStart || !hasExplicitDdl) {
    const sorted = [...result].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length >= 2) {
      if (!hasExplicitStart) {
        const first = result.find(c => c.id === sorted[0].id);
        if (first && first.type !== 'keynode' && first.type !== 'milestone') {
          first.type = 'start';
        }
      }
      if (!hasExplicitDdl) {
        const last = result.find(c => c.id === sorted[sorted.length - 1].id);
        if (last && last.type !== 'keynode' && last.type !== 'milestone') {
          last.type = 'ddl';
        }
      }
    }
  }

  return result;
}

function mapWorksheet(sheet: XLSX.WorkSheet, options: GanttParseOptions): IpoProjectData {
  const raw = XLSX.utils.sheet_to_json<RawRow>(sheet, { header: 1, raw: true, defval: '' });
  const headerRowIndex = findHeaderRow(raw);
  if (headerRowIndex < 0) throw new Error('未找到表头行，请确认包含“事项”列');

  const headerMap = buildHeaderMap(raw[headerRowIndex]);
  const timelineDates = extractTimelineDates(raw[headerRowIndex], headerMap.firstTimelineCol);

  const workstreams: Workstream[] = [];
  const tasks: Task[] = [];
  const ganttCells: GanttCell[] = [];

  let currentWorkstreamId = '';
  let workstreamSort = 1;
  let taskSeq = 1;

  const existingTaskMap = new Map<string, Task>();
  (options.existingTasks || []).forEach((task) => {
    existingTaskMap.set(normalizeTitleKey(task.title), task);
  });
  const unmatchedTitles = new Set<string>();

  for (let i = headerRowIndex + 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || isBlankRow(row)) continue;

    if (options.mode !== 'gantt' && isWorkstreamRow(row, headerMap)) {
      const name = normalizeCell(row[headerMap.titleCol] ?? '');
      const id = `ws-${workstreamSort}-${slugify(name) || workstreamSort}`;
      workstreams.push({ id, name, sortOrder: workstreamSort });
      currentWorkstreamId = id;
      workstreamSort += 1;
      continue;
    }

    if (!isTaskRow(row, headerMap)) continue;

    const title = normalizeCell(row[headerMap.titleCol] ?? '');
    const sponsor = headerMap.sponsorCol >= 0 ? normalizeCell(row[headerMap.sponsorCol] ?? '') : '';
    const lawyer = headerMap.lawyerCol >= 0 ? normalizeCell(row[headerMap.lawyerCol] ?? '') : '';
    const otherParty = headerMap.otherPartyCol >= 0 ? normalizeCell(row[headerMap.otherPartyCol] ?? '') : '';
    const currentProgress = headerMap.progressCol >= 0 ? normalizeCell(row[headerMap.progressCol] ?? '') : '';
    const currentBlocker = headerMap.blockerCol >= 0 ? normalizeCell(row[headerMap.blockerCol] ?? '') : '';
    const nextStep = headerMap.nextStepCol >= 0 ? normalizeCell(row[headerMap.nextStepCol] ?? '') : '';

    if (options.mode === 'gantt') {
      const matchedTask = existingTaskMap.get(normalizeTitleKey(title));
      if (!matchedTask) {
        unmatchedTitles.add(title);
        continue;
      }
      ganttCells.push(...extractGanttCells(row, matchedTask.id, timelineDates));
      continue;
    }

    if (!currentWorkstreamId) {
      currentWorkstreamId = 'ws-0-unclassified';
      if (!workstreams.find((x) => x.id === currentWorkstreamId)) {
        workstreams.push({ id: currentWorkstreamId, name: '未分类', sortOrder: 0 });
      }
    }

    const taskId = `task-${taskSeq}-${slugify(title) || taskSeq}`;
    tasks.push({
      id: taskId,
      workstreamId: currentWorkstreamId,
      title,
      sponsor,
      lawyer,
      otherParty,
      currentProgress,
      currentBlocker,
      nextStep,
      status: inferTaskStatus(currentProgress, currentBlocker, nextStep),
    });

    if (options.mode === 'full' && Object.keys(timelineDates).length > 0) {
      ganttCells.push(...extractGanttCells(row, taskId, timelineDates));
    }

    taskSeq += 1;
  }

  if (options.mode !== 'gantt' && !hasRequiredStructuredColumns(headerMap)) {
    throw new Error('条线/事项导入失败：请确认包含 分工-其他机构、分工-律师、分工-保荐人、当前进度、当前卡点、下一步 等列。');
  }

  if (options.mode === 'gantt') {
    if ((options.existingTasks || []).length === 0) {
      throw new Error('甘特图导入前请先导入条线/事项数据。');
    }
    if (Object.keys(timelineDates).length === 0) {
      throw new Error('甘特图导入失败：未识别到时间轴日期列。');
    }
    if (ganttCells.length === 0) {
      const samples = Array.from(unmatchedTitles).slice(0, 5).join('、');
      throw new Error(samples ? `甘特图导入失败：未匹配到已有事项，示例：${samples}` : '甘特图导入失败：未识别到任何有效节点。');
    }
  }

  return { workstreams, tasks, ganttCells, contacts: [] };
}

function readWorkbook(file: File): Promise<XLSX.WorkBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        resolve(workbook);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function parseSheet(file: File, options: GanttParseOptions): Promise<IpoProjectData> {
  const workbook = await readWorkbook(file);
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return mapWorksheet(firstSheet, options);
}

export function parseIpoExcelFile(file: File): Promise<IpoProjectData> {
  return parseSheet(file, { mode: 'full' });
}

export function parseWorkstreamsExcelFile(file: File): Promise<IpoProjectData> {
  return parseSheet(file, { mode: 'workstreams' });
}

export function parseGanttExcelFile(file: File, existingTasks: Task[]): Promise<IpoProjectData> {
  return parseSheet(file, { mode: 'gantt', existingTasks });
}
