-- Criação do banco de dados
CREATE DATABASE academic_binder;

-- Conecta ao banco
\c academic_binder;

-- ============================================
-- TABELAS EXISTENTES (ATUALIZADAS)
-- ============================================

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
);

-- Tabela de destaques (grifos)
CREATE TABLE destaques (
    id SERIAL PRIMARY KEY,
    pagina_id INTEGER REFERENCES paginas(id) ON DELETE CASCADE,
    trecho TEXT NOT NULL,
    cor VARCHAR(20) DEFAULT '#ffff00',
    comentario TEXT,
    posicao_inicio INTEGER,
    posicao_fim INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de lembretes
CREATE TABLE lembretes (
    id SERIAL PRIMARY KEY,
    caderno_id INTEGER REFERENCES cadernos(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    data_hora TIMESTAMP NOT NULL,
    notificado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de links para páginas
CREATE TABLE links (
    id SERIAL PRIMARY KEY,
    pagina_id INTEGER REFERENCES paginas(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    descricao VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de podcasts gerados por IA
CREATE TABLE podcasts_gerados (
    id SERIAL PRIMARY KEY,
    caderno_id INTEGER REFERENCES cadernos(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    roteiro TEXT NOT NULL,
    duracao_estimada INTEGER,
    url_audio VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de episódios de podcast gerado
CREATE TABLE episodios_podcast (
    id SERIAL PRIMARY KEY,
    podcast_gerado_id INTEGER REFERENCES podcasts_gerados(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    numero INTEGER,
    roteiro TEXT,
    url_audio VARCHAR(500),
    duracao INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relação entre podcasts gerados e PDFs usados como fonte
CREATE TABLE podcast_fontes (
    podcast_id INTEGER REFERENCES podcasts_gerados(id) ON DELETE CASCADE,
    pdf_id INTEGER REFERENCES pdfs(id) ON DELETE CASCADE,
    tipo_fonte VARCHAR(50) DEFAULT 'pdf'
);

-- ============================================
-- NOVAS TABELAS PARA LIVROS E LEITURA
-- ============================================

-- Tabela de livros
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    total_pages INTEGER NOT NULL CHECK (total_pages > 0),
    pages_read INTEGER NOT NULL DEFAULT 0 CHECK (pages_read >= 0 AND pages_read <= total_pages),
    status VARCHAR(20) NOT NULL CHECK (status IN ('lendo', 'lido', 'quero ler')) DEFAULT 'quero ler',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de histórico de leitura (para estatísticas)
CREATE TABLE reading_history (
    id SERIAL PRIMARY KEY,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    pages_read INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- NOVAS TABELAS PARA GOOGLE DRIVE
-- ============================================

-- Tabela de usuários do Google
CREATE TABLE usuarios_google (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    nome VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para armazenar referências de pastas do Drive
CREATE TABLE drive_references (
    id SERIAL PRIMARY KEY,
    caderno_id INTEGER REFERENCES cadernos(id) ON DELETE CASCADE,
    pagina_id INTEGER REFERENCES paginas(id) ON DELETE CASCADE,
    folder_id VARCHAR(255),
    file_id VARCHAR(255),
    link VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dados iniciais de exemplo
INSERT INTO cadernos (titulo, descricao, cor) VALUES
('Matemática Discreta', 'Fundamentos de lógica e combinatória', '#e74c3c'),
('Programação Web', 'Desenvolvimento com Node.js e React', '#2ecc71');
