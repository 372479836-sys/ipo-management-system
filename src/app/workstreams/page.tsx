'use client';

import React from 'react';
import { useIpoData } from '@/context/IpoDataContext';
import WorkstreamSection from '@/components/WorkstreamSection';
import ExcelImport from '@/components/ExcelImport';

export default function WorkstreamsPage() {
  const { data, hasImported } = useIpoData();
  const { workstreams, tasks } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">条线视图</h1>
        {hasImported && (
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">已加载导入数据</span>
        )}
      </div>

      <ExcelImport />

      {workstreams.map((ws) => {
        const wsTasks = tasks.filter(t => t.workstreamId === ws.id)
          .sort((a, b) => a.id.localeCompare(b.id));
        if (wsTasks.length === 0) return null;
        return (
          <WorkstreamSection
            key={ws.id}
            workstreamName={ws.name}
            tasks={wsTasks}
          />
        );
      })}
    </div>
  );
}
