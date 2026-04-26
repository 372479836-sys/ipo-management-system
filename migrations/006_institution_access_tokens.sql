-- Phase 2-A(+): 机构访问 Token
-- 公司：可看全部事项；普通机构：只读；保荐人H：负责项目进度管控，可编辑有限字段。
-- 说明：只存 token_hash，不存明文 token。

CREATE TABLE IF NOT EXISTS institution_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  institution text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  token_prefix text NOT NULL,
  permission text NOT NULL DEFAULT 'readonly',
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  CONSTRAINT institution_access_tokens_permission_check
    CHECK (permission IN ('readonly', 'sponsor_h_edit'))
);

CREATE INDEX IF NOT EXISTS idx_institution_access_tokens_project_institution
  ON institution_access_tokens(project_id, institution);

CREATE INDEX IF NOT EXISTS idx_institution_access_tokens_hash
  ON institution_access_tokens(token_hash);

ALTER TABLE institution_access_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "institution access token read" ON institution_access_tokens;
DROP POLICY IF EXISTS "institution access token write" ON institution_access_tokens;

-- 当前 MemFire 只有 anon key 可用；先允许 anon 操作 token 表，访问控制由服务端 API 校验 token_hash/permission。
-- 前端不会直接读取此表，也不会暴露 token_hash。
CREATE POLICY "institution access token read" ON institution_access_tokens
  FOR SELECT USING (true);

CREATE POLICY "institution access token write" ON institution_access_tokens
  FOR ALL USING (true) WITH CHECK (true);
