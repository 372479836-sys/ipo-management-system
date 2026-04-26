import * as XLSX from 'xlsx';
import { ProjectContact } from '@/types/ipo';

export type ParsedContactInput = Omit<ProjectContact, 'id'>;

function cleanCell(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function normalizeContactRow(row: Record<string, unknown>): ParsedContactInput | null {
  let institution = cleanCell(row['机构'] ?? row['institution']);
  let rawName = cleanCell(row['姓名'] ?? row['name']);
  const email = cleanCell(row['对应机构邮箱'] ?? row['email']);

  if (!institution || !rawName || !email) return null;

  const isKeyContact = rawName.includes('*');
  const name = rawName.replace(/\*/g, '').replace(/\s+/g, ' ').trim();

  // 用户确认：谢贻 Lois Xie 是保荐人C人员，避免因共享邮箱误判机构。
  if (name.includes('谢贻') || name.toLowerCase().includes('lois xie')) {
    institution = '保荐人C';
  }

  return {
    name,
    email,
    institution,
    department: institution,
    role: '',
    phone: '',
    isKeyContact,
  };
}

export async function parseContactsExcelFile(file: File): Promise<ParsedContactInput[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: '' });

  const contacts: ParsedContactInput[] = [];
  const seen = new Set<string>();

  for (const raw of rawRows) {
    if (!Array.isArray(raw)) continue;
    const cells = raw.map(cleanCell);
    const emailIndex = cells.findIndex(value => /@/.test(value));
    if (emailIndex < 2) continue;
    const row: Record<string, unknown> = {
      '机构': cells[emailIndex - 2],
      '姓名': cells[emailIndex - 1],
      '对应机构邮箱': cells[emailIndex],
    };
    const contact = normalizeContactRow(row);
    if (!contact) continue;
    const key = `${contact.institution}::${contact.name}::${contact.email}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    contacts.push(contact);
  }

  return contacts;
}
