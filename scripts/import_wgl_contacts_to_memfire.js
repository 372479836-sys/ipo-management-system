#!/usr/bin/env node
/*
 * Import WGL.xlsx contacts into MemFire/Supabase project_contacts.
 * Usage:
 *   node scripts/import_wgl_contacts_to_memfire.js /path/to/WGL.xlsx
 * Prerequisite:
 *   Run migrations/005_project_contacts.sql in MemFire SQL editor first.
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_XLSX = '/Users/jyf/.hermes/cache/documents/doc_84f0efde5fed_WGL.xlsx';
const isDryRun = process.argv.includes('--dry-run');
const filePath = process.argv.find(arg => arg.endsWith('.xlsx')) || DEFAULT_XLSX;

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  const text = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function parseContacts(xlsxPath) {
  const workbook = XLSX.readFile(xlsxPath, { cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const seen = new Set();
  const contacts = [];

  for (const raw of rawRows) {
    const cells = raw.map(clean);
    const emailIndex = cells.findIndex(v => /@/.test(v));
    if (emailIndex < 2) continue;
    let institution = cells[emailIndex - 2];
    let rawName = cells[emailIndex - 1];
    const email = cells[emailIndex];
    if (!institution || !rawName || !email) continue;

    const isKeyContact = rawName.includes('*');
    const name = rawName.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
    if (name.includes('谢贻') || name.toLowerCase().includes('lois xie')) {
      institution = '保荐人C';
    }

    const key = `${institution}::${name}::${email}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    contacts.push({ institution, name, email, department: institution, role: null, phone: null, is_key_contact: isKeyContact });
  }
  return contacts;
}

async function getOrCreateProjectId(supabase) {
  const { data, error } = await supabase.from('projects').select('id').order('created_at', { ascending: true }).limit(1);
  if (error) throw new Error(`projects query: ${error.message}`);
  if (data && data.length > 0) return data[0].id;
  const { data: created, error: createErr } = await supabase.from('projects').insert({ name: 'Project Yangtze 进度跟踪' }).select('id').single();
  if (createErr) throw new Error(`projects create: ${createErr.message}`);
  return created.id;
}

async function main() {
  if (!fs.existsSync(filePath)) throw new Error(`Excel not found: ${filePath}`);
  const contacts = parseContacts(filePath);
  if (contacts.length !== 57) throw new Error(`Expected 57 contacts, got ${contacts.length}`);

  const counts = contacts.reduce((acc, c) => {
    acc[c.institution] = (acc[c.institution] || 0) + 1;
    return acc;
  }, {});

  if (isDryRun) {
    console.log(JSON.stringify({ dryRun: true, parsed: contacts.length, counts, sample: contacts.slice(0, 3) }, null, 2));
    return;
  }

  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');

  const supabase = createClient(url, key);
  const projectId = await getOrCreateProjectId(supabase);
  const rows = contacts.map(c => ({ ...c, project_id: projectId }));

  const { error: deleteError } = await supabase.from('project_contacts').delete().eq('project_id', projectId);
  if (deleteError) throw new Error(`project_contacts delete failed. Did you run migrations/005_project_contacts.sql? ${deleteError.message}`);

  const { error: insertError } = await supabase.from('project_contacts').insert(rows);
  if (insertError) throw new Error(`project_contacts insert failed: ${insertError.message}`);

  console.log(JSON.stringify({ imported: contacts.length, projectId, counts }, null, 2));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
