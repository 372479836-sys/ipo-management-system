const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const types = read('src/types/ipo.ts');
const context = read('src/context/IpoDataContext.tsx');
const section = read('src/components/WorkstreamSection.tsx');
const page = read('src/app/workstreams/page.tsx');

assert(types.includes('export interface ProjectContact'), 'types should define ProjectContact');
assert(types.includes('contacts: ProjectContact[]'), 'IpoProjectData should include contacts');
assert(context.includes("from('project_contacts')"), 'IpoDataContext should fetch project_contacts');
assert(context.includes('contacts: ProjectContact[]'), 'IpoDataContext should load project_contacts into data.contacts');
assert(section.includes('AssigneeSelect'), 'WorkstreamSection should render AssigneeSelect instead of free text assignee');
assert(section.includes('contacts?: ProjectContact[]'), 'WorkstreamSection should accept contacts prop');
assert(section.includes('getCandidateContactsForTask'), 'WorkstreamSection should filter candidate contacts by task institutions');
assert(section.includes('未匹配机构人员'), 'assignee dropdown should show fallback when no institution contacts match');
assert(page.includes('contacts={data.contacts}'), 'workstreams page should pass contacts into WorkstreamSection');
console.log('contact dropdown source checks passed');
