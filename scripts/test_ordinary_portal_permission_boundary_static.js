const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
};

const portalPage = read('src/app/portal/page.tsx');
const portalAuth = read('src/lib/portalAuth.ts');
const navBar = read('src/components/NavBar.tsx');
const globalSearch = read('src/components/GlobalSearch.tsx');
const middleware = read('src/middleware.ts');

assert(portalAuth.includes("return isSponsorHEditInstitution(institution) ? 'sponsor_h_edit' : 'readonly'"), 'only 保荐人H gets sponsor_h_edit permission');
assert(portalAuth.includes("canEdit: permission === 'sponsor_h_edit' && tokenRow.institution === '保荐人H'"), 'canEdit is strictly tied to 保荐人H');
assert(portalAuth.includes("requireSponsorHEdit(session, '删除事项')"), 'portal task deletion requires sponsor H edit');
assert(portalAuth.includes("requireSponsorHEdit(session, '删除甘特图节点')"), 'portal gantt deletion requires sponsor H edit');
assert(portalPage.includes('data.canEdit && <WorkstreamManager'), 'workstream manager is gated by canEdit');
assert(portalPage.includes('data.canEdit && <NewPortalTaskForm'), 'new task form is gated by canEdit');
assert(portalPage.includes('readOnly={!data.canEdit}') && portalPage.includes('onUpdateTask={data.canEdit ? updateTask : undefined}'), 'editable task card is gated by canEdit');
assert(portalPage.includes('hideAssignee={!data.canEdit}') && portalPage.includes('onRemoveTask={data.canEdit ? removeTask : undefined}'), 'readonly task card exists for ordinary institutions');
assert(portalPage.includes('data.canEdit ? addGanttMarker : undefined'), 'full gantt distribution is gated by canEdit');
assert(navBar.includes('const isPortal = pathname?.startsWith(\'/portal\')'), 'NavBar detects portal routes');
assert(navBar.includes('if (isPortal) return null;'), 'NavBar is hidden on institution portal');
assert(globalSearch.includes('const pathname = usePathname();'), 'GlobalSearch can detect current route');
assert(globalSearch.includes('if (pathname?.startsWith(\'/portal\')) return [];'), 'GlobalSearch does not expose all tasks on portal');
assert(middleware.includes("'/portal'") && middleware.includes("'/api/portal'"), 'portal and portal APIs remain public token-authenticated paths');
console.log('ordinary portal boundary static checks passed');
