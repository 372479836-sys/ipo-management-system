const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const portalAuth = fs.readFileSync(path.join(root, 'src/lib/portalAuth.ts'), 'utf8');
const portalPage = fs.readFileSync(path.join(root, 'src/app/portal/page.tsx'), 'utf8');
const tasksRoute = fs.readFileSync(path.join(root, 'src/app/api/portal/tasks/route.ts'), 'utf8');
const workstreamsRoutePath = path.join(root, 'src/app/api/portal/workstreams/route.ts');
const workstreamsRoute = fs.existsSync(workstreamsRoutePath) ? fs.readFileSync(workstreamsRoutePath, 'utf8') : '';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

assert(portalAuth.includes('createPortalWorkstream'), 'portalAuth exposes createPortalWorkstream for 保荐人H新增大条线');
assert(portalAuth.includes('updatePortalWorkstream'), 'portalAuth exposes updatePortalWorkstream for 保荐人H重命名大条线');
assert(portalAuth.includes('deletePortalWorkstream'), 'portalAuth exposes deletePortalWorkstream for 保荐人H删除大条线');
assert(portalAuth.includes('deletePortalTask'), 'portalAuth exposes deletePortalTask for 保荐人H删除事项');
assert(portalAuth.includes('title') && portalAuth.includes('workstreamId') && portalAuth.includes('sponsor') && portalAuth.includes('lawyer') && portalAuth.includes('otherParty'), 'portalAuth editable task fields include title/workstream/allocation fields');
assert(portalAuth.includes("supabase.from('workstreams').insert"), '新增大条线 writes to workstreams table');
assert(portalAuth.includes("supabase.from('workstreams').update"), '重命名大条线 updates workstreams table');
assert(portalAuth.includes("supabase.from('workstreams').delete"), '删除大条线 deletes from workstreams table');
assert(portalAuth.includes("supabase.from('tasks').delete"), '删除事项 deletes from tasks table');
assert(portalAuth.includes('gantt_cells') && portalAuth.includes('task_id'), '删除事项 also handles linked gantt_cells');
assert(portalAuth.includes("session.institution !== '保荐人H'"), 'all write APIs keep 保荐人H institution guard');

assert(tasksRoute.includes('export async function DELETE') && tasksRoute.includes('deletePortalTask'), 'portal tasks route supports DELETE task');
assert(workstreamsRoute.includes('export async function POST') && workstreamsRoute.includes('createPortalWorkstream'), 'portal workstreams route supports POST create');
assert(workstreamsRoute.includes('export async function PATCH') && workstreamsRoute.includes('updatePortalWorkstream'), 'portal workstreams route supports PATCH rename');
assert(workstreamsRoute.includes('export async function DELETE') && workstreamsRoute.includes('deletePortalWorkstream'), 'portal workstreams route supports DELETE remove');

assert(portalPage.includes('WorkstreamManager'), 'portal UI renders 保荐人H大条线管理');
assert(portalPage.includes('新增大条线'), 'portal UI has 新增大条线 entry point');
assert(portalPage.includes('重命名') && portalPage.includes('删除条线'), 'portal UI can rename/delete workstreams');
assert(portalPage.includes('事项名称') && portalPage.includes('所属条线'), 'portal UI can adjust task title and workstream');
assert(portalPage.includes('删除事项'), 'portal UI has 删除事项 control');
assert(portalPage.includes("method: 'DELETE'") && portalPage.includes('/api/portal/tasks'), 'portal UI deletes tasks');
assert(portalPage.includes('/api/portal/workstreams'), 'portal UI calls workstreams API');

console.log('\n保荐人H条线与事项完整维护静态检查通过');
