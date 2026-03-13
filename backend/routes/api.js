const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { Configuration, OpenAIApi } = require('openai');
const textToSpeech = require('@google-cloud/text-to-speech');
const vision = require('@google-cloud/vision');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const sharp = require('sharp');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

ffmpeg.setFfmpegPath(ffmpegPath);

const googleTTSClient = new textToSpeech.TextToSpeechClient();
const visionClient = new vision.ImageAnnotatorClient();
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

module.exports = (pool) => {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  // Configuração do multer para upload de arquivos
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = './uploads/temp';
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
  const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

  // ========== UTILITÁRIOS ==========

  async function preprocessImage(inputPath, outputPath) {
    await sharp(inputPath)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .grayscale()
      .normalise()
      .sharpen()
      .toFile(outputPath);
    return outputPath;
  }

  async function extractTextFromImage(imagePath) {
    try {
      const processedPath = imagePath + '_processed.jpg';
      await preprocessImage(imagePath, processedPath);
      const [result] = await visionClient.documentTextDetection(processedPath);
      fs.unlinkSync(processedPath);
      const annotation = result.fullTextAnnotation;
      return annotation ? annotation.text : '';
    } catch (error) {
      console.error('Erro no Google Vision:', error);
      if (error.code === 7) throw new Error('Falha de autenticação no Google Vision');
      if (error.code === 8) throw new Error('Quota do Google Vision excedida');
      throw error;
    }
  }

  async function extractTextFromFile(filePath, mimeType) {
    const fileBuffer = fs.readFileSync(filePath);
    if (mimeType === 'application/pdf') {
      const data = await pdfParse(fileBuffer);
      return data.text;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    } else if (mimeType === 'text/plain') {
      return fileBuffer.toString('utf-8');
    } else {
      throw new Error('Formato de arquivo não suportado para extração direta de texto');
    }
  }

  async function extractAudioFromVideo(videoPath, audioPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .output(audioPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  async function summarizeText(text) {
    try {
      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: `Resuma o seguinte texto em até 3000 caracteres: ${text}` }],
        max_tokens: 1000,
      });
      return completion.data.choices[0].message.content;
    } catch (error) {
      console.error('Erro na sumarização:', error);
      return text.substring(0, 3000);
    }
  }

  function splitTextIntoChunks(text, maxLength) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let currentChunk = '';
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxLength) {
        currentChunk += sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  }

  // ========== CRUD CADERNOS ==========
  router.get('/cadernos', async (req, res) => {
    try {
      const { limit } = req.query;
      let query = 'SELECT * FROM cadernos ORDER BY created_at DESC';
      if (limit) query += ' LIMIT $1';
      const result = await pool.query(query, limit ? [limit] : []);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/cadernos/:id', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM cadernos WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/cadernos', async (req, res) => {
    const { titulo, descricao, cor } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO cadernos (titulo, descricao, cor) VALUES ($1, $2, $3) RETURNING *',
        [titulo, descricao, cor || '#3498db']
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/cadernos/:id', async (req, res) => {
    const { titulo, descricao, cor, link_universidade } = req.body;
    try {
      const result = await pool.query(
        'UPDATE cadernos SET titulo = $1, descricao = $2, cor = $3, link_universidade = $4 WHERE id = $5 RETURNING *',
        [titulo, descricao, cor, link_universidade, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/cadernos/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM cadernos WHERE id = $1', [req.params.id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== CRUD PÁGINAS ==========
  router.get('/cadernos/:cadernoId/paginas', async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT * FROM paginas WHERE caderno_id = $1 ORDER BY created_at DESC',
        [req.params.cadernoId]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/paginas', async (req, res) => {
    const { caderno_id, titulo, conteudo, metodo_anotacao } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO paginas (caderno_id, titulo, conteudo, metodo_anotacao) VALUES ($1, $2, $3, $4) RETURNING *',
        [caderno_id, titulo, conteudo, metodo_anotacao]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/paginas/:id', async (req, res) => {
    const { titulo, conteudo, metodo_anotacao } = req.body;
    try {
      const result = await pool.query(
        'UPDATE paginas SET titulo = $1, conteudo = $2, metodo_anotacao = $3 WHERE id = $4 RETURNING *',
        [titulo, conteudo, metodo_anotacao, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/paginas/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM paginas WHERE id = $1', [req.params.id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== DESTAQUES ==========
  router.get('/paginas/:paginaId/destaques', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM destaques WHERE pagina_id = $1 ORDER BY id', [req.params.paginaId]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/destaques', async (req, res) => {
    const { pagina_id, trecho, cor, comentario, posicao_inicio, posicao_fim } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO destaques (pagina_id, trecho, cor, comentario, posicao_inicio, posicao_fim)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [pagina_id, trecho, cor, comentario, posicao_inicio, posicao_fim]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/destaques/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM destaques WHERE id = $1', [req.params.id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== LEMBRETES ==========
  router.get('/lembretes', async (req, res) => {
    try {
      const { caderno_id } = req.query;
      let query = 'SELECT * FROM lembretes';
      const params = [];
      if (caderno_id) {
        query += ' WHERE caderno_id = $1';
        params.push(caderno_id);
      }
      query += ' ORDER BY data_hora';
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/lembretes', async (req, res) => {
    const { caderno_id, titulo, descricao, data_hora } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO lembretes (caderno_id, titulo, descricao, data_hora)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [caderno_id, titulo, descricao, data_hora]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/lembretes/:id', async (req, res) => {
    const { titulo, descricao, data_hora, notificado } = req.body;
    try {
      const result = await pool.query(
        `UPDATE lembretes SET titulo = $1, descricao = $2, data_hora = $3, notificado = $4
         WHERE id = $5 RETURNING *`,
        [titulo, descricao, data_hora, notificado, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/lembretes/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM lembretes WHERE id = $1', [req.params.id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== CRUD PODCASTS ENVIADOS ==========
  const podcastStorage = multer.diskStorage({
    destination: './uploads/podcasts',
    filename: (req, file, cb) => cb(null, Date.now() + '-podcast' + path.extname(file.originalname))
  });
  const uploadPodcast = multer({ storage: podcastStorage });

  router.get('/podcasts', async (req, res) => {
    try {
      let query = 'SELECT * FROM podcasts';
      const { caderno_id } = req.query;
      if (caderno_id) {
        query += ' WHERE caderno_id = $1';
        const result = await pool.query(query, [caderno_id]);
        return res.json(result.rows);
      }
      const result = await pool.query(query + ' ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/podcasts', uploadPodcast.single('audio'), async (req, res) => {
    const { caderno_id, titulo } = req.body;
    const file = req.file;
    const url = file ? `/uploads/podcasts/${file.filename}` : null;
    try {
      const result = await pool.query(
        'INSERT INTO podcasts (caderno_id, titulo, url) VALUES ($1, $2, $3) RETURNING *',
        [caderno_id, titulo, url]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/podcasts/:id', async (req, res) => {
    try {
      const podcast = await pool.query('SELECT url FROM podcasts WHERE id = $1', [req.params.id]);
      if (podcast.rows[0]?.url) {
        const filePath = path.join(__dirname, '..', podcast.rows[0].url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      await pool.query('DELETE FROM podcasts WHERE id = $1', [req.params.id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== CRUD PDFS ==========
  const pdfStorage = multer.diskStorage({
    destination: './uploads/pdfs',
    filename: (req, file, cb) => cb(null, Date.now() + '-pdf' + path.extname(file.originalname))
  });
  const uploadPDF = multer({ storage: pdfStorage });

  router.get('/pdfs', async (req, res) => {
    try {
      let query = 'SELECT * FROM pdfs';
      const { caderno_id } = req.query;
      if (caderno_id) {
        query += ' WHERE caderno_id = $1';
        const result = await pool.query(query, [caderno_id]);
        return res.json(result.rows);
      }
      const result = await pool.query(query + ' ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/pdfs', uploadPDF.single('arquivo'), async (req, res) => {
    const { caderno_id, titulo } = req.body;
    const file = req.file;
    const arquivo_path = file ? `/uploads/pdfs/${file.filename}` : null;
    try {
      const result = await pool.query(
        'INSERT INTO pdfs (caderno_id, titulo, arquivo_path) VALUES ($1, $2, $3) RETURNING *',
        [caderno_id, titulo, arquivo_path]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/pdfs/:id/resumir', async (req, res) => {
    try {
      const pdf = await pool.query('SELECT * FROM pdfs WHERE id = $1', [req.params.id]);
      if (pdf.rows.length === 0) return res.status(404).json({ error: 'PDF não encontrado' });

      const filePath = path.join(__dirname, '..', pdf.rows[0].arquivo_path);
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      const texto = pdfData.text.substring(0, 3000);

      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: `Resuma o seguinte texto em 3 parágrafos: ${texto}` }],
      });
      const resumo = completion.data.choices[0].message.content;

      await pool.query('UPDATE pdfs SET resumo_ia = $1 WHERE id = $2', [resumo, req.params.id]);
      res.json({ resumo });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/pdfs/:id', async (req, res) => {
    try {
      const pdf = await pool.query('SELECT arquivo_path FROM pdfs WHERE id = $1', [req.params.id]);
      if (pdf.rows[0]?.arquivo_path) {
        const filePath = path.join(__dirname, '..', pdf.rows[0].arquivo_path);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      await pool.query('DELETE FROM pdfs WHERE id = $1', [req.params.id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== LINKS ==========
  router.get('/paginas/:paginaId/links', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM links WHERE pagina_id = $1 ORDER BY id', [req.params.paginaId]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/links', async (req, res) => {
    const { pagina_id, url, descricao } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO links (pagina_id, url, descricao) VALUES ($1, $2, $3) RETURNING *',
        [pagina_id, url, descricao]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/links/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM links WHERE id = $1', [req.params.id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== GERAÇÃO DE ANOTAÇÕES (UPLOAD UNIVERSAL) ==========
  router.post('/gerar-anotacoes', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

      const filePath = req.file.path;
      const mimeType = req.file.mimetype;
      const { caderno_id, metodo = 'cornell', titulo: tituloPersonalizado } = req.body;
      let textoExtraido = '';

      if (mimeType.startsWith('audio/')) {
        const audioFile = fs.createReadStream(filePath);
        const transcricao = await openai.createTranscription(audioFile, 'whisper-1');
        textoExtraido = transcricao.data.text;
      }
      else if (mimeType.startsWith('video/')) {
        const audioPath = filePath + '.mp3';
        await extractAudioFromVideo(filePath, audioPath);
        const audioFile = fs.createReadStream(audioPath);
        const transcricao = await openai.createTranscription(audioFile, 'whisper-1');
        textoExtraido = transcricao.data.text;
        fs.unlinkSync(audioPath);
      }
      else if (mimeType === 'application/pdf' ||
               mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
               mimeType === 'text/plain') {
        textoExtraido = await extractTextFromFile(filePath, mimeType);
      }
      else if (mimeType.startsWith('image/')) {
        textoExtraido = await extractTextFromImage(filePath);
      }
      else {
        throw new Error('Tipo de arquivo não suportado');
      }

      if (!textoExtraido.trim()) throw new Error('Não foi possível extrair texto do arquivo');

      const prompt = metodo === 'cornell'
        ? `Crie notas no método Cornell a partir do seguinte texto: ${textoExtraido}`
        : `Crie um resumo em tópicos (esboço) a partir do seguinte texto: ${textoExtraido}`;

      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      });
      const notasGeradas = completion.data.choices[0].message.content;

      const tituloPagina = tituloPersonalizado || `Notas de ${req.file.originalname}`;
      const result = await pool.query(
        `INSERT INTO paginas (caderno_id, titulo, conteudo, metodo_anotacao)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [caderno_id, tituloPagina, notasGeradas, metodo]
      );

      fs.unlinkSync(filePath);

      res.json({
        success: true,
        pagina: result.rows[0],
        textoExtraidoPreview: textoExtraido.substring(0, 500) + '...'
      });

    } catch (error) {
      console.error('Erro ao gerar anotações:', error);
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'Erro ao gerar anotações', details: error.message });
    }
  });

  // ========== GERAÇÃO DE PODCASTS COM GOOGLE TTS ==========
  router.post('/gerar-podcast', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

      const filePath = req.file.path;
      const mimeType = req.file.mimetype;
      const shouldSummarize = req.body.summarize === 'true';
      const caderno_id = req.body.caderno_id || null;
      let text = '';

      if (mimeType === 'application/pdf' || mimeType === 'text/plain' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        text = await extractTextFromFile(filePath, mimeType);
      } else {
        throw new Error('Formato não suportado para geração de podcast. Use PDF, DOCX ou TXT.');
      }

      if (!text.trim()) throw new Error('Texto vazio');

      if (shouldSummarize && text.length > 2000) {
        text = await summarizeText(text);
      }

      const chunks = splitTextIntoChunks(text, 5000);
      console.log(`Texto dividido em ${chunks.length} partes`);

      const audioDir = path.join(__dirname, '..', 'audio');
      const audioFileName = `podcast-${Date.now()}.mp3`;
      const audioPath = path.join(audioDir, audioFileName);

      const voiceConfig = {
        languageCode: 'pt-BR',
        name: 'pt-BR-Wavenet-A',
        ssmlGender: 'FEMALE'
      };
      const audioConfig = {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0
      };

      const audioBuffers = [];
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Sintetizando parte ${i+1}...`);
        const request = {
          input: { text: chunks[i] },
          voice: voiceConfig,
          audioConfig,
        };
        const [response] = await googleTTSClient.synthesizeSpeech(request);
        audioBuffers.push(response.audioContent);
      }

      const finalBuffer = Buffer.concat(audioBuffers);
      fs.writeFileSync(audioPath, finalBuffer);

      const titulo = req.body.titulo || `Podcast ${new Date().toLocaleString()}`;
      const duracaoEstimada = Math.ceil(text.split(' ').length / 150) * 60;

      const result = await pool.query(
        `INSERT INTO podcasts_gerados (caderno_id, titulo, descricao, roteiro, duracao_estimada, url_audio)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [caderno_id, titulo, `Gerado a partir de arquivo`, text, duracaoEstimada, `/audio/${audioFileName}`]
      );

      fs.unlinkSync(filePath);

      res.json({
        success: true,
        podcast: result.rows[0],
        audioUrl: `/audio/${audioFileName}`,
        textLength: text.length,
        chunks: chunks.length
      });

    } catch (error) {
      console.error('Erro ao gerar podcast:', error);
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'Erro ao gerar podcast', details: error.message });
    }
  });

  router.get('/podcasts-gerados', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT pg.*, c.titulo as caderno_titulo,
        (SELECT COUNT(*) FROM episodios_podcast WHERE podcast_gerado_id = pg.id) as total_episodios
        FROM podcasts_gerados pg
        LEFT JOIN cadernos c ON pg.caderno_id = c.id
        ORDER BY pg.created_at DESC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/podcasts-gerados/:id', async (req, res) => {
    try {
      const podcast = await pool.query('SELECT * FROM podcasts_gerados WHERE id = $1', [req.params.id]);
      if (podcast.rows.length === 0) return res.status(404).json({ error: 'Podcast não encontrado' });

      const episodios = await pool.query(
        'SELECT * FROM episodios_podcast WHERE podcast_gerado_id = $1 ORDER BY numero',
        [req.params.id]
      );

      res.json({
        ...podcast.rows[0],
        episodios: episodios.rows
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/podcasts-gerados/:id', async (req, res) => {
    try {
      const pod = await pool.query('SELECT url_audio FROM podcasts_gerados WHERE id = $1', [req.params.id]);
      if (pod.rows[0]?.url_audio) {
        const filePath = path.join(__dirname, '..', pod.rows[0].url_audio);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      await pool.query('DELETE FROM podcasts_gerados WHERE id = $1', [req.params.id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== BOOKS CRUD ==========
  router.get('/books', async (req, res) => {
    try {
      const { status } = req.query;
      let query = 'SELECT * FROM books';
      const params = [];
      if (status) {
        query += ' WHERE status = $1';
        params.push(status);
      }
      query += ' ORDER BY updated_at DESC';
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/books/:id', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Livro não encontrado' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/books', async (req, res) => {
    const { title, author, total_pages, status = 'quero ler' } = req.body;
    if (!title || !total_pages) {
      return res.status(400).json({ error: 'Título e total de páginas são obrigatórios' });
    }
    const id = uuidv4();
    try {
      const result = await pool.query(
        `INSERT INTO books (id, title, author, total_pages, pages_read, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [id, title, author, total_pages, 0, status]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/books/:id', async (req, res) => {
    const { title, author, total_pages, pages_read, status } = req.body;
    try {
      const current = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
      if (current.rows.length === 0) return res.status(404).json({ error: 'Livro não encontrado' });

      const currentBook = current.rows[0];
      const updatedPagesRead = pages_read !== undefined ? pages_read : currentBook.pages_read;
      const updatedTotal = total_pages || currentBook.total_pages;
      if (updatedPagesRead > updatedTotal) {
        return res.status(400).json({ error: 'Páginas lidas não podem exceder o total' });
      }

      await pool.query('BEGIN');

      const updateResult = await pool.query(
        `UPDATE books SET
            title = COALESCE($1, title),
            author = COALESCE($2, author),
            total_pages = COALESCE($3, total_pages),
            pages_read = COALESCE($4, pages_read),
            status = COALESCE($5, status)
         WHERE id = $6 RETURNING *`,
        [title, author, total_pages, pages_read, status, req.params.id]
      );

      if (pages_read !== undefined && pages_read !== currentBook.pages_read) {
        await pool.query(
          'INSERT INTO reading_history (book_id, pages_read) VALUES ($1, $2)',
          [req.params.id, pages_read]
        );
      }

      await pool.query('COMMIT');
      res.json(updateResult.rows[0]);
    } catch (err) {
      await pool.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/books/:id', async (req, res) => {
    try {
      const result = await pool.query('DELETE FROM books WHERE id = $1', [req.params.id]);
      if (result.rowCount === 0) return res.status(404).json({ error: 'Livro não encontrado' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== ESTATÍSTICAS DE LEITURA ==========
  router.get('/stats', async (req, res) => {
    try {
      // Garantir que a tabela reading_history existe
      await pool.query(`
        CREATE TABLE IF NOT EXISTS reading_history (
          id SERIAL PRIMARY KEY,
          book_id UUID REFERENCES books(id) ON DELETE CASCADE,
          pages_read INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Progresso diário dos últimos 7 dias
      const weeklyProgress = await pool.query(`
        SELECT
            DATE(created_at) as date,
            SUM(pages_read) as total_pages
        FROM reading_history
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `);

      // Livros concluídos no mês atual
      const currentMonth = await pool.query(`
        SELECT COUNT(*) as count
        FROM books
        WHERE status = 'lido'
          AND EXTRACT(MONTH FROM updated_at) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM updated_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      `);

      // Livros concluídos no mês anterior
      const previousMonth = await pool.query(`
        SELECT COUNT(*) as count
        FROM books
        WHERE status = 'lido'
          AND EXTRACT(MONTH FROM updated_at) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
          AND EXTRACT(YEAR FROM updated_at) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
      `);

      res.json({
        weekly: weeklyProgress.rows,
        currentMonthCompleted: parseInt(currentMonth.rows[0].count),
        previousMonthCompleted: parseInt(previousMonth.rows[0].count)
      });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== GOOGLE DRIVE INTEGRATION ==========
  router.get('/auth/google', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      state: req.query.state
    });
    res.redirect(authUrl);
  });

  router.get('/auth/google/callback', async (req, res) => {
    const { code, state } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      const { id: googleId, email, name } = userInfo.data;

      const userResult = await pool.query(
        `INSERT INTO usuarios_google (google_id, email, nome, access_token, refresh_token, token_expiry)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (google_id) DO UPDATE SET
           access_token = EXCLUDED.access_token,
           refresh_token = COALESCE(EXCLUDED.refresh_token, usuarios_google.refresh_token),
           token_expiry = EXCLUDED.token_expiry
         RETURNING id`,
        [googleId, email, name, tokens.access_token, tokens.refresh_token, new Date(tokens.expiry_date)]
      );
      const userId = userResult.rows[0].id;

      const jwtToken = jwt.sign({ userId, googleId }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.redirect(`${process.env.FRONTEND_URL}/notebooks/${state}?token=${jwtToken}`);
    } catch (error) {
      console.error('Erro no callback OAuth:', error);
      res.redirect(`${process.env.FRONTEND_URL}/?error=auth_failed`);
    }
  });

  async function ensureGoogleAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await pool.query('SELECT * FROM usuarios_google WHERE id = $1', [decoded.userId]);
      if (user.rows.length === 0) return res.status(401).json({ error: 'Usuário não encontrado' });

      const userData = user.rows[0];
      const oauth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oauth.setCredentials({
        access_token: userData.access_token,
        refresh_token: userData.refresh_token
      });
      if (new Date(userData.token_expiry) < new Date()) {
        const { credentials } = await oauth.refreshAccessToken();
        oauth.setCredentials(credentials);
        await pool.query(
          'UPDATE usuarios_google SET access_token = $1, token_expiry = $2 WHERE id = $3',
          [credentials.access_token, new Date(credentials.expiry_date), userData.id]
        );
      }
      req.googleAuth = oauth;
      req.userId = userData.id;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Token inválido' });
    }
  }

  router.post('/drive/export-page', ensureGoogleAuth, async (req, res) => {
    const { pagina_id } = req.body;
    try {
      const pagina = await pool.query(
        'SELECT p.*, c.titulo as caderno_titulo FROM paginas p JOIN cadernos c ON p.caderno_id = c.id WHERE p.id = $1',
        [pagina_id]
      );
      if (pagina.rows.length === 0) return res.status(404).json({ error: 'Página não encontrada' });

      const { titulo, conteudo, caderno_titulo, caderno_id } = pagina.rows[0];

      // Garantir que a pasta do caderno exista
      let folderId;
      const folderRef = await pool.query('SELECT folder_id FROM drive_references WHERE caderno_id = $1 AND pagina_id IS NULL', [caderno_id]);
      if (folderRef.rows.length === 0) {
        const drive = google.drive({ version: 'v3', auth: req.googleAuth });
        const folderMetadata = {
          name: caderno_titulo,
          mimeType: 'application/vnd.google-apps.folder'
        };
        const folder = await drive.files.create({
          resource: folderMetadata,
          fields: 'id'
        });
        folderId = folder.data.id;
        await pool.query(
          'INSERT INTO drive_references (caderno_id, folder_id) VALUES ($1, $2)',
          [caderno_id, folderId]
        );
      } else {
        folderId = folderRef.rows[0].folder_id;
      }

      const drive = google.drive({ version: 'v3', auth: req.googleAuth });

      // Criar subpasta com o nome da página
      const subFolderMetadata = {
        name: titulo,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [folderId]
      };
      const subFolder = await drive.files.create({
        resource: subFolderMetadata,
        fields: 'id, webViewLink'
      });
      const subFolderId = subFolder.data.id;
      const subFolderLink = subFolder.data.webViewLink;

      // Criar arquivo .txt com o conteúdo
      const fileMetadata = {
        name: `${titulo}.txt`,
        parents: [subFolderId]
      };
      const media = {
        mimeType: 'text/plain',
        body: conteudo
      };
      const file = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink'
      });

      await pool.query(
        'INSERT INTO drive_references (caderno_id, pagina_id, folder_id, file_id, link) VALUES ($1, $2, $3, $4, $5)',
        [caderno_id, pagina_id, subFolderId, file.data.id, file.data.webViewLink]
      );

      res.json({
        folderId: subFolderId,
        fileId: file.data.id,
        link: file.data.webViewLink
      });
    } catch (error) {
      console.error('Erro ao exportar página:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/drive/page-status/:pagina_id', async (req, res) => {
    const { pagina_id } = req.params;
    try {
      const ref = await pool.query('SELECT * FROM drive_references WHERE pagina_id = $1', [pagina_id]);
      if (ref.rows.length > 0) {
        res.json({ exported: true, link: ref.rows[0].link });
      } else {
        res.json({ exported: false });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/audio-list', (req, res) => {
    const audioDir = path.join(__dirname, '..', 'audio');
    if (!fs.existsSync(audioDir)) return res.json([]);
    const files = fs.readdirSync(audioDir)
      .filter(f => f.endsWith('.mp3'))
      .map(f => ({
        name: f,
        url: `/audio/${f}`,
        createdAt: fs.statSync(path.join(audioDir, f)).birthtime
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
    res.json(files);
  });

  return router;
};
