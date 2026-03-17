const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { OpenAI } = require('openai');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

// Serviços customizados
const ttsService = require('../services/tts.service');
const ocrService = require('../services/ocr.service');
const { createStorageClient } = require('../services/storage.service');

ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = (pool) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

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
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: `Resuma o seguinte texto em até 3000 caracteres: ${text}` }],
        max_tokens: 1000,
      });
      return completion.choices[0].message.content;
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
      if (limit) query += ' LIMIT ?';
      const [rows] = await pool.query(query, limit ? [parseInt(limit)] : []);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/cadernos/:id', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM cadernos WHERE id = ?', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/cadernos', async (req, res) => {
    const { titulo, descricao, cor } = req.body;
    try {
      const [result] = await pool.query(
        'INSERT INTO cadernos (titulo, descricao, cor) VALUES (?, ?, ?)',
        [titulo, descricao, cor || '#3498db']
      );
      const [newRecord] = await pool.query('SELECT * FROM cadernos WHERE id = ?', [result.insertId]);
      res.status(201).json(newRecord[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/cadernos/:id', async (req, res) => {
    const { titulo, descricao, cor, link_universidade } = req.body;
    try {
      await pool.query(
        'UPDATE cadernos SET titulo = ?, descricao = ?, cor = ?, link_universidade = ? WHERE id = ?',
        [titulo, descricao, cor, link_universidade, req.params.id]
      );
      const [updated] = await pool.query('SELECT * FROM cadernos WHERE id = ?', [req.params.id]);
      res.json(updated[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/cadernos/:id', async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM cadernos WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== CRUD PÁGINAS ==========
  router.get('/cadernos/:cadernoId/paginas', async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM paginas WHERE caderno_id = ? ORDER BY created_at DESC',
        [req.params.cadernoId]
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/paginas', async (req, res) => {
    const { caderno_id, titulo, conteudo, metodo_anotacao } = req.body;
    try {
      const [result] = await pool.query(
        'INSERT INTO paginas (caderno_id, titulo, conteudo, metodo_anotacao) VALUES (?, ?, ?, ?)',
        [caderno_id, titulo, conteudo, metodo_anotacao]
      );
      const [newRecord] = await pool.query('SELECT * FROM paginas WHERE id = ?', [result.insertId]);
      res.status(201).json(newRecord[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/paginas/:id', async (req, res) => {
    const { titulo, conteudo, metodo_anotacao } = req.body;
    try {
      await pool.query(
        'UPDATE paginas SET titulo = ?, conteudo = ?, metodo_anotacao = ? WHERE id = ?',
        [titulo, conteudo, metodo_anotacao, req.params.id]
      );
      const [updated] = await pool.query('SELECT * FROM paginas WHERE id = ?', [req.params.id]);
      res.json(updated[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/paginas/:id', async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM paginas WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== DESTAQUES ==========
  router.get('/paginas/:paginaId/destaques', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM destaques WHERE pagina_id = ? ORDER BY id', [req.params.paginaId]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/destaques', async (req, res) => {
    const { pagina_id, trecho, cor, comentario, posicao_inicio, posicao_fim } = req.body;
    try {
      const [result] = await pool.query(
        `INSERT INTO destaques (pagina_id, trecho, cor, comentario, posicao_inicio, posicao_fim)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [pagina_id, trecho, cor, comentario, posicao_inicio, posicao_fim]
      );
      const [newRecord] = await pool.query('SELECT * FROM destaques WHERE id = ?', [result.insertId]);
      res.status(201).json(newRecord[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/destaques/:id', async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM destaques WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
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
        query += ' WHERE caderno_id = ?';
        params.push(caderno_id);
      }
      query += ' ORDER BY data_hora';
      const [rows] = await pool.query(query, params);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/lembretes', async (req, res) => {
    const { caderno_id, titulo, descricao, data_hora } = req.body;
    try {
      const [result] = await pool.query(
        'INSERT INTO lembretes (caderno_id, titulo, descricao, data_hora) VALUES (?, ?, ?, ?)',
        [caderno_id, titulo, descricao, data_hora]
      );
      const [newRecord] = await pool.query('SELECT * FROM lembretes WHERE id = ?', [result.insertId]);
      res.status(201).json(newRecord[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/lembretes/:id', async (req, res) => {
    const { titulo, descricao, data_hora, notificado } = req.body;
    try {
      await pool.query(
        'UPDATE lembretes SET titulo = ?, descricao = ?, data_hora = ?, notificado = ? WHERE id = ?',
        [titulo, descricao, data_hora, notificado, req.params.id]
      );
      const [updated] = await pool.query('SELECT * FROM lembretes WHERE id = ?', [req.params.id]);
      res.json(updated[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/lembretes/:id', async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM lembretes WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
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
      const params = [];
      if (caderno_id) {
        query += ' WHERE caderno_id = ?';
        params.push(caderno_id);
      }
      query += ' ORDER BY created_at DESC';
      const [rows] = await pool.query(query, params);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/podcasts', uploadPodcast.single('audio'), async (req, res) => {
    const { caderno_id, titulo } = req.body;
    const file = req.file;
    const url = file ? `/uploads/podcasts/${file.filename}` : null;
    try {
      const [result] = await pool.query(
        'INSERT INTO podcasts (caderno_id, titulo, url) VALUES (?, ?, ?)',
        [caderno_id, titulo, url]
      );
      const [newRecord] = await pool.query('SELECT * FROM podcasts WHERE id = ?', [result.insertId]);
      res.status(201).json(newRecord[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/podcasts/:id', async (req, res) => {
    try {
      const [podcast] = await pool.query('SELECT url FROM podcasts WHERE id = ?', [req.params.id]);
      if (podcast[0]?.url) {
        const filePath = path.join(__dirname, '..', podcast[0].url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      const [result] = await pool.query('DELETE FROM podcasts WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
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
      const params = [];
      if (caderno_id) {
        query += ' WHERE caderno_id = ?';
        params.push(caderno_id);
      }
      query += ' ORDER BY created_at DESC';
      const [rows] = await pool.query(query, params);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/pdfs', uploadPDF.single('arquivo'), async (req, res) => {
    const { caderno_id, titulo } = req.body;
    const file = req.file;
    const arquivo_path = file ? `/uploads/pdfs/${file.filename}` : null;
    try {
      const [result] = await pool.query(
        'INSERT INTO pdfs (caderno_id, titulo, arquivo_path) VALUES (?, ?, ?)',
        [caderno_id, titulo, arquivo_path]
      );
      const [newRecord] = await pool.query('SELECT * FROM pdfs WHERE id = ?', [result.insertId]);
      res.status(201).json(newRecord[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/pdfs/:id/resumir', async (req, res) => {
    try {
      const [pdf] = await pool.query('SELECT * FROM pdfs WHERE id = ?', [req.params.id]);
      if (pdf.length === 0) return res.status(404).json({ error: 'PDF não encontrado' });

      const filePath = path.join(__dirname, '..', pdf[0].arquivo_path);
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      const texto = pdfData.text.substring(0, 3000);

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: `Resuma o seguinte texto em 3 parágrafos: ${texto}` }],
      });
      const resumo = completion.choices[0].message.content;

      await pool.query('UPDATE pdfs SET resumo_ia = ? WHERE id = ?', [resumo, req.params.id]);
      res.json({ resumo });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/pdfs/:id', async (req, res) => {
    try {
      const [pdf] = await pool.query('SELECT arquivo_path FROM pdfs WHERE id = ?', [req.params.id]);
      if (pdf[0]?.arquivo_path) {
        const filePath = path.join(__dirname, '..', pdf[0].arquivo_path);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      const [result] = await pool.query('DELETE FROM pdfs WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== LINKS ==========
  router.get('/paginas/:paginaId/links', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM links WHERE pagina_id = ? ORDER BY id', [req.params.paginaId]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/links', async (req, res) => {
    const { pagina_id, url, descricao } = req.body;
    try {
      const [result] = await pool.query(
        'INSERT INTO links (pagina_id, url, descricao) VALUES (?, ?, ?)',
        [pagina_id, url, descricao]
      );
      const [newRecord] = await pool.query('SELECT * FROM links WHERE id = ?', [result.insertId]);
      res.status(201).json(newRecord[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/links/:id', async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM links WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
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
        const transcricao = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1'
        });
        textoExtraido = transcricao.text;
      }
      else if (mimeType.startsWith('video/')) {
        const audioPath = filePath + '.mp3';
        await extractAudioFromVideo(filePath, audioPath);
        const audioFile = fs.createReadStream(audioPath);
        const transcricao = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1'
        });
        textoExtraido = transcricao.text;
        fs.unlinkSync(audioPath);
      }
      else if (mimeType === 'application/pdf' ||
               mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
               mimeType === 'text/plain') {
        textoExtraido = await extractTextFromFile(filePath, mimeType);
      }
      else if (mimeType.startsWith('image/')) {
        textoExtraido = await ocrService.extractTextFromImage(filePath);
      }
      else {
        throw new Error('Tipo de arquivo não suportado');
      }

      if (!textoExtraido.trim()) throw new Error('Não foi possível extrair texto do arquivo');

      const prompt = metodo === 'cornell'
        ? `Crie notas no método Cornell a partir do seguinte texto: ${textoExtraido}`
        : `Crie um resumo em tópicos (esboço) a partir do seguinte texto: ${textoExtraido}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      });
      const notasGeradas = completion.choices[0].message.content;

      const tituloPagina = tituloPersonalizado || `Notas de ${req.file.originalname}`;
      const [result] = await pool.query(
        'INSERT INTO paginas (caderno_id, titulo, conteudo, metodo_anotacao) VALUES (?, ?, ?, ?)',
        [caderno_id, tituloPagina, notasGeradas, metodo]
      );

      // Salvar no PPDRIVE (armazenamento gratuito)
      try {
        const storage = createStorageClient();
        const bucketName = `${process.env.PPDRIVE_BUCKET_PREFIX || 'academic'}-notas`;
        const folderPath = `/cadernos/${caderno_id}`;
        
        await storage.uploadTextFile(
          textoExtraido,
          bucketName,
          folderPath,
          `${tituloPagina}_transcricao.txt`
        );
        
        await storage.uploadTextFile(
          notasGeradas,
          bucketName,
          folderPath,
          `${tituloPagina}_notas_${metodo}.txt`
        );
        
        console.log('Arquivos salvos no PPDRIVE');
      } catch (storageError) {
        console.error('Erro ao salvar no PPDRIVE (continuando):', storageError);
      }

      fs.unlinkSync(filePath);

      const [newRecord] = await pool.query('SELECT * FROM paginas WHERE id = ?', [result.insertId]);

      res.json({
        success: true,
        pagina: newRecord[0],
        textoExtraidoPreview: textoExtraido.substring(0, 500) + '...'
      });

    } catch (error) {
      console.error('Erro ao gerar anotações:', error);
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'Erro ao gerar anotações', details: error.message });
    }
  });

  // ========== GERAÇÃO DE PODCASTS COM AMAZON POLLY ==========
  router.post('/gerar-podcast', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

      const filePath = req.file.path;
      const mimeType = req.file.mimetype;
      const shouldSummarize = req.body.summarize === 'true';
      const caderno_id = req.body.caderno_id || null;
      let text = '';

      if (mimeType === 'application/pdf' || 
          mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
          mimeType === 'text/plain') {
        text = await extractTextFromFile(filePath, mimeType);
      } else if (mimeType.startsWith('image/')) {
        text = await ocrService.extractTextFromImage(filePath);
      } else {
        throw new Error('Formato não suportado para geração de podcast. Use PDF, imagem, DOCX ou TXT.');
      }

      if (!text.trim()) throw new Error('Texto vazio');

      if (shouldSummarize && text.length > 2000) {
        text = await summarizeText(text);
      }

      const chunks = splitTextIntoChunks(text, 2800);
      console.log(`Texto dividido em ${chunks.length} partes`);

      const audioDir = path.join(__dirname, '..', 'audio');
      const audioFileName = `podcast-${Date.now()}.mp3`;
      const audioPath = path.join(audioDir, audioFileName);

      const audioBuffers = [];
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Sintetizando parte ${i+1} com Amazon Polly...`);
        const audioBuffer = await ttsService.synthesizeSpeech(chunks[i]);
        audioBuffers.push(audioBuffer);
      }

      const finalBuffer = Buffer.concat(audioBuffers);
      fs.writeFileSync(audioPath, finalBuffer);

      let ppdriveLink = null;
      if (process.env.PPDRIVE_URL) {
        try {
          const storage = createStorageClient();
          const bucketName = `${process.env.PPDRIVE_BUCKET_PREFIX || 'academic'}-podcasts`;
          const folderPath = caderno_id ? `/cadernos/${caderno_id}` : '/geral';
          
          const result = await storage.uploadFile(
            finalBuffer,
            bucketName,
            `${folderPath}/${audioFileName}`
          );
          ppdriveLink = result.link;
          console.log('Podcast salvo no PPDRIVE:', ppdriveLink);
        } catch (storageError) {
          console.error('Erro ao salvar no PPDRIVE (continuando):', storageError);
        }
      }

      const titulo = req.body.titulo || `Podcast ${new Date().toLocaleString()}`;
      const duracaoEstimada = Math.ceil(text.split(' ').length / 150) * 60;

      const [result] = await pool.query(
        'INSERT INTO podcasts_gerados (caderno_id, titulo, descricao, roteiro, duracao_estimada, url_audio) VALUES (?, ?, ?, ?, ?, ?)',
        [caderno_id, titulo, `Gerado a partir de arquivo`, text, duracaoEstimada, `/audio/${audioFileName}`]
      );

      fs.unlinkSync(filePath);

      const [newRecord] = await pool.query('SELECT * FROM podcasts_gerados WHERE id = ?', [result.insertId]);

      res.json({
        success: true,
        podcast: newRecord[0],
        audioUrl: `/audio/${audioFileName}`,
        ppdriveLink,
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
      const [rows] = await pool.query(`
        SELECT pg.*, c.titulo as caderno_titulo,
        (SELECT COUNT(*) FROM episodios_podcast WHERE podcast_gerado_id = pg.id) as total_episodios
        FROM podcasts_gerados pg
        LEFT JOIN cadernos c ON pg.caderno_id = c.id
        ORDER BY pg.created_at DESC
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/podcasts-gerados/:id', async (req, res) => {
    try {
      const [podcast] = await pool.query('SELECT * FROM podcasts_gerados WHERE id = ?', [req.params.id]);
      if (podcast.length === 0) return res.status(404).json({ error: 'Podcast não encontrado' });

      const [episodios] = await pool.query(
        'SELECT * FROM episodios_podcast WHERE podcast_gerado_id = ? ORDER BY numero',
        [req.params.id]
      );

      res.json({
        ...podcast[0],
        episodios
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/podcasts-gerados/:id', async (req, res) => {
    try {
      const [pod] = await pool.query('SELECT url_audio FROM podcasts_gerados WHERE id = ?', [req.params.id]);
      if (pod[0]?.url_audio) {
        const filePath = path.join(__dirname, '..', pod[0].url_audio);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      const [result] = await pool.query('DELETE FROM podcasts_gerados WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
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
        query += ' WHERE status = ?';
        params.push(status);
      }
      query += ' ORDER BY updated_at DESC';
      const [rows] = await pool.query(query, params);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/books/:id', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Livro não encontrado' });
      res.json(rows[0]);
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
      await pool.query(
        'INSERT INTO books (id, title, author, total_pages, pages_read, status) VALUES (?, ?, ?, ?, ?, ?)',
        [id, title, author, total_pages, 0, status]
      );
      const [newRecord] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
      res.status(201).json(newRecord[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/books/:id', async (req, res) => {
    const { title, author, total_pages, pages_read, status } = req.body;
    try {
      const [current] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
      if (current.length === 0) return res.status(404).json({ error: 'Livro não encontrado' });

      const currentBook = current[0];
      const updatedPagesRead = pages_read !== undefined ? pages_read : currentBook.pages_read;
      const updatedTotal = total_pages || currentBook.total_pages;
      if (updatedPagesRead > updatedTotal) {
        return res.status(400).json({ error: 'Páginas lidas não podem exceder o total' });
      }

      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        await connection.query(
          'UPDATE books SET title = ?, author = ?, total_pages = ?, pages_read = ?, status = ? WHERE id = ?',
          [title || currentBook.title, author || currentBook.author, updatedTotal, updatedPagesRead, status || currentBook.status, req.params.id]
        );

        if (pages_read !== undefined && pages_read !== currentBook.pages_read) {
          await connection.query(
            'INSERT INTO reading_history (book_id, pages_read) VALUES (?, ?)',
            [req.params.id, pages_read]
          );
        }

        await connection.commit();
        const [updated] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
        res.json(updated[0]);
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/books/:id', async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM books WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Livro não encontrado' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== ESTATÍSTICAS DE LEITURA ==========
  router.get('/stats', async (req, res) => {
    try {
      const [weeklyProgress] = await pool.query(`
        SELECT
            DATE(created_at) as date,
            SUM(pages_read) as total_pages
        FROM reading_history
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date
      `);

      const [currentMonth] = await pool.query(`
        SELECT COUNT(*) as count
        FROM books
        WHERE status = 'lido'
          AND MONTH(updated_at) = MONTH(CURDATE())
          AND YEAR(updated_at) = YEAR(CURDATE())
      `);

      const [previousMonth] = await pool.query(`
        SELECT COUNT(*) as count
        FROM books
        WHERE status = 'lido'
          AND MONTH(updated_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
          AND YEAR(updated_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
      `);

      res.json({
        weekly: weeklyProgress,
        currentMonthCompleted: currentMonth[0].count,
        previousMonthCompleted: previousMonth[0].count
      });

    } catch (err) {
      res.status(500).json({ error: err.message });
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

// ========== EXPORTAR PDF PARA O GOOGLE DRIVE ==========
router.post('/drive/export-pdf', ensureGoogleAuth, async (req, res) => {
  const { pdf_id } = req.body;
  try {
    // 1. Buscar o PDF no banco de dados
    const [pdf] = await pool.query('SELECT * FROM pdfs WHERE id = ?', [pdf_id]);
    if (pdf.length === 0) {
      return res.status(404).json({ error: 'PDF não encontrado' });
    }
    const pdfData = pdf[0];

    // 2. Localizar o arquivo no servidor
    const filePath = path.join(__dirname, '..', pdfData.arquivo_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo físico não encontrado no servidor' });
    }

    // 3. Obter o nome do caderno associado (se houver)
    let folderId = null;
    if (pdfData.caderno_id) {
      // Verificar se já existe uma pasta para o caderno no Drive
      const [folderRef] = await pool.query(
        'SELECT folder_id FROM storage_references WHERE caderno_id = ? AND pagina_id IS NULL',
        [pdfData.caderno_id]
      );

      if (folderRef.length > 0) {
        folderId = folderRef[0].folder_id;
      } else {
        // Se não existir, criar a pasta do caderno
        const [caderno] = await pool.query('SELECT titulo FROM cadernos WHERE id = ?', [pdfData.caderno_id]);
        const cadNome = caderno[0].titulo;

        const drive = google.drive({ version: 'v3', auth: req.googleAuth });
        const folderMetadata = {
          name: cadNome,
          mimeType: 'application/vnd.google-apps.folder'
        };
        const folder = await drive.files.create({
          resource: folderMetadata,
          fields: 'id'
        });
        folderId = folder.data.id;

        // Salvar referência da pasta
        await pool.query(
          'INSERT INTO storage_references (caderno_id, folder_id) VALUES (?, ?)',
          [pdfData.caderno_id, folderId]
        );
      }
    }

    // 4. Fazer upload do arquivo para o Drive
    const drive = google.drive({ version: 'v3', auth: req.googleAuth });
    const fileMetadata = {
      name: pdfData.titulo + '.pdf',
      parents: folderId ? [folderId] : [] // se não houver pasta, coloca na raiz
    };
    const media = {
      mimeType: 'application/pdf',
      body: fs.createReadStream(filePath)
    };

    const uploadedFile = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink'
    });

    // 5. Salvar referência no banco (opcional)
    await pool.query(
      `INSERT INTO storage_references (caderno_id, pagina_id, file_id, link, provider)
       VALUES (?, ?, ?, ?, 'googledrive')`,
      [pdfData.caderno_id, null, uploadedFile.data.id, uploadedFile.data.webViewLink]
    );

    res.json({
      success: true,
      fileId: uploadedFile.data.id,
      link: uploadedFile.data.webViewLink
    });

  } catch (error) {
    console.error('Erro ao exportar PDF para o Drive:', error);
    res.status(500).json({ error: error.message });
  }
});
