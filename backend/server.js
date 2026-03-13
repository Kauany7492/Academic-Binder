// backend/services/storage.service.js
// Serviço de armazenamento usando PPDRIVE (auto-hospedado, gratuito)
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class PPDRIVEStorage {
  constructor(baseURL, apiKey = null) {
    this.baseURL = baseURL || 'http://localhost:8080';
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}
    });
  }

  /**
   * Cria um bucket (equivalente a uma pasta raiz)
   * @param {string} bucketName - Nome do bucket
   * @returns {Promise<Object>}
   */
  async createBucket(bucketName) {
    try {
      const response = await this.client.post('/api/v1/buckets', {
        name: bucketName,
        public: false
      });
      return response.data;
    } catch (error) {
      // Se o bucket já existe, ignorar erro
      if (error.response?.status === 409) {
        return { name: bucketName, exists: true };
      }
      console.error('Erro ao criar bucket no PPDRIVE:', error);
      throw error;
    }
  }

  /**
   * Lista todos os buckets
   * @returns {Promise<Array>}
   */
  async listBuckets() {
    try {
      const response = await this.client.get('/api/v1/buckets');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar buckets:', error);
      throw error;
    }
  }

  /**
   * Cria uma pasta dentro de um bucket
   * @param {string} bucketName - Nome do bucket
   * @param {string} folderPath - Caminho da pasta
   * @returns {Promise<Object>}
   */
  async createFolder(bucketName, folderPath) {
    try {
      // PPDRIVE usa o conceito de "virtual directories" via prefixos
      // Para "criar" uma pasta, basta fazer upload de um arquivo com o prefixo
      // Mas podemos simular criando um arquivo .keep
      const keepPath = `${folderPath}/.keep`.replace(/\/+/g, '/');
      
      const formData = new FormData();
      formData.append('file', Buffer.from(''), '.keep');
      
      const response = await this.client.post(
        `/api/v1/buckets/${bucketName}/files?path=${encodeURIComponent(keepPath)}`,
        formData,
        { headers: formData.getHeaders() }
      );
      
      return { path: folderPath, created: true };
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      throw error;
    }
  }

  /**
   * Faz upload de um arquivo
   * @param {Buffer|string} fileContent - Conteúdo do arquivo ou caminho
   * @param {string} bucketName - Nome do bucket
   * @param {string} filePath - Caminho completo do arquivo no bucket
   * @returns {Promise<Object>}
   */
  async uploadFile(fileContent, bucketName, filePath) {
    try {
      // Garantir que o bucket existe
      await this.createBucket(bucketName);
      
      // Preparar o conteúdo
      let contentBuffer;
      if (typeof fileContent === 'string' && fs.existsSync(fileContent)) {
        contentBuffer = fs.readFileSync(fileContent);
      } else {
        contentBuffer = fileContent;
      }

      // Criar FormData
      const formData = new FormData();
      formData.append('file', contentBuffer, path.basename(filePath));

      // Upload
      const response = await this.client.post(
        `/api/v1/buckets/${bucketName}/files?path=${encodeURIComponent(filePath)}`,
        formData,
        { headers: formData.getHeaders() }
      );

      // Gerar link de acesso (se o bucket for público) ou link temporário
      const fileUrl = `${this.baseURL}/api/v1/buckets/${bucketName}/files/${encodeURIComponent(filePath)}`;

      return {
        fileId: response.data.id || `${bucketName}:${filePath}`,
        name: path.basename(filePath),
        path: filePath,
        bucket: bucketName,
        link: fileUrl,
        size: contentBuffer.length
      };
    } catch (error) {
      console.error('Erro ao fazer upload para PPDRIVE:', error);
      throw error;
    }
  }

  /**
   * Faz upload de texto como arquivo .txt
   * @param {string} text - Conteúdo do texto
   * @param {string} bucketName - Nome do bucket
   * @param {string} folderPath - Caminho da pasta
   * @param {string} filename - Nome do arquivo
   * @returns {Promise<Object>}
   */
  async uploadTextFile(text, bucketName, folderPath, filename) {
    const content = Buffer.from(text, 'utf-8');
    const fullFilename = filename.endsWith('.txt') ? filename : `${filename}.txt`;
    const fullPath = `${folderPath}/${fullFilename}`.replace(/\/+/g, '/');
    
    // Criar a estrutura de pastas virtual (opcional)
    if (folderPath !== '/') {
      await this.createFolder(bucketName, folderPath);
    }
    
    return this.uploadFile(content, bucketName, fullPath);
  }

  /**
   * Lista arquivos em uma pasta
   * @param {string} bucketName - Nome do bucket
   * @param {string} folderPath - Caminho da pasta
   * @returns {Promise<Array>}
   */
  async listFiles(bucketName, folderPath = '/') {
    try {
      const response = await this.client.get(
        `/api/v1/buckets/${bucketName}/files?prefix=${encodeURIComponent(folderPath)}`
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      throw error;
    }
  }

  /**
   * Obtém um arquivo (download)
   * @param {string} bucketName - Nome do bucket
   * @param {string} filePath - Caminho do arquivo
   * @returns {Promise<Buffer>}
   */
  async downloadFile(bucketName, filePath) {
    try {
      const response = await this.client.get(
        `/api/v1/buckets/${bucketName}/files/${encodeURIComponent(filePath)}`,
        { responseType: 'arraybuffer' }
      );
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      throw error;
    }
  }

  /**
   * Exclui um arquivo
   * @param {string} bucketName - Nome do bucket
   * @param {string} filePath - Caminho do arquivo
   * @returns {Promise<boolean>}
   */
  async deleteFile(bucketName, filePath) {
    try {
      await this.client.delete(
        `/api/v1/buckets/${bucketName}/files/${encodeURIComponent(filePath)}`
      );
      return true;
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      throw error;
    }
  }

  /**
   * Verifica se um arquivo existe
   * @param {string} bucketName - Nome do bucket
   * @param {string} filePath - Caminho do arquivo
   * @returns {Promise<boolean>}
   */
  async fileExists(bucketName, filePath) {
    try {
      await this.client.head(
        `/api/v1/buckets/${bucketName}/files/${encodeURIComponent(filePath)}`
      );
      return true;
    } catch (error) {
      if (error.response?.status === 404) return false;
      throw error;
    }
  }
}

// Factory para criar instância configurada
function createStorageClient() {
  const baseURL = process.env.PPDRIVE_URL || 'http://localhost:8080';
  const apiKey = process.env.PPDRIVE_API_KEY || null;
  return new PPDRIVEStorage(baseURL, apiKey);
}

module.exports = {
  PPDRIVEStorage,
  createStorageClient
};
