const fs = require('fs');
const path = require('path');

const root = process.cwd();
function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}
function assert(cond, msg) {
  if (!cond) {
    console.error(msg);
    process.exit(1);
  }
}

const section = read('src/components/WorkstreamSection.tsx');
const admin = read('src/components/admin/TaskAllocationAdmin.tsx');
const adminPage = read('src/app/admin/page.tsx');
const portalAuth = read('src/lib/portalAuth.ts');

assert(section.includes('当前分工：{parties}'), '条线视图应在事项下方以小字显示当前分工');
assert(!section.includes('InstitutionMultiSelect'), '条线视图不应包含分工调整控件');
assert(!section.includes('机构访问按分工过滤；点击“调整”后再修改'), '条线视图不应显示分工调整提示');
assert(!section.includes('w-[260px]">分工'), '条线视图不应保留独立分工编辑列');

assert(admin.includes('export default function TaskAllocationAdmin'), '管理功能应包含事项机构分工组件');
assert(admin.includes("sponsor: ['保荐人H', '保荐人C', '保荐人D']"), '管理端保荐人候选应限定 H/C/D');
assert(admin.includes("lawyer: ['DP', 'FD', 'HSF', 'JT']"), '管理端律师/顾问候选应限定 DP/FD/HSF/JT');
assert(admin.includes("otherParty: ['KP', 'CIC']"), '管理端其他参与方候选应限定 KP/CIC');
assert(admin.includes("onUpdateTask(task.id, { sponsor: value })"), '管理端应可更新 sponsor');
assert(admin.includes("onUpdateTask(task.id, { lawyer: value })"), '管理端应可更新 lawyer');
assert(admin.includes("onUpdateTask(task.id, { otherParty: value })"), '管理端应可更新 otherParty');
assert(adminPage.includes('TaskAllocationAdmin'), 'admin/page 应挂载 TaskAllocationAdmin');

assert(!portalAuth.includes("'sponsor'"), '外部门户后端不应允许修改 sponsor');
assert(!portalAuth.includes("'lawyer'"), '外部门户后端不应允许修改 lawyer');
assert(!portalAuth.includes("'otherParty'"), '外部门户后端不应允许修改 otherParty');
assert(portalAuth.includes('sponsor_h_edit'), '外部门户仍保留保荐人H进度编辑权限');

console.log('admin-only task allocation checks passed');
