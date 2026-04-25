#!/usr/bin/env node
/**
 * Import Yangtze IPO Excel data into MemFire
 * Parses workstreams, tasks, and gantt cells from the Excel file
 */

const XLSX = require('xlsx');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

// Load env
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) envVars[k.trim()] = v.join('=').trim();
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let PROJECT_ID = '';

function uuid() { return crypto.randomUUID(); }

function supabaseRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const fullUrl = SUPABASE_URL + '/rest/v1/' + path;
    const parsed = require('url').parse(fullUrl);
    const options = {
      method,
      hostname: parsed.hostname,
      path: parsed.path,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal',
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data ? JSON.parse(data) : []);
        } else {
          reject(new Error(`${method} ${path}: ${res.statusCode} ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getOrCreateProjectId() {
  const projects = await supabaseRequest('GET', 'projects?select=id,name,created_at&order=created_at.asc&limit=1');
  if (projects && projects.length > 0) {
    return projects[0].id;
  }

  const created = await supabaseRequest('POST', 'projects', [{ name: 'Project Yangtze 进度跟踪' }]);
  if (!created || !created[0]?.id) {
    throw new Error('Failed to get or create project id');
  }
  return created[0].id;
}

async function deleteAll(table) {
  if (table === 'gantt_cells') {
    // gantt_cells has no project_id, delete by task_ids
    // First get all task IDs for this project
    const tasksData = await supabaseRequest('GET', `tasks?project_id=eq.${PROJECT_ID}&select=id`);
    if (tasksData && tasksData.length > 0) {
      const taskIds = tasksData.map(t => t.id);
      // Delete in batches of task IDs
      for (let i = 0; i < taskIds.length; i += 20) {
        const batch = taskIds.slice(i, i + 20);
        const filter = `task_id=in.(${batch.join(',')})`;
        await supabaseRequest('DELETE', `gantt_cells?${filter}`);
      }
    }
  } else {
    const path = `${table}?project_id=eq.${PROJECT_ID}`;
    await supabaseRequest('DELETE', path);
  }
  console.log(`  Deleted all from ${table}`);
}

async function insertBatch(table, rows) {
  if (!rows.length) return;
  // Insert in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    await supabaseRequest('POST', table, batch);
    console.log(`  Inserted ${batch.length} rows into ${table} (${i + batch.length}/${rows.length})`);
  }
}

function inferStatus(progress, blocker) {
  if (!progress || progress === '无') return 'pending';
  
  // "无" or empty means no blocker
  const hasRealBlocker = blocker && blocker !== '无' && blocker.trim().length > 0;
  if (hasRealBlocker) return 'blocked';
  
  const completedKeywords = ['已完成', '已签署', '已选定', '已确定', '已传阅', '已发出', '已开始', '已提供', '已TMF'];
  const pendingKeywords = ['待', '暂未', '尚未'];
  
  for (const kw of completedKeywords) {
    if (progress.includes(kw)) return 'in_progress';
  }
  for (const kw of pendingKeywords) {
    if (progress.startsWith(kw)) return 'pending';
  }
  return 'in_progress';
}

async function main() {
  PROJECT_ID = await getOrCreateProjectId();
  console.log(`Using project_id: ${PROJECT_ID}`);

  const excelPath = '/Users/jyf/.hermes/cache/documents/doc_70c65c79cea7_Yangtze - 事项进度-甘特视图.xlsx';
  const wb = XLSX.readFile(excelPath, { cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' });

  // Parse date columns from header row (row 3)
  const dateRow = rows[3];
  const dates = [];
  for (let c = 9; c < dateRow.length; c++) {
    const v = dateRow[c];
    if (v instanceof Date) {
      dates.push({ col: c, date: v.toISOString().split('T')[0] });
    } else if (typeof v === 'string' && v.includes('2026')) {
      dates.push({ col: c, date: v.split('T')[0] });
    }
  }
  console.log(`Found ${dates.length} date columns: ${dates[0]?.date} to ${dates[dates.length-1]?.date}`);

  // Parse workstreams and tasks
  const workstreams = [];
  const tasks = [];
  const ganttCells = [];
  
  let currentWS = null;
  let wsOrder = 0;

  for (let i = 5; i < 163; i++) {
    const row = rows[i];
    const col1 = String(row[1] || '').trim(); // 分工-其他机构
    const col2 = String(row[2] || '').trim(); // 分工-律师
    const col3 = String(row[3] || '').trim(); // 分工-保荐人
    const col4 = String(row[4] || '').trim(); // 事项
    const col5 = String(row[5] || '').trim(); // 当前进度
    const col6 = String(row[6] || '').trim(); // 当前卡点
    const col7 = String(row[7] || '').trim(); // 下一步
    
    if (!col4) continue;
    
    // Check if this row has gantt cells (in the next row, since each task spans 2 rows)
    const nextRow = rows[i + 1];
    let hasGanttInNext = false;
    if (nextRow) {
      for (let c = 9; c < 72; c++) {
        if (String(nextRow[c] || '').trim()) { hasGanttInNext = true; break; }
      }
    }
    
    // Workstream header: no progress text
    if (!col5 && !col1 && !col2 && !col3) {
      currentWS = {
        id: uuid(),
        project_id: PROJECT_ID,
        name: col4,
        sort_order: wsOrder++,
      };
      workstreams.push(currentWS);
      continue;
    }
    
    if (!currentWS) continue;
    
    // This is a task
    const taskId = uuid();
    const task = {
      id: taskId,
      project_id: PROJECT_ID,
      workstream_id: currentWS.id,
      title: col4,
      sponsor: col3, // 保荐人
      lawyer: col2,  // 律师
      other_party: col1, // 其他机构
      current_progress: col5,
      current_blocker: col6,
      next_step: col7,
      status: inferStatus(col5, col6),
    };
    tasks.push(task);
    
    // Parse gantt cells from the NEXT row (row i+1)
    if (nextRow) {
      for (let c = 9; c < 72; c++) {
        const cellVal = String(nextRow[c] || '').trim();
        if (!cellVal) continue;
        
        const dateObj = dates.find(d => d.col === c);
        if (!dateObj) continue;
        
        // Determine cell type based on content
        let cellType = 'event';
        const milestoneKeywords = ['定稿', '完成', '递交', '递表', '出具', '签署', '召开'];
        const progressKeywords = ['进行中', '持续', '陆续'];
        
        for (const kw of milestoneKeywords) {
          if (cellVal.includes(kw)) { cellType = 'milestone'; break; }
        }
        for (const kw of progressKeywords) {
          if (cellVal.includes(kw)) { cellType = 'progress'; break; }
        }
        
        ganttCells.push({
          id: uuid(),
          task_id: taskId,
          cell_date: dateObj.date,
          label: cellVal,
          cell_type: cellType,
        });
      }
    }
  }

  console.log(`\nParsed data:`);
  console.log(`  Workstreams: ${workstreams.length}`);
  console.log(`  Tasks: ${tasks.length}`);
  console.log(`  Gantt cells: ${ganttCells.length}`);
  
  console.log(`\nWorkstream breakdown:`);
  workstreams.forEach(ws => {
    const wsTasks = tasks.filter(t => t.workstream_id === ws.id);
    const wsGantt = ganttCells.filter(g => wsTasks.some(t => t.id === g.task_id));
    console.log(`  ${ws.name}: ${wsTasks.length} tasks, ${wsGantt.length} gantt cells`);
  });

  // Clear existing data and insert new
  console.log('\nClearing existing data...');
  await deleteAll('gantt_cells');
  await deleteAll('tasks');
  await deleteAll('workstreams');
  
  console.log('\nInserting new data...');
  await insertBatch('workstreams', workstreams);
  await insertBatch('tasks', tasks);
  await insertBatch('gantt_cells', ganttCells);
  
  console.log('\n✅ Import complete!');
  console.log(`  ${workstreams.length} workstreams`);
  console.log(`  ${tasks.length} tasks`);
  console.log(`  ${ganttCells.length} gantt cells`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
