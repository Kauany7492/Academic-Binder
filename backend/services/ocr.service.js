const Tesseract = require('tesseract.js');
const fs = require('fs');
const sharp = require('sharp');

async function extractTextFromImage(imagePath, language = 'por') {
  try {
    const processedPath = imagePath + '_processed.png';
    await sharp(imagePath)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .grayscale()
      .normalise()
      .sharpen()
      .toFile(processedPath);

    const { data: { text } } = await Tesseract.recognize(
      processedPath,
      language,
      { logger: m => console.log(`Tesseract: ${m.status} ${Math.round(m.progress * 100)}%`) }
    );

    fs.unlinkSync(processedPath);
    return text;
  } catch (error) {
    console.error('Erro no Tesseract OCR:', error);
    throw new Error(`Falha na extração de texto: ${error.message}`);
  }
}

module.exports = { extractTextFromImage };
