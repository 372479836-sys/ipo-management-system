const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const portalAuth = fs.readFileSync(path.join(root, 'src/lib/portalAuth.ts'), 'utf8');
const portalPage = fs.readFileSync(path.join(root, 'src/app/portal/page.tsx'), 'utf8');
const ganttRoute = fs.readFileSync(path.join(root, 'src/app/api/portal/gantt/route.ts'), 'utf8');
const tasksRoute = fs.readFileSync(path.join(root, 'src/app/api/portal/tasks/route.ts'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

assert(portalAuth.includes('createPortalTask'), 'portalAuth exposes createPortalTask for 保荐人H新增事项');
assert(portalAuth.includes('createPortalGanttCell'), 'portalAuth exposes createPortalGanttCell for 新增甘特节点');
assert(portalAuth.includes('deletePortalGanttCell'), 'portalAuth exposes deletePortalGanttCell for 删除甘特节点');
assert(portalAuth.includes("session.institution !== '保荐人H'"), 'write APIs keep 保荐人H institution guard');
assert(portalAuth.includes("supabase.from('tasks').insert"), '新增事项 writes to tasks table');
assert(portalAuth.includes("supabase.from('gantt_cells').insert"), '新增甘特节点 writes to gantt_cells table');
assert(portalAuth.includes("supabase.from('gantt_cells').delete"), '删除甘特节点 deletes from gantt_cells table');
assert(portalAuth.includes('workstream_id') && portalAuth.includes('sort_order'), '新增事项 includes workstream and sort order fields');

assert(tasksRoute.includes('export async function POST') && tasksRoute.includes('createPortalTask'), 'portal tasks route supports POST create');
assert(ganttRoute.includes('export async function POST') && ganttRoute.includes('createPortalGanttCell'), 'portal gantt route supports POST create');
assert(ganttRoute.includes('export async function DELETE') && ganttRoute.includes('deletePortalGanttCell'), 'portal gantt route supports DELETE remove');

assert(portalPage.includes('NewPortalTaskForm'), 'portal UI renders 保荐人H新增事项 form');
assert(portalPage.includes('新增事项'), 'portal UI has 新增事项 entry point');
assert(portalPage.includes('新增节点'), 'portal UI has 新增节点 controls');
assert(portalPage.includes('删除节点'), 'portal UI has 删除节点 controls');
assert(portalPage.includes('完整甘特分布'), 'portal UI shows full gantt distribution section');
assert(portalPage.includes("method: 'POST'") && portalPage.includes('/api/portal/tasks'), 'portal UI posts new tasks');
assert(portalPage.includes("method: 'POST'") && portalPage.includes('/api/portal/gantt'), 'portal UI posts new gantt cells');
assert(portalPage.includes("method: 'DELETE'") && portalPage.includes('/api/portal/gantt'), 'portal UI deletes gantt cells');

console.log('\n保荐人H门户增强静态检查通过');
