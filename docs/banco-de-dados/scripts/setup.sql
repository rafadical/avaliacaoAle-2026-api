-- ============================================================================
-- SETUP COMPLETO DO BANCO DE DADOS
-- Plataforma de Cursos Online
-- PostgreSQL 17+
-- ============================================================================
-- Este arquivo é a fonte oficial DDL da entrega de Banco de Dados.
-- O Sequelize (camada de aplicação) produz exatamente este mesmo schema
-- via `npm run migrate`.
-- ============================================================================

-- Limpa tudo antes de recriar (cuidado em produção!)
DROP TABLE IF EXISTS avaliacoes CASCADE;
DROP TABLE IF EXISTS matriculas CASCADE;
DROP TABLE IF EXISTS cursos CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TYPE IF EXISTS usuario_tipo CASCADE;
DROP TYPE IF EXISTS matricula_status CASCADE;

-- ============================================================================
-- TIPOS ENUM
-- ============================================================================
CREATE TYPE usuario_tipo AS ENUM ('aluno', 'admin');
CREATE TYPE matricula_status AS ENUM ('ativa', 'concluida', 'cancelada');

-- ============================================================================
-- TABELA: usuarios
-- ============================================================================
CREATE TABLE usuarios (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(120) NOT NULL,
    email       VARCHAR(160) NOT NULL,
    senha       VARCHAR(255) NOT NULL,
    tipo        usuario_tipo NOT NULL DEFAULT 'aluno',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uniq_usuarios_email UNIQUE (email)
);

CREATE INDEX usuarios_tipo_idx ON usuarios (tipo);

-- ============================================================================
-- TABELA: categorias
-- ============================================================================
CREATE TABLE categorias (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(80) NOT NULL,
    descricao   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uniq_categorias_nome UNIQUE (nome)
);

-- ============================================================================
-- TABELA: cursos
-- ============================================================================
CREATE TABLE cursos (
    id              SERIAL PRIMARY KEY,
    titulo          VARCHAR(160) NOT NULL,
    descricao       TEXT,
    carga_horaria   INTEGER NOT NULL CHECK (carga_horaria BETWEEN 1 AND 1000),
    preco           NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (preco >= 0),
    categoria_id    INTEGER NOT NULL,
    ativo           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cursos_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX cursos_categoria_idx ON cursos (categoria_id);
CREATE INDEX cursos_titulo_idx ON cursos (titulo);
CREATE INDEX cursos_ativo_idx ON cursos (ativo);

-- ============================================================================
-- TABELA: matriculas (PIVÔ N:N entre usuarios e cursos)
-- ============================================================================
CREATE TABLE matriculas (
    id              SERIAL PRIMARY KEY,
    usuario_id      INTEGER NOT NULL,
    curso_id        INTEGER NOT NULL,
    data_matricula  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status          matricula_status NOT NULL DEFAULT 'ativa',
    progresso       INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_matriculas_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_matriculas_curso
        FOREIGN KEY (curso_id) REFERENCES cursos(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT uniq_matricula_usuario_curso UNIQUE (usuario_id, curso_id),
    CONSTRAINT chk_matriculas_progresso CHECK (progresso BETWEEN 0 AND 100)
);

CREATE INDEX matriculas_usuario_idx ON matriculas (usuario_id);
CREATE INDEX matriculas_curso_idx ON matriculas (curso_id);
CREATE INDEX matriculas_status_idx ON matriculas (status);
CREATE INDEX matriculas_data_idx ON matriculas (data_matricula);

-- ============================================================================
-- TABELA: avaliacoes
-- ============================================================================
CREATE TABLE avaliacoes (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER NOT NULL,
    curso_id    INTEGER NOT NULL,
    nota        INTEGER NOT NULL,
    comentario  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_avaliacoes_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_avaliacoes_curso
        FOREIGN KEY (curso_id) REFERENCES cursos(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT uniq_avaliacao_usuario_curso UNIQUE (usuario_id, curso_id),
    CONSTRAINT chk_avaliacoes_nota CHECK (nota BETWEEN 1 AND 5)
);

CREATE INDEX avaliacoes_usuario_idx ON avaliacoes (usuario_id);
CREATE INDEX avaliacoes_curso_idx ON avaliacoes (curso_id);
CREATE INDEX avaliacoes_nota_idx ON avaliacoes (nota);

-- ============================================================================
-- FIM DO SETUP
-- Total: 5 tabelas, 2 ENUMs, 15 índices, 6 FKs, 5 CHECKs, 5 UNIQUEs
-- ============================================================================
