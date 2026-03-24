const { extractTextFromFile } = require('../utils/fileParser');
const { promisify } = require('util');
const fs = require('fs');
const unlinkAsync = promisify(fs.unlink);

class ExtractionService {
  static async extract(filePath, mimeType) {
    try {
      const text = await extractTextFromFile(filePath, mimeType);
      return text;
    } catch (err) {
      throw new Error(`Falha na extração: ${err.message}`);
    } finally {
      await unlinkAsync(filePath).catch(console.error);
    }
  }
}

module.exports = ExtractionService;