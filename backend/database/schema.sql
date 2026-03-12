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

-- Dados iniciais de exemplo
INSERT INTO cadernos (titulo, descricao, cor) VALUES
('Matemática Discreta', 'Fundamentos de lógica e combinatória', '#e74c3c'),
('Programação Web', 'Desenvolvimento com Node.js e React', '#2ecc71');
