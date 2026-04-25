-- 为 tasks 表添加 remark 字段
-- 在 MemFire 控制台 SQL 编辑器执行

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS remark TEXT;

-- 验证
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;
