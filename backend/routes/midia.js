const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { createStorageClient } = require('../services/storage.service');
const ttsService = require('../services/tts.service');
const ocrService = require('../services/ocr.service');
const { OpenAI } = require('openai');

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

  // ========== UTILITÁRIOS DE MÍDIA ==========
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

  // ========== GERAÇÃO DE ANOTAÇÕES (UPLOAD UNIVERSAL) ==========
  router.post('/gerar-anotacoes', upload.single('file'), async (req, res) => {
  console.log('=== INÍCIO DA REQUISIÇÃO /gerar-anotacoes ===');
  try {
    if (!req.file) {
      console.log('Nenhum arquivo enviado');
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    console.log('Arquivo recebido:', req.file.path, 'tamanho:', req.file.size);

    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    const { caderno_id, metodo = 'cornell', titulo: tituloPersonalizado } = req.body;
    console.log('Dados recebidos:', { caderno_id, metodo, tituloPersonalizado, mimeType });

    let textoExtraido = '';

    // Extração conforme tipo de arquivo
    try {
      if (mimeType.startsWith('audio/')) {
        console.log('Processando áudio...');
        const audioFile = fs.createReadStream(filePath);
        const transcricao = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1'
        });
        textoExtraido = transcricao.text;
        console.log('Áudio transcrito com sucesso. Texto:', textoExtraido.substring(0, 100));
      } else if (mimeType.startsWith('video/')) {
        console.log('Processando vídeo...');
        const audioPath = filePath + '.mp3';
        await extractAudioFromVideo(filePath, audioPath);
        const audioFile = fs.createReadStream(audioPath);
        const transcricao = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1'
        });
        textoExtraido = transcricao.text;
        fs.unlinkSync(audioPath);
      } else if (mimeType === 'application/pdf' ||
                 mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                 mimeType === 'text/plain') {
        console.log('Extraindo texto de arquivo:', mimeType);
        textoExtraido = await extractTextFromFile(filePath, mimeType);
      } else if (mimeType.startsWith('image/')) {
        console.log('Processando imagem...');
        textoExtraido = await ocrService.extractTextFromImage(filePath);
      } else {
        throw new Error('Tipo de arquivo não suportado: ' + mimeType);
      }
    } catch (extractError) {
      console.error('Erro na extração:', extractError);
      throw new Error(`Falha na extração de texto: ${extractError.message}`);
    }

    if (!textoExtraido.trim()) {
      console.log('Texto extraído vazio');
      throw new Error('Não foi possível extrair texto do arquivo');
    }

    console.log('Texto extraído (primeiros 500 chars):', textoExtraido.substring(0, 500));

    const prompt = metodo === 'cornell'
      ? `Crie notas no método Cornell a partir do seguinte texto: ${textoExtraido}`
      : `Crie um resumo em tópicos (esboço) a partir do seguinte texto: ${textoExtraido}`;

    console.log('Enviando para OpenAI...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });
    const notasGeradas = completion.choices[0].message.content;
    console.log('Notas geradas com sucesso');

    const tituloPagina = tituloPersonalizado || `Notas de ${req.file.originalname}`;
    console.log('Inserindo página no banco...');
    const [result] = await pool.query(
      'INSERT INTO paginas (caderno_id, titulo, conteudo, metodo_anotacao) VALUES (?, ?, ?, ?)',
      [caderno_id, tituloPagina, notasGeradas, metodo]
    );

    // Salvar no PPDRIVE (opcional)
    try {
      const storage = createStorageClient();
      const bucketName = `${process.env.PPDRIVE_BUCKET_PREFIX || 'academic'}-notas`;
      const folderPath = `/cadernos/${caderno_id}`;
      await storage.uploadTextFile(textoExtraido, bucketName, folderPath, `${tituloPagina}_transcricao.txt`);
      await storage.uploadTextFile(notasGeradas, bucketName, folderPath, `${tituloPagina}_notas_${metodo}.txt`);
      console.log('Arquivos salvos no PPDRIVE');
    } catch (storageError) {
      console.error('Erro ao salvar no PPDRIVE (continuando):', storageError);
    }

    // Limpa arquivo temporário
    fs.unlinkSync(filePath);
    console.log('Arquivo temporário removido');

    const [newRecord] = await pool.query('SELECT * FROM paginas WHERE id = ?', [result.insertId]);

    console.log('Resposta enviada com sucesso');
    res.json({
      success: true,
      pagina: newRecord[0],
      textoExtraidoPreview: textoExtraido.substring(0, 500) + '...'
    });

  } catch (error) {
    console.error('Erro ao gerar anotações:', error);
    // Se houver arquivo temporário, tenta excluir
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error('Erro ao excluir arquivo temporário:', unlinkErr);
      }
    }
    res.status(500).json({ error: 'Erro ao gerar anotações', details: error.message });
  }
});

  // ========== GERAÇÃO DE PODCASTS COM AMAZON POLLY ==========
  router.post('/gerar-podcast', upload.single('file'), async (req, res) => {
    // ... (código já existente e funcional)
    // Mantido igual ao que você já tem, apenas com o mesmo padrão de tratamento de erros
    // Para não duplicar, omito aqui, mas você pode manter o original.
  });

  router.get('/podcasts-gerados', async (req, res) => {
    // ... (código existente)
  });

  router.get('/podcasts-gerados/:id', async (req, res) => {
    // ... (código existente)
  });

  router.delete('/podcasts-gerados/:id', async (req, res) => {
    // ... (código existente)
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