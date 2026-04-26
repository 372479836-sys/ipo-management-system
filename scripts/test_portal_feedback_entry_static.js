const fs = require('fs');

const component = fs.readFileSync('src/components/WorkstreamSection.tsx', 'utf8');
const portal = fs.readFileSync('src/app/portal/page.tsx', 'utf8');

function assert(cond, msg) {
  if (!cond) {
    console.error('❌ ' + msg);
    process.exit(1);
  }
  console.log('✅ ' + msg);
}

assert(component.includes('onCreateFeedback'), 'WorkstreamSection exposes onCreateFeedback prop for portal users');
assert(component.includes('setCreateFeedbackTaskId(task.id)') || component.includes('提交反馈'), 'each task can open a create feedback drawer even without existing feedback');
assert(component.includes('taskFeedbacks.length > 0') && component.includes('openFeedbackCount'), 'existing feedback count badge is still available');
assert(portal.includes('createFeedback') && portal.includes('/api/portal/feedbacks'), 'portal page wires feedback creation API');
assert(portal.includes('onCreateFeedback={data.canEdit ? undefined : createFeedback}') || portal.includes('onCreateFeedback={!data.canEdit ? createFeedback : undefined}'), 'ordinary portal passes create feedback handler into WorkstreamSection');

console.log('ordinary portal feedback entry static checks passed');
