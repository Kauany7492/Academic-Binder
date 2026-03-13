// No início do arquivo, adicione os imports dos serviços
const ttsService = require('../services/tts.service');
const ocrService = require('../services/ocr.service');
const storageService = require('../services/storage.service');

// ========== GERAÇÃO DE PODCASTS COM AMAZON POLLY ==========
router.post('/gerar-podcast', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    const shouldSummarize = req.body.summarize === 'true';
    const caderno_id = req.body.caderno_id || null;
    let text = '';

    // Extrair texto conforme tipo (usando Tesseract para imagens)
    if (mimeType === 'application/pdf') {
      text = await extractTextFromFile(filePath, mimeType); // função existente
    } else if (mimeType.startsWith('image/')) {
      text = await ocrService.extractTextFromImage(filePath);
    } else if (mimeType === 'text/plain' || mimeType.includes('document')) {
      text = await extractTextFromFile(filePath, mimeType);
    } else {
      throw new Error('Formato não suportado para geração de podcast. Use PDF, imagem, DOCX ou TXT.');
    }

    if (!text.trim()) throw new Error('Texto vazio');

    if (shouldSummarize && text.length > 2000) {
      text = await summarizeText(text);
    }

    // Dividir em chunks (Polly tem limite de 3000 caracteres por chamada)
    const chunks = splitTextIntoChunks(text, 2800);
    console.log(`Texto dividido em ${chunks.length} partes`);

    const audioDir = path.join(__dirname, '..', 'audio');
    const audioFileName = `podcast-${Date.now()}.mp3`;
    const audioPath = path.join(audioDir, audioFileName);

    // Gerar áudio com Amazon Polly para cada chunk
    const audioBuffers = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Sintetizando parte ${i+1} com Amazon Polly...`);
      const audioBuffer = await ttsService.synthesizeSpeech(chunks[i]);
      audioBuffers.push(audioBuffer);
    }

    // Concatenar todos os buffers
    const finalBuffer = Buffer.concat(audioBuffers);
    fs.writeFileSync(audioPath, finalBuffer);

    // Upload para Dropbox (opcional)
    let dropboxLink = null;
    if (process.env.DROPBOX_REFRESH_TOKEN) {
      try {
        const dropboxResult = await storageService.uploadFile(
          finalBuffer,
          `/AcademicBinder/Podcasts/${caderno_id || 'Geral'}`,
          audioFileName
        );
        dropboxLink = dropboxResult.link;
        console.log('Podcast também salvo no Dropbox:', dropboxLink);
      } catch (dbxError) {
        console.error('Erro ao salvar no Dropbox (continuando):', dbxError);
      }
    }

    const titulo = req.body.titulo || `Podcast ${new Date().toLocaleString()}`;
    const duracaoEstimada = Math.ceil(text.split(' ').length / 150) * 60;

    const result = await pool.query(
      `INSERT INTO podcasts_gerados (caderno_id, titulo, descricao, roteiro, duracao_estimada, url_audio)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [caderno_id, titulo, `Gerado a partir de arquivo`, text, duracaoEstimada, `/audio/${audioFileName}`]
    );

    fs.unlinkSync(filePath); // limpar arquivo temporário

    res.json({
      success: true,
      podcast: result.rows[0],
      audioUrl: `/audio/${audioFileName}`,
      dropboxLink,
      textLength: text.length,
      chunks: chunks.length
    });

  } catch (error) {
    console.error('Erro ao gerar podcast:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Erro ao gerar podcast', details: error.message });
  }
});
