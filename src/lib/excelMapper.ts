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

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function normalizeDateValue(value: unknown): string | null {
  if (!value) return null;
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
  const p = progress.toLowerCase();
  const b = blocker.toLowerCase();
  if (
    p.includes('已完成') || p.includes('完成') ||
    p.includes('已签署') || p.includes('已选定') || p.includes('已传阅')
  ) return 'completed';
  if (b && b !== '无' && b !== '-' && b !== 'none') return 'blocked';
  if (progress || nextStep) return 'in_progress';
  return 'pending';
}

function findHeaderRow(rows: RawRow[]): number {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = (rows[i] || []).map(normalizeCell);
    const joined = row.join('|');
    if (joined.includes('事项') && joined.includes('当前进度') && joined.includes('当前卡点') && joined.includes('下一步')) {
      return i;
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
  const firstTimelineCol = Math.max(otherPartyCol, lawyerCol, sponsorCol, titleCol, progressCol, blockerCol, nextStepCol) + 2;
  if (otherPartyCol < 0 || lawyerCol < 0 || sponsorCol < 0 || titleCol < 0 || progressCol < 0 || blockerCol < 0 || nextStepCol < 0) {
    throw new Error('Excel表头识别失败，请确认包含：分工-其他机构/分工-律师/分工-保荐人/事项/当前进度/当前卡点/下一步');
  }
  return { otherPartyCol, lawyerCol, sponsorCol, titleCol, progressCol, blockerCol, nextStepCol, firstTimelineCol };
}

function isBlankRow(row: RawRow): boolean {
  return row.every((cell) => !normalizeCell(cell));
}

function isWorkstreamRow(row: RawRow, headerMap: HeaderMap): boolean {
  const title = normalizeCell(row[headerMap.titleCol] ?? '');
  if (!title) return false;
  const filledCount = [
    normalizeCell(row[headerMap.sponsorCol] ?? ''),
    normalizeCell(row[headerMap.lawyerCol] ?? ''),
    normalizeCell(row[headerMap.otherPartyCol] ?? ''),
    normalizeCell(row[headerMap.progressCol] ?? ''),
    normalizeCell(row[headerMap.blockerCol] ?? ''),
    normalizeCell(row[headerMap.nextStepCol] ?? ''),
  ].filter(Boolean).length;
  return filledCount === 0;
}

function isTaskRow(row: RawRow, headerMap: HeaderMap): boolean {
  const title = normalizeCell(row[headerMap.titleCol] ?? '');
  if (!title) return false;
  const filledCount = [
    normalizeCell(row[headerMap.sponsorCol] ?? ''),
    normalizeCell(row[headerMap.lawyerCol] ?? ''),
    normalizeCell(row[headerMap.otherPartyCol] ?? ''),
    normalizeCell(row[headerMap.progressCol] ?? ''),
    normalizeCell(row[headerMap.blockerCol] ?? ''),
    normalizeCell(row[headerMap.nextStepCol] ?? ''),
  ].filter(Boolean).length;
  return filledCount > 0;
}

function extractTimelineDates(dateRow: RawRow, startCol: number): Record<number, string> {
  const map: Record<number, string> = {};
  for (let col = startCol; col < dateRow.length; col++) {
    const date = normalizeDateValue(dateRow[col]);
    if (date) map[col] = date;
  }
  return map;
}

function inferCellType(label: string): GanttCell['type'] {
  const lower = label.toLowerCase();
  // 明确标记的优先
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

  // 自动推断 start/ddl：如果该task没有明确标记的start/ddl，
  // 则最早日期的cell标为start，最晚日期的cell标为ddl（需至少2个cell）
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

export function mapWorksheetToIpoData(sheet: XLSX.WorkSheet): IpoProjectData {
  const raw = XLSX.utils.sheet_to_json<RawRow>(sheet, { header: 1, raw: true, defval: '' });
  const headerRowIndex = findHeaderRow(raw);
  if (headerRowIndex < 0) throw new Error('未找到表头行');
  const headerMap = buildHeaderMap(raw[headerRowIndex]);
  const timelineDates = extractTimelineDates(raw[headerRowIndex], headerMap.firstTimelineCol);
  const workstreams: Workstream[] = [];
  const tasks: Task[] = [];
  const ganttCells: GanttCell[] = [];
  let currentWorkstreamId = '';
  let workstreamSort = 1;
  let taskSeq = 1;
  for (let i = headerRowIndex + 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || isBlankRow(row)) continue;
    if (isWorkstreamRow(row, headerMap)) {
      const name = normalizeCell(row[headerMap.titleCol] ?? '');
      const id = `ws-${workstreamSort}-${slugify(name) || workstreamSort}`;
      workstreams.push({ id, name, sortOrder: workstreamSort });
      currentWorkstreamId = id;
      workstreamSort += 1;
      continue;
    }
    if (isTaskRow(row, headerMap)) {
      const title = normalizeCell(row[headerMap.titleCol] ?? '');
      const sponsor = normalizeCell(row[headerMap.sponsorCol] ?? '');
      const lawyer = normalizeCell(row[headerMap.lawyerCol] ?? '');
      const otherParty = normalizeCell(row[headerMap.otherPartyCol] ?? '');
      const currentProgress = normalizeCell(row[headerMap.progressCol] ?? '');
      const currentBlocker = normalizeCell(row[headerMap.blockerCol] ?? '');
      const nextStep = normalizeCell(row[headerMap.nextStepCol] ?? '');
      if (!currentWorkstreamId) {
        currentWorkstreamId = 'ws-0-unclassified';
        if (!workstreams.find((x) => x.id === currentWorkstreamId)) {
          workstreams.push({ id: currentWorkstreamId, name: '未分类', sortOrder: 0 });
        }
      }
      const taskId = `task-${taskSeq}-${slugify(title) || taskSeq}`;
      tasks.push({
        id: taskId, workstreamId: currentWorkstreamId, title, sponsor, lawyer, otherParty,
        currentProgress, currentBlocker, nextStep,
        status: inferTaskStatus(currentProgress, currentBlocker, nextStep),
      });
      ganttCells.push(...extractGanttCells(row, taskId, timelineDates));
      taskSeq += 1;
    }
  }
  return { workstreams, tasks, ganttCells };
}

export function parseIpoExcelFile(file: File): Promise<IpoProjectData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const mapped = mapWorksheetToIpoData(firstSheet);
        resolve(mapped);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
