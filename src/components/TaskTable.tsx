'use client';

import React from 'react';
import { Task, STATUS_LABEL, STATUS_COLOR } from '@/types/ipo';

interface TaskTableProps {
  tasks: Task[];
}

export default function TaskTable({ tasks }: TaskTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 text-slate-500 font-medium">事项</th>
            <th className="text-left py-3 px-4 text-slate-500 font-medium">保荐人</th>
            <th className="text-left py-3 px-4 text-slate-500 font-medium">律师</th>
            <th className="text-left py-3 px-4 text-slate-500 font-medium">其他机构</th>
            <th className="text-left py-3 px-4 text-slate-500 font-medium">当前进度</th>
            <th className="text-left py-3 px-4 text-slate-500 font-medium">当前卡点</th>
            <th className="text-left py-3 px-4 text-slate-500 font-medium">下一步</th>
            <th className="text-center py-3 px-4 text-slate-500 font-medium">状态</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 font-medium text-slate-800">{task.title}</td>
              <td className="py-3 px-4 text-slate-600">{task.sponsor || '-'}</td>
              <td className="py-3 px-4 text-slate-600">{task.lawyer || '-'}</td>
              <td className="py-3 px-4 text-slate-600">{task.otherParty || '-'}</td>
              <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={task.currentProgress}>{task.currentProgress || '-'}</td>
              <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={task.currentBlocker}>
                {task.currentBlocker && task.currentBlocker !== '无' ? (
                  <span className="text-amber-700">{task.currentBlocker}</span>
                ) : '-'}
              </td>
              <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={task.nextStep}>{task.nextStep || '-'}</td>
              <td className="py-3 px-4 text-center">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[task.status]}`}>
                  {STATUS_LABEL[task.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
