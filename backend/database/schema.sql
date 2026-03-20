-- Criar banco de dados (executar primeiro)
CREATE DATABASE IF NOT EXISTS academic_binder;
USE academic_binder;

-- ============================================
-- TABELAS PRINCIPAIS (SEM DEPENDÊNCIAS)
-- ============================================

-- Tabela de cadernos
CREATE TABLE IF NOT EXISTS cadernos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT,
    cor VARCHAR(20) DEFAULT '#3498db',
    link_universidade VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELAS QUE DEPENDEM DE cadernos
-- ============================================

-- Tabela de páginas
CREATE TABLE IF NOT EXISTS paginas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caderno_id INT,
    titulo VARCHAR(200) NOT NULL,
    conteudo TEXT,
    metodo_anotacao VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caderno_id) REFERENCES cadernos(id) ON DELETE CASCADE
);

-- Tabela de podcasts enviados
CREATE TABLE IF NOT EXISTS podcasts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caderno_id INT,
    titulo VARCHAR(200) NOT NULL,
    url VARCHAR(500),
    transcricao TEXT,
    resumo_ia TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caderno_id) REFERENCES cadernos(id) ON DELETE CASCADE
);

-- Tabela de PDFs
CREATE TABLE IF NOT EXISTS pdfs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caderno_id INT,
    titulo VARCHAR(200) NOT NULL,
    arquivo_path VARCHAR(500),
    resumo_ia TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caderno_id) REFERENCES cadernos(id) ON DELETE CASCADE
);

-- Tabela de podcasts gerados por IA
CREATE TABLE IF NOT EXISTS podcasts_gerados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caderno_id INT,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    roteiro TEXT NOT NULL,
    duracao_estimada INT,
    url_audio VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caderno_id) REFERENCES cadernos(id) ON DELETE CASCADE
);

-- ============================================
-- TABELAS QUE DEPENDEM DE OUTRAS (2º NÍVEL)
-- ============================================

-- Tabela de destaques (grifos)
CREATE TABLE IF NOT EXISTS destaques (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pagina_id INT,
    trecho TEXT NOT NULL,
    cor VARCHAR(20) DEFAULT '#ffff00',
    comentario TEXT,
    posicao_inicio INT,
    posicao_fim INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pagina_id) REFERENCES paginas(id) ON DELETE CASCADE
);

-- Tabela de lembretes
CREATE TABLE IF NOT EXISTS lembretes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caderno_id INT,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    data_hora DATETIME NOT NULL,
    notificado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caderno_id) REFERENCES cadernos(id) ON DELETE CASCADE
);

-- Tabela de links para páginas
CREATE TABLE IF NOT EXISTS links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pagina_id INT,
    url VARCHAR(500) NOT NULL,
    descricao VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pagina_id) REFERENCES paginas(id) ON DELETE CASCADE
);

-- Tabela de episódios de podcast gerado
CREATE TABLE IF NOT EXISTS episodios_podcast (
    id INT AUTO_INCREMENT PRIMARY KEY,
    podcast_gerado_id INT,
    titulo VARCHAR(200) NOT NULL,
    numero INT,
    roteiro TEXT,
    url_audio VARCHAR(500),
    duracao INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (podcast_gerado_id) REFERENCES podcasts_gerados(id) ON DELETE CASCADE
);

-- Relação entre podcasts gerados e PDFs usados como fonte
CREATE TABLE IF NOT EXISTS podcast_fontes (
    podcast_id INT,
    pdf_id INT,
    tipo_fonte VARCHAR(50) DEFAULT 'pdf',
    PRIMARY KEY (podcast_id, pdf_id),
    FOREIGN KEY (podcast_id) REFERENCES podcasts_gerados(id) ON DELETE CASCADE,
    FOREIGN KEY (pdf_id) REFERENCES pdfs(id) ON DELETE CASCADE
);

-- ============================================
-- TABELAS PARA LIVROS E LEITURA
-- ============================================

-- Tabela de livros
CREATE TABLE IF NOT EXISTS books (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    total_pages INT NOT NULL,
    pages_read INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'quero ler',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de histórico de leitura
CREATE TABLE IF NOT EXISTS reading_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id VARCHAR(36),
    pages_read INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- ============================================
-- TABELAS PARA ARMAZENAMENTO EM DRIVE
-- ============================================

-- Tabela de usuários (para integração com Google Drive)
CREATE TABLE IF NOT EXISTS usuarios_google (
    id INT AUTO_INCREMENT PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    nome VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para armazenar referências de pastas/arquivos do Drive
CREATE TABLE IF NOT EXISTS storage_references (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caderno_id INT,
    pagina_id INT,
    provider VARCHAR(50) NOT NULL DEFAULT 'googledrive',
    folder_id VARCHAR(255),
    file_id VARCHAR(255),
    link VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caderno_id) REFERENCES cadernos(id) ON DELETE CASCADE,
    FOREIGN KEY (pagina_id) REFERENCES paginas(id) ON DELETE CASCADE
);

-- Adicionar colunas de data ao final da tabela books
ALTER TABLE books ADD COLUMN start_date DATE;
ALTER TABLE books ADD COLUMN end_date DATE;