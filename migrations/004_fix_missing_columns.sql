-- 修复 tasks 表缺失的字段
-- 在 MemFire 控制台 SQL 编辑器执行

-- 添加 sort_order 字段（任务排序）
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 添加 remark 字段（备注）
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS remark TEXT;

-- 添加 assignee 字段（负责人）
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee TEXT;

-- 验证所有字段
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;
