'use client';

import React from 'react';
import { Task, STATUS_LABEL, STATUS_COLOR } from '@/types/ipo';

interface WorkstreamSectionProps {
  workstreamName: string;
  tasks: Task[];
  defaultOpen?: boolean;
}

export default function WorkstreamSection({ workstreamName, tasks, defaultOpen = true }: WorkstreamSectionProps) {
  const completed = tasks.filter(t => t.status === 'completed').length;
  const total = tasks.length;

  return (
    <div className="mb-6 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200">
        <div>
          <h3 className="font-semibold text-slate-800">{workstreamName}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{completed}/{total} 项已完成</p>
        </div>
        <div className="flex gap-1">
          {['pending', 'in_progress', 'completed', 'blocked'].map((s) => {
            const count = tasks.filter(t => t.status === s).length;
            if (count === 0) return null;
            return (
              <span key={s} className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[s as keyof typeof STATUS_COLOR]}`}>
                {STATUS_LABEL[s as keyof typeof STATUS_COLOR]} {count}
              </span>
            );
          })}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-white">
              <th className="text-left py-2.5 px-4 text-slate-400 font-medium text-xs">事项</th>
              <th className="text-left py-2.5 px-4 text-slate-400 font-medium text-xs">保荐人</th>
              <th className="text-left py-2.5 px-4 text-slate-400 font-medium text-xs">律师</th>
              <th className="text-left py-2.5 px-4 text-slate-400 font-medium text-xs">其他机构</th>
              <th className="text-left py-2.5 px-4 text-slate-400 font-medium text-xs">当前进度</th>
              <th className="text-left py-2.5 px-4 text-slate-400 font-medium text-xs">当前卡点</th>
              <th className="text-left py-2.5 px-4 text-slate-400 font-medium text-xs">下一步</th>
              <th className="text-center py-2.5 px-4 text-slate-400 font-medium text-xs">状态</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b border-slate-50 hover:bg-brand-50/30 transition-colors">
                <td className="py-2.5 px-4 font-medium text-slate-800 text-sm">{task.title}</td>
                <td className="py-2.5 px-4 text-slate-600">{task.sponsor || '-'}</td>
                <td className="py-2.5 px-4 text-slate-600">{task.lawyer || '-'}</td>
                <td className="py-2.5 px-4 text-slate-600">{task.otherParty || '-'}</td>
                <td className="py-2.5 px-4 text-slate-600 max-w-[180px] truncate text-xs" title={task.currentProgress}>{task.currentProgress || '-'}</td>
                <td className="py-2.5 px-4 max-w-[180px] truncate text-xs">
                  {task.currentBlocker && task.currentBlocker !== '无' ? (
                    <span className="text-amber-700" title={task.currentBlocker}>{task.currentBlocker}</span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="py-2.5 px-4 text-slate-600 max-w-[180px] truncate text-xs" title={task.nextStep}>{task.nextStep || '-'}</td>
                <td className="py-2.5 px-4 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[task.status]}`}>
                    {STATUS_LABEL[task.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
