'use client';

import React, { useState } from 'react';
import { parseIpoExcelFile } from '@/lib/excelMapper';
import { useIpoData } from '@/context/IpoDataContext';

export default function ExcelImport() {
  const { hasImported, setImportedData, resetToSeed } = useIpoData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      setError('');
      setFileName(file.name);
      const data = await parseIpoExcelFile(file);
      await setImportedData(data);
    } catch (err: any) {
      setError(err.message || 'Excel 解析失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <label className="relative inline-flex items-center px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-brand-700 transition-colors">
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        上传 Excel 导入数据库
        <input type="file" accept=".xlsx,.xls" onChange={handleChange} className="hidden" />
      </label>
      {hasImported && (
        <button onClick={resetToSeed} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
          清空数据
        </button>
      )}
      {loading && <span className="text-sm text-brand-600">正在导入数据库...</span>}
      {error && <span className="text-sm text-red-600">{error}</span>}
      {fileName && !loading && !error && (
        <span className="text-sm text-green-600">已导入：{fileName}</span>
      )}
    </div>
  );
}
