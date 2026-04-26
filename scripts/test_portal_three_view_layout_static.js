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

assert(portalPage.includes("type PortalTab = 'dashboard' | 'workstreams' | 'gantt'"), 'portal defines dashboard/workstreams/gantt tab type');
assert(portalPage.includes('const [activeTab, setActiveTab]'), 'portal has active tab state');
assert(portalPage.includes('PortalDashboardView'), 'portal includes dashboard view component');
assert(portalPage.includes('PortalWorkstreamsView') || portalPage.includes("activeTab === 'workstreams'"), 'portal includes workstreams view component');
assert(portalPage.includes('PortalGanttView') || portalPage.includes('PortalGanttTimeline'), 'portal includes gantt view component');
assert(portalPage.includes('Dashboard') && portalPage.includes('条线视图') && portalPage.includes('甘特视图'), 'portal renders three main-view tabs');
assert(portalPage.includes('总体进度') && portalPage.includes('未来7天 DDL / 里程碑') && portalPage.includes('各条线事项分布'), 'portal dashboard mirrors admin dashboard sections');
assert(portalPage.includes('data.canEdit && <WorkstreamManager') && portalPage.includes('data.canEdit && <NewPortalTaskForm'), 'sponsor H management controls remain canEdit gated');
assert(portalPage.includes('<WorkstreamSection') && portalPage.includes('readOnly={!data.canEdit}'), 'workstream task cards keep editable/readonly split');
assert(portalPage.includes('<GanttGrid') && portalPage.includes('ganttCells={data.ganttCells}'), 'portal gantt tab includes timeline-style gantt view');
assert(portalPage.includes('data.canEdit ? addGanttMarker : undefined'), 'full gantt editing remains sponsor H only');

console.log('portal three-view layout static checks passed');
