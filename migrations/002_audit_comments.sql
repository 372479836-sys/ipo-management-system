-- 变更日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_id text,
  action text NOT NULL,
  field_name text,
  old_value text,
  new_value text,
  user_name text DEFAULT '系统',
  created_at timestamptz DEFAULT now()
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_id text NOT NULL,
  content text NOT NULL,
  user_name text DEFAULT '匿名',
  created_at timestamptz DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_project ON audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_task ON audit_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);

-- RLS (允许anon读写)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_audit" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_comments" ON comments FOR ALL USING (true) WITH CHECK (true);
