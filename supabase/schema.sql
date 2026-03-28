-- ============================================================
-- QualificaAI - Schema do Banco de Dados Supabase
-- Execute este arquivo no SQL Editor do painel Supabase
-- ============================================================

-- ----------------------
-- Tabela: user_settings
-- ----------------------
CREATE TABLE IF NOT EXISTS user_settings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario    uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  api_key       text,
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê apenas suas configurações"
  ON user_settings FOR ALL
  USING (auth.uid() = id_usuario)
  WITH CHECK (auth.uid() = id_usuario);

-- ----------------------
-- Tabela: clients
-- ----------------------
CREATE TABLE IF NOT EXISTS clients (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_cliente   text UNIQUE NOT NULL,
  nome             text NOT NULL,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê apenas seus clientes"
  ON clients FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------
-- Tabela: visits
-- ----------------------
CREATE TABLE IF NOT EXISTS visits (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_cliente   text NOT NULL,
  fase_pipeline    text,
  resumo_5q        jsonb,
  resumo_3a        jsonb,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data_criacao     timestamptz DEFAULT now()
);

ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê apenas suas visitas"
  ON visits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------
-- Índices de Performance
-- ----------------------
CREATE INDEX IF NOT EXISTS idx_visits_codigo_cliente ON visits(codigo_cliente);
CREATE INDEX IF NOT EXISTS idx_visits_user_id ON visits(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_codigo ON clients(codigo_cliente);
