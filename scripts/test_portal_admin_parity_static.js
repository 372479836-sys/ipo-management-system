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
const workstreamSection = read('src/components/WorkstreamSection.tsx');
const ganttGrid = read('src/components/GanttGrid.tsx');

assert(portalPage.includes('import WorkstreamSection') && portalPage.includes('@/components/WorkstreamSection'), 'portal imports the same WorkstreamSection used by admin workstream view');
assert(portalPage.includes('<WorkstreamSection') && portalPage.includes('tasks={wsTasks}') && portalPage.includes('defaultOpen'), 'portal workstream tab renders admin-style WorkstreamSection rows');
assert(portalPage.includes('readOnly') && workstreamSection.includes('readOnly?: boolean'), 'WorkstreamSection exposes readOnly mode for ordinary portal users');
assert(portalPage.includes('hideAssignee') && workstreamSection.includes('hideAssignee?: boolean'), 'WorkstreamSection can hide institution personnel/assignee column in portal');
assert(!portalPage.includes('项目联系人') && !portalPage.includes('本机构联系人') && !portalPage.includes('data.contacts.map((contact)'), 'portal does not render institution personnel/contact list');
assert(portalPage.includes('import GanttGrid') && portalPage.includes('@/components/GanttGrid'), 'portal imports admin GanttGrid component');
assert(portalPage.includes('<GanttGrid') && portalPage.includes('workstreams={data.workstreams}') && portalPage.includes('tasks={data.tasks}') && portalPage.includes('ganttCells={data.ganttCells}'), 'portal gantt tab renders admin-style timeline matrix with filtered portal data');
assert(ganttGrid.includes('readOnly?: boolean') && ganttGrid.includes('onAddMarker &&') && ganttGrid.includes('onRemoveCell &&') && ganttGrid.includes('onMoveCell &&'), 'GanttGrid supports permission-safe readOnly/callback-gated interactions');
assert(portalPage.includes('FeedbackDrawer') || portalPage.includes('PortalCommentDrawer'), 'portal comments are added through a task-level drawer/dialog, not repeated per-field inline forms');
assert(!portalPage.includes('反馈人姓名') && !portalPage.includes('contactEmail') && !portalPage.includes('邮箱（可选）'), 'portal comment UX does not ask institutions to re-enter personnel name/email');

console.log('portal admin parity static checks passed');
