#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const requiredFiles = [
  'migrations/006_institution_access_tokens.sql',
  'scripts/generate_phase2a_tokens.js',
  'src/lib/portalAuth.ts',
  'src/app/api/portal/verify/route.ts',
  'src/app/api/portal/tasks/route.ts',
  'src/app/api/portal/gantt/route.ts',
  'src/app/portal/page.tsx',
];

const requiredSnippets = [
  ['migrations/006_institution_access_tokens.sql', 'institution_access_tokens'],
  ['migrations/006_institution_access_tokens.sql', 'token_hash'],
  ['scripts/generate_phase2a_tokens.js', 'crypto.randomBytes'],
  ['scripts/generate_phase2a_tokens.js', 'sha256'],
  ['scripts/generate_phase2a_tokens.js', 'sponsor_h_edit'],
  ['src/lib/portalAuth.ts', 'verifyPortalToken'],
  ['src/lib/portalAuth.ts', 'filterTasksForInstitution'],
  ['src/lib/portalAuth.ts', "institution === '公司'"],
  ['src/lib/portalAuth.ts', "institution === '保荐人H'"],
  ['src/lib/portalAuth.ts', 'visibleTaskIds'],
  ['src/lib/portalAuth.ts', 'ganttCells'],
  ['src/lib/portalAuth.ts', "updates.type || 'keynode'"],
  ['src/lib/portalAuth.ts', 'updatePortalGanttCell'],
  ['src/lib/portalAuth.ts', '.map(({ id, name, email, institution, isKeyContact })'],
  ['src/lib/portalAuth.ts', "dbUpdates.assignee_id"],
  ['src/lib/portalAuth.ts', "contactRows || []).find"],
  ['src/app/api/portal/verify/route.ts', 'export async function POST'],
  ['src/app/api/portal/verify/route.ts', 'verifyPortalToken'],
  ['src/app/api/portal/tasks/route.ts', 'export async function PATCH'],
  ['src/app/api/portal/gantt/route.ts', 'export async function PATCH'],
  ['src/app/api/portal/gantt/route.ts', 'updatePortalGanttCell'],
  ['src/app/portal/page.tsx', 'useSearchParams'],
  ['src/app/portal/page.tsx', 'readonly'],
  ['src/app/portal/page.tsx', 'canEdit'],
  ['src/app/portal/page.tsx', '关键节点'],
  ['src/app/portal/page.tsx', '/api/portal/gantt'],
  ['src/app/portal/page.tsx', 'hideAssignee={!data.canEdit}'],
];

const failures = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`missing ${file}`);
}
for (const [file, snippet] of requiredSnippets) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) continue;
  const content = fs.readFileSync(full, 'utf8');
  if (!content.includes(snippet)) failures.push(`${file} missing snippet: ${snippet}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('phase2a portal static checks passed');
