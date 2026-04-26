const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function assert(cond, msg) { if (!cond) { console.error(`❌ ${msg}`); process.exit(1); } }

const portalPage = read('src/app/portal/page.tsx');
const ganttRoute = read('src/app/api/portal/gantt/route.ts');
const middleware = read('src/middleware.ts');
const feedbackRoute = read('src/app/api/portal/feedbacks/route.ts');

// Regression 1: portal addGanttMarker must match /api/portal/gantt POST contract.
assert(
  portalPage.includes('JSON.stringify({ token, taskId, updates: { date, type, label } })'),
  'portal addGanttMarker should POST { token, taskId, updates: { date, type, label } }'
);
assert(
  ganttRoute.includes("const taskId = typeof body?.taskId === 'string' ? body.taskId : ''") &&
  ganttRoute.includes('const updates = body?.updates'),
  'gantt POST route should read top-level taskId and updates'
);
assert(!portalPage.includes('cell: { taskId, date, type, label }'), 'portal should not send legacy cell wrapper for gantt POST');

// Regression 2: Basic Auth must fail closed in production if credentials are missing.
assert(middleware.includes("process.env.NODE_ENV === 'production'"), 'middleware should branch on NODE_ENV');
assert(/if \(!adminUser \|\| !adminPassword\)[\s\S]*return unauthorized\(\)/.test(middleware), 'missing admin credentials should return unauthorized in production');

// Regression 3: feedback route input should be explicit instead of accepting whole body as update/feedback payload.
assert(feedbackRoute.includes('const feedback = body?.feedback && typeof body.feedback ==='), 'feedback POST should explicitly require body.feedback object');
assert(feedbackRoute.includes('const updates = body?.updates && typeof body.updates ==='), 'feedback PATCH should explicitly require body.updates object');
assert(!feedbackRoute.includes('body.feedback || body'), 'feedback POST should not fall back to full request body');
assert(!feedbackRoute.includes('body.updates || body'), 'feedback PATCH should not fall back to full request body');

console.log('✅ portal review fix static tests passed');
