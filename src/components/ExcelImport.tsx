'use client';

import React, { useMemo, useRef, useState } from 'react';
import { parseGanttExcelFile, parseIpoExcelFile, parseWorkstreamsExcelFile } from '@/lib/excelMapper';
import { useIpoData } from '@/context/IpoDataContext';

type ImportMode = 'full' | 'workstreams' | 'gantt';

const MODE_META: Record<ImportMode, { title: string; description: string; button: string }> = {
  full: {
    title: '完整 Excel',
    description: '一张完整表，系统同时识别条线/事项与甘特图。适合标准模板。',
    button: '上传完整 Excel',
  },
  workstreams: {
    title: '条线/事项 Excel',
    description: '仅导入条线视图与事项分工、进度。适合先导入结构化事项。',
    button: '上传条线/事项 Excel',
  },
  gantt: {
    title: '甘特图 Excel',
    description: '仅导入时间轴节点。请先完成条线/事项导入，系统将按事项名称匹配。',
    button: '上传甘特图 Excel',
  },
};

export default function ExcelImport() {
  const { data, setImportedData, importWorkstreamsAndTasks, importGanttOnly } = useIpoData();
  const [loadingMode, setLoadingMode] = useState<ImportMode | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRefs = useRef<Record<ImportMode, HTMLInputElement | null>>({
    full: null,
    workstreams: null,
    gantt: null,
  });

  const modeCards = useMemo(
    () => (Object.entries(MODE_META) as Array<[ImportMode, (typeof MODE_META)[ImportMode]]>),
    []
  );

  async function handleFile(mode: ImportMode, file: File) {
    try {
      setLoadingMode(mode);
      setError('');
      setSuccess('');

      if (mode === 'full') {
        const parsed = await parseIpoExcelFile(file);
        await setImportedData(parsed);
        setSuccess(`已完成完整导入：${file.name}`);
        return;
      }

      if (mode === 'workstreams') {
        const parsed = await parseWorkstreamsExcelFile(file);
        await importWorkstreamsAndTasks({ workstreams: parsed.workstreams, tasks: parsed.tasks });
        setSuccess(`已导入条线/事项数据：${file.name}`);
        return;
      }

      const parsed = await parseGanttExcelFile(file, data.tasks);
      await importGanttOnly({ ganttCells: parsed.ganttCells });
      setSuccess(`已导入甘特图数据：${file.name}`);
    } catch (err: any) {
      setError(err?.message || 'Excel 解析失败');
    } finally {
      setLoadingMode(null);
      const ref = inputRefs.current[mode];
      if (ref) ref.value = '';
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {modeCards.map(([mode, meta]) => {
          const active = loadingMode === mode;
          return (
            <div key={mode} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
              <div className="space-y-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{meta.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{meta.description}</p>
                </div>

                <label className={`inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-slate-300 text-slate-600 cursor-not-allowed' : 'bg-brand-600 text-white hover:bg-brand-700 cursor-pointer'}`}>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {active ? '导入中...' : meta.button}
                  <input
                    ref={(node) => {
                      inputRefs.current[mode] = node;
                    }}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    disabled={!!loadingMode}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(mode, file);
                    }}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
        <div className="font-medium text-slate-700">导入建议</div>
        <ul className="mt-2 space-y-1 leading-5">
          <li>• 标准模板可直接用“完整 Excel”一次性导入。</li>
          <li>• 若大表过宽、容易串行，建议先上传“条线/事项 Excel”，再单独上传“甘特图 Excel”。</li>
          <li>• 甘特图单独导入时，会按“事项”名称匹配现有事项，因此事项名称需保持一致。</li>
        </ul>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}
    </div>
  );
}
