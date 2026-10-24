CREATE TABLE IF NOT EXISTS cliente_sessions (
    token_hash CHAR(64) PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cliente_sessions_expires_at
    ON cliente_sessions(expires_at);

CREATE TABLE IF NOT EXISTS vehicle_documents (
    id VARCHAR(36) PRIMARY KEY,
    veiculo_id BIGINT NOT NULL,
    nome VARCHAR(120) NOT NULL,
    tipo VARCHAR(16) NOT NULL CHECK (tipo IN ('MANUAL', 'DOCUMENTO')),
    tamanho BIGINT NOT NULL CHECK (tamanho > 0),
    data_criacao TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle_created
    ON vehicle_documents(veiculo_id, data_criacao DESC);
