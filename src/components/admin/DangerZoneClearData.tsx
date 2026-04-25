'use client';

import React, { useMemo, useState } from 'react';
import { useIpoData } from '@/context/IpoDataContext';

export default function DangerZoneClearData() {
  const { hasImported, resetToSeed } = useIpoData();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const canConfirm = useMemo(() => confirmText.trim() === '清空', [confirmText]);

  const handleClear = async () => {
    if (!canConfirm) return;
    setLoading(true);
    try {
      await resetToSeed();
      setShowConfirm(false);
      setConfirmText('');
    } catch (err) {
      console.error('Failed to clear data', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/80 p-5 shadow-sm">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-red-800">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-base font-semibold">危险操作：清空当前项目数据</h2>
        </div>
        <p className="text-sm leading-6 text-red-700">
          该操作会删除当前项目下的条线、事项与甘特节点数据，且不可撤销。此入口已从主界面移除，仅保留在隐藏的管理页。
        </p>
        <ul className="space-y-1 text-xs leading-5 text-red-700/90">
          <li>• 仅在确认要重新初始化项目时使用</li>
          <li>• 执行前建议先导出 Excel 或确认已留有备份</li>
          <li>• 必须手动输入“清空”才可执行</li>
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!hasImported || loading}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          清空当前项目数据
        </button>
        {!hasImported && <span className="text-xs text-red-600/80">当前无已导入数据，无需执行清空。</span>}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">再次确认清空数据</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  请输入“清空”后才会执行删除。关闭弹窗不会产生任何修改。
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600">请输入：清空</label>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="请输入 清空"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    setConfirmText('');
                  }}
                  disabled={loading}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800"
                >
                  取消
                </button>
                <button
                  onClick={handleClear}
                  disabled={loading || !canConfirm}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? '清空中...' : '确认清空'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
