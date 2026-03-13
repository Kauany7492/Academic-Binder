// backend/services/ocr.service.js
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Extrai texto de uma imagem usando Tesseract OCR (offline)
 * @param {string} imagePath - Caminho da imagem
 * @param {string} language - Idioma (padrão: por - português)
 * @returns {Promise<string>} Texto extraído
 */
async function extractTextFromImage(imagePath, language = 'por') {
  try {
    // Pré-processamento para melhorar OCR
    const processedPath = imagePath + '_processed.png';
    await sharp(imagePath)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .grayscale()
      .normalise()
      .sharpen()
      .toFile(processedPath);

    console.log(`Processando OCR com Tesseract (idioma: ${language})...`);
    
    const { data: { text } } = await Tesseract.recognize(
      processedPath,
      language,
      {
        logger: m => console.log(`Tesseract: ${m.status} ${Math.round(m.progress * 100)}%`)
      }
    );

    // Limpar arquivo temporário
    fs.unlinkSync(processedPath);

    return text;
  } catch (error) {
    console.error('Erro no Tesseract OCR:', error);
    throw new Error(`Falha na extração de texto: ${error.message}`);
  }
}

/**
 * Extrai texto de PDF usando Tesseract (OCR em cada página)
 * @param {string} pdfPath - Caminho do PDF
 * @returns {Promise<string>} Texto extraído
 */
async function extractTextFromPDF(pdfPath) {
  // Para PDFs, é recomendado usar pdf-parse diretamente
  // Esta função é para casos onde o PDF é imagem-scaneado
  const { default: pdfParse } = require('pdf-parse');
  const dataBuffer = fs.readFileSync(pdfPath);
  const pdfData = await pdfParse(dataBuffer);
  return pdfData.text;
}

module.exports = {
  extractTextFromImage,
  extractTextFromPDF
};
