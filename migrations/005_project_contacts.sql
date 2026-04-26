-- Phase 1: 项目通讯录 + 任务负责人外键
-- 在 MemFire 控制台 SQL 编辑器执行；执行后再运行 scripts/import_wgl_contacts_to_memfire.js

CREATE TABLE IF NOT EXISTS project_contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  institution text NOT NULL,
  role text,
  department text,
  phone text,
  is_key_contact boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, institution, name, email)
);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES project_contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_project_contacts_project_id ON project_contacts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_contacts_institution ON project_contacts(project_id, institution);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);

ALTER TABLE project_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon full access project_contacts" ON project_contacts;
CREATE POLICY "Allow anon full access project_contacts" ON project_contacts
  FOR ALL USING (true) WITH CHECK (true);

-- 验证：应返回 project_contacts 当前行数
SELECT
  'project_contacts' AS table_name,
  COUNT(*) AS row_count
FROM project_contacts;
