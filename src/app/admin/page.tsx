'use client';

import Link from 'next/link';
import ExcelImport from '@/components/ExcelImport';
import ExportButtons from '@/components/ExportButtons';
import DangerZoneClearData from '@/components/admin/DangerZoneClearData';
import { useIpoData } from '@/context/IpoDataContext';

export default function AdminPage() {
  const { data } = useIpoData();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Admin</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">管理与维护</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Excel 导入、数据导出、清空等管理操作集中在此页面。
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            返回首页
          </Link>
        </div>
      </div>

      {/* Excel 导入 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">📥 数据导入</h2>
        <ExcelImport />
      </div>

      {/* 导出 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">📤 数据导出</h2>
        <ExportButtons tasks={data.tasks} workstreams={data.workstreams} />
      </div>

      <DangerZoneClearData />
    </div>
  );
}
