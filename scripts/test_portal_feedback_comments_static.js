const fs = require('fs');
const path = require('path');

const root = process.cwd();
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function assert(cond, msg) { if (!cond) { console.error(`❌ ${msg}`); process.exit(1); } console.log(`✅ ${msg}`); }

const types = read('src/types/ipo.ts');
assert(types.includes('export interface TaskFeedback'), 'types exposes TaskFeedback');
assert(types.includes("'current_progress' | 'next_step' | 'remark' | 'gantt_node'"), 'feedback target fields cover progress/next_step/remark/gantt');
assert(types.includes("'open' | 'accepted' | 'rejected' | 'resolved'"), 'feedback status enum exists');

const portalAuth = read('src/lib/portalAuth.ts');
assert(portalAuth.includes('TaskFeedback'), 'portalAuth imports/uses TaskFeedback');
assert(portalAuth.includes('getPortalFeedbacks'), 'portalAuth exposes getPortalFeedbacks');
assert(portalAuth.includes('createPortalFeedback'), 'portalAuth exposes createPortalFeedback');
assert(portalAuth.includes('updatePortalFeedback'), 'portalAuth exposes updatePortalFeedback');
assert(portalAuth.includes("from('task_feedbacks')"), 'portalAuth reads/writes task_feedbacks');
assert(portalAuth.includes('filterFeedbacksForInstitution'), 'portalAuth filters feedback by institution visibility');
assert(portalAuth.includes('assertTaskVisibleToInstitution'), 'portalAuth verifies ordinary institution task visibility before feedback');
assert(portalAuth.includes('accepted') && portalAuth.includes('updatePortalTask'), 'accepted feedback can be applied to official task fields');

const routePath = path.join(root, 'src/app/api/portal/feedbacks/route.ts');
assert(fs.existsSync(routePath), 'portal feedback API route exists');
const route = fs.readFileSync(routePath, 'utf8');
assert(route.includes('GET') && route.includes('POST') && route.includes('PATCH'), 'feedback API supports GET/POST/PATCH');
assert(route.includes('getPortalFeedbacks') && route.includes('createPortalFeedback') && route.includes('updatePortalFeedback'), 'feedback API calls portalAuth helpers');

const portalPage = read('src/app/portal/page.tsx');
assert(portalPage.includes('FeedbackForm'), 'portal page contains FeedbackForm');
assert(portalPage.includes('/api/portal/feedbacks'), 'portal page calls feedback API');
assert(portalPage.includes('提交反馈'), 'portal page shows submit feedback UI');
assert(portalPage.includes('当前进度') && portalPage.includes('下一步计划') && portalPage.includes('备注') && portalPage.includes('甘特节点'), 'portal feedback covers requested targets');

const workstream = read('src/components/WorkstreamSection.tsx');
assert(workstream.includes('FeedbackDrawer'), 'workstream view contains FeedbackDrawer');
assert(workstream.includes('反馈') && workstream.includes('💬'), 'workstream view shows feedback count/badge');
assert(workstream.includes('采纳') && workstream.includes('标记已处理'), 'workstream drawer supports accept/resolve actions');

const context = read('src/context/IpoDataContext.tsx');
assert(context.includes('feedbacks') && context.includes('loadFeedbacks') && context.includes('updateFeedback'), 'IpoDataContext loads and updates feedbacks');

console.log('\n🎉 portal feedback comments static checks passed');
