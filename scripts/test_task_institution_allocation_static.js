const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const section = read('src/components/WorkstreamSection.tsx');
const portalAuth = read('src/lib/portalAuth.ts');
const context = read('src/context/IpoDataContext.tsx');

assert(section.includes('InstitutionMultiSelect'), 'WorkstreamSection should provide institution/work allocation multi-select');
assert(section.includes('分工'), 'WorkstreamSection should render a 分工 column/section');
assert(section.includes("field: 'sponsor' | 'lawyer' | 'otherParty'"), 'InstitutionMultiSelect should update sponsor/lawyer/otherParty fields');
assert(section.includes('onSave={(value) => handleUpdate(task.id, { sponsor: value })}'), 'sponsor allocation should be editable');
assert(section.includes('onSave={(value) => handleUpdate(task.id, { lawyer: value })}'), 'lawyer allocation should be editable');
assert(section.includes('onSave={(value) => handleUpdate(task.id, { otherParty: value })}'), 'otherParty allocation should be editable');
assert(section.includes('机构访问按分工过滤'), 'UI should communicate that allocation controls portal visibility');

assert(section.includes("sponsor: ['保荐人H', '保荐人C', '保荐人D']"), '保荐人分组只能显示 H/C/D');
assert(section.includes("lawyer: ['DP', 'FD', 'HSF', 'JT']"), '律师/顾问分组只能显示 DP/FD/HSF/JT');
assert(section.includes("otherParty: ['KP', 'CIC']"), '其他机构分组只能显示 KP/CIC');
assert(section.includes('options={institutionOptions.sponsor}'), 'sponsor multi-select should only receive sponsor options');
assert(section.includes('options={institutionOptions.lawyer}'), 'lawyer multi-select should only receive lawyer options');
assert(section.includes('options={institutionOptions.otherParty}'), 'otherParty multi-select should only receive other-party options');
assert(section.includes("{editing ? '收起' : '调整'}"), '分工 UI should be collapsed by default and expanded via 调整 to avoid accidental clicks');
assert(section.includes('selectedText'), 'collapsed allocation UI should summarize selected institutions');

assert(section.includes('const selected = new Set(parseInstitutionList(value))'), '分工默认勾选应来自既有 sponsor/lawyer/otherParty 字段');
assert(section.includes('const active = selected.has(institution)'), '分工按钮 active 状态应反映既有字段');
assert(section.includes("value={task.sponsor || ''}"), 'sponsor 多选应传入既有 sponsor 作为默认值');
assert(section.includes("value={task.lawyer || ''}"), 'lawyer 多选应传入既有 lawyer 作为默认值');
assert(section.includes("value={task.otherParty || ''}"), 'otherParty 多选应传入既有 otherParty 作为默认值');
assert(context.includes('dbUpdates.sponsor = updates.sponsor'), 'IpoDataContext updateTask should persist sponsor');
assert(context.includes('dbUpdates.lawyer = updates.lawyer'), 'IpoDataContext updateTask should persist lawyer');
assert(context.includes('dbUpdates.other_party = updates.otherParty'), 'IpoDataContext updateTask should persist otherParty');
assert(portalAuth.includes('fieldContainsInstitution(task.sponsor'), 'portal filtering should use sponsor allocation');
assert(portalAuth.includes('fieldContainsInstitution(task.lawyer'), 'portal filtering should use lawyer allocation');
assert(portalAuth.includes('fieldContainsInstitution(task.otherParty'), 'portal filtering should use otherParty allocation');
console.log('task institution allocation checks passed');
