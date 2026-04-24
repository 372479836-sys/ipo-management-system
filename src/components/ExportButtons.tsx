'use client';

import React from 'react';
import { Task, Workstream } from '@/types/ipo';

interface ExportButtonsProps {
  tasks: Task[];
  workstreams: Workstream[];
}

export default function ExportButtons({ tasks, workstreams }: ExportButtonsProps) {
  const exportExcel = async () => {
    const XLSX = (await import('xlsx')).default;
    const wsMap = Object.fromEntries(workstreams.map(w => [w.id, w.name]));
    const rows = tasks.map(t => ({
      '条线': wsMap[t.workstreamId] || '',
      '任务': t.title,
      '状态': t.status === 'completed' ? '已完成' : t.status === 'in_progress' ? '进行中' : t.status === 'blocked' ? '卡点' : '待开始',
      '负责人': t.assignee || '',
      '备注': t.remark || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 10 }, { wch: 12 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '任务清单');
    XLSX.writeFile(wb, `IPO任务清单_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportCSV = async () => {
    const wsMap = Object.fromEntries(workstreams.map(w => [w.id, w.name]));
    const statusMap: Record<string, string> = { completed: '已完成', in_progress: '进行中', blocked: '卡点', not_started: '待开始' };
    const header = '条线,任务,状态,负责人,备注';
    const lines = tasks.map(t => {
      const esc = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
      return [esc(wsMap[t.workstreamId] || ''), esc(t.title), esc(statusMap[t.status] || t.status), esc(t.assignee || ''), esc(t.remark || '')].join(',');
    });
    const csv = '\uFEFF' + header + '\n' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `IPO任务清单_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={exportExcel}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="hidden sm:inline">导出Excel</span>
        <span className="sm:hidden">Excel</span>
      </button>
      <button
        onClick={exportCSV}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        <span className="hidden sm:inline">导出CSV</span>
        <span className="sm:hidden">CSV</span>
      </button>
    </div>
  );
}
