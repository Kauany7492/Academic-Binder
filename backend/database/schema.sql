-- Criação do banco de dados
CREATE DATABASE academic_binder;

-- Conecta ao banco
\c academic_binder;

-- Tabela de cadernos
CREATE TABLE cadernos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT,
    cor VARCHAR(20) DEFAULT '#3498db',
    link_universidade VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de páginas
CREATE TABLE paginas (
    id SERIAL PRIMARY KEY,
    caderno_id INTEGER REFERENCES cadernos(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    conteudo TEXT,
    metodo_anotacao VARCHAR(20) CHECK (metodo_anotacao IN ('cornell', 'esboço', 'livre')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de podcasts enviados
CREATE TABLE podcasts (
    id SERIAL PRIMARY KEY,
    caderno_id INTEGER REFERENCES cadernos(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    url VARCHAR(500),
    transcricao TEXT,
    resumo_ia TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de PDFs
CREATE TABLE pdfs (
    id SERIAL PRIMARY KEY,
    caderno_id INTEGER REFERENCES cadernos(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    arquivo_path VARCHAR(500),
    resumo_ia TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
