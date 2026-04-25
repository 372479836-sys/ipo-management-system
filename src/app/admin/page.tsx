import Link from 'next/link';
import DangerZoneClearData from '@/components/admin/DangerZoneClearData';

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Admin</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">管理与维护</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              仅放置低频、风险较高的系统维护操作。主业务页面不再暴露清空入口，避免误触。
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

      <DangerZoneClearData />
    </div>
  );
}
