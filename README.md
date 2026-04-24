# IPO 事项管理系统 — Project Yangtze

港股 IPO 项目进度跟踪与协作平台。支持 Excel 导入、Dashboard 概览、条线视图、甘特图可视化。

## 技术栈

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- xlsx (Excel 解析)
- 纯前端 MVP，无后端依赖

## 快速启动

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 启动生产模式
npm start
```

## 页面

| 路由 | 说明 |
|------|------|
| `/` | 首页导航 + Excel 导入 |
| `/dashboard` | 项目整体进度 Dashboard |
| `/workstreams` | 按条线分组查看事项 |
| `/gantt` | 甘特图时间轴视图 |

## 数据源

1. **Mock 数据** — 内置 Project Yangtze 真实 IPO 事项拆解（13 条线，66+ 事项）
2. **Excel 导入** — 上传 `.xlsx` 按指定表头解析

## 项目结构

```
src/
├── app/           # 页面 (App Router)
│   ├── dashboard/
│   ├── gantt/
│   └── workstreams/
├── components/    # 通用组件
├── context/       # 全局状态
├── data/          # Mock 数据
├── lib/           # 工具 + Excel 解析
└── types/         # TypeScript 类型
```

## 后续扩展

- 接 Supabase / MemFire：在 `IpoDataContext` 层增加持久化逻辑
- 用户权限：增加页面级鉴权
- 导出：支持导出为 PDF / Excel
