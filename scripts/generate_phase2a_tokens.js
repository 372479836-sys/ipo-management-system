#!/usr/bin/env node
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function parseArgs(argv) {
  const args = { dryRun: false, baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--base-url') args.baseUrl = argv[++i];
    else if (arg === '--project-id') args.projectId = argv[++i];
  }
  return args;
}

function permissionForInstitution(institution) {
  return institution === '保荐人H' ? 'sponsor_h_edit' : 'readonly';
}

async function main() {
  const args = parseArgs(process.argv);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  let projectId = args.projectId;
  if (!projectId) {
    const { data: projects, error } = await supabase.from('projects').select('id,name').order('created_at', { ascending: false }).limit(1);
    if (error) throw error;
    if (!projects || projects.length === 0) throw new Error('No project found');
    projectId = projects[0].id;
  }

  const { data: contacts, error: contactsError } = await supabase
    .from('project_contacts')
    .select('institution')
    .eq('project_id', projectId);
  if (contactsError) throw contactsError;

  const institutions = Array.from(new Set((contacts || []).map((c) => c.institution).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-CN'));
  if (!institutions.includes('公司')) institutions.unshift('公司');

  const rows = [];
  for (const institution of institutions) {
    const token = crypto.randomBytes(32).toString('base64url');
    rows.push({
      project_id: projectId,
      institution,
      token_hash: sha256(token),
      token_prefix: token.slice(0, 8),
      permission: permissionForInstitution(institution),
      token,
      url: `${args.baseUrl.replace(/\/$/, '')}/portal?token=${encodeURIComponent(token)}`,
    });
  }

  if (!args.dryRun) {
    const { error: deleteError } = await supabase.from('institution_access_tokens').delete().eq('project_id', projectId);
    if (deleteError) throw new Error(`delete tokens failed: ${deleteError.message}`);
    const insertRows = rows.map(({ token, url, ...row }) => row);
    const { error: insertError } = await supabase.from('institution_access_tokens').insert(insertRows);
    if (insertError) throw new Error(`insert tokens failed: ${insertError.message}`);
  }

  console.log(JSON.stringify({
    projectId,
    dryRun: args.dryRun,
    tokens: rows.map(({ institution, permission, token_prefix, url }) => ({ institution, permission, token_prefix, url })),
  }, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
