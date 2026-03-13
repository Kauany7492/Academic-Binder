-- Criar banco de dados (executar primeiro)
CREATE DATABASE IF NOT EXISTS academic_binder;
USE academic_binder;

-- ============================================
-- TABELAS PRINCIPAIS
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

-- Tabela de páginas
CREATE TABLE IF NOT EXISTS paginas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caderno_id INT,
    titulo VARCHAR(200) NOT NULL,
    conteudo TEXT,
    metodo_anotacao VARCHAR(20) CHECK (metodo_anotacao IN ('cornell', 'esboço', 'livre')),
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
    total_pages INT NOT NULL CHECK (total_pages > 0),
    pages_read INT NOT NULL DEFAULT 0 CHECK (pages_read >= 0 AND pages_read <= total_pages),
    status VARCHAR(20) NOT NULL CHECK (status IN ('lendo', 'lido', 'quero ler')) DEFAULT 'quero ler',
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

-- Tabela de usuários (para integração com serviços de storage)
CREATE TABLE IF NOT EXISTS usuarios_storage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider VARCHAR(50) NOT NULL, -- 'ppdrive', 'dropbox', 'googledrive'
    user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    nome VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_provider_user (provider, user_id)
);

-- Tabela para armazenar referências de pastas/arquivos
CREATE TABLE IF NOT EXISTS storage_references (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caderno_id INT,
    pagina_id INT,
    provider VARCHAR(50) NOT NULL DEFAULT 'ppdrive',
    bucket_name VARCHAR(255),
    folder_id VARCHAR(255),
    file_id VARCHAR(255),
    file_path VARCHAR(500),
    link VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caderno_id) REFERENCES cadernos(id) ON DELETE CASCADE,
    FOREIGN KEY (pagina_id) REFERENCES paginas(id) ON DELETE CASCADE
);

-- Dados iniciais de exemplo
INSERT INTO cadernos (titulo, descricao, cor) VALUES
('Matemática Discreta', 'Fundamentos de lógica e combinatória', '#e74c3c'),
('Programação Web', 'Desenvolvimento com Node.js e React', '#2ecc71');
