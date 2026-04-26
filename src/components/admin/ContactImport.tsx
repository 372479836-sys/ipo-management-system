'use client';

import React from 'react';
import { parseContactsExcelFile } from '@/lib/contactMapper';
import { useIpoData } from '@/context/IpoDataContext';

export default function ContactImport() {
  const { data, importContacts, loading, error } = useIpoData();
  const [message, setMessage] = React.useState('');

  const handleFile = async (file?: File) => {
    if (!file) return;
    setMessage('正在解析通讯录...');
    try {
      const contacts = await parseContactsExcelFile(file);
      if (contacts.length === 0) {
        setMessage('未识别到联系人，请确认表头包含：机构、姓名、对应机构邮箱');
        return;
      }
      await importContacts(contacts);
      setMessage(`已导入 ${contacts.length} 位联系人`);
    } catch (e: any) {
      setMessage(`导入失败：${e.message}`);
    }
  };

  const grouped = React.useMemo(() => {
    const map = new Map<string, number>();
    data.contacts.forEach((c) => map.set(c.institution || '未分组', (map.get(c.institution || '未分组') || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [data.contacts]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">👥 通讯录导入</h2>
          <p className="mt-2 text-sm text-slate-500">上传 WGL.xlsx，系统会读取“机构 / 姓名 / 对应机构邮箱”，并用于事项负责人下拉选择。</p>
        </div>
        <label className="cursor-pointer rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600">
          上传通讯录
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            disabled={loading}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
        {grouped.length === 0 ? (
          <span className="text-slate-400">尚未导入通讯录</span>
        ) : grouped.map(([institution, count]) => (
          <span key={institution} className="rounded-full bg-slate-50 px-2 py-1 text-slate-600 border border-slate-100">
            {institution} {count}
          </span>
        ))}
      </div>

      {(message || error) && (
        <p className="mt-3 text-xs text-slate-500">{message || error}</p>
      )}
    </div>
  );
}
