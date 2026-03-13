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

  async createBucket(bucketName) {
    try {
      const response = await this.client.post('/api/v1/buckets', { name: bucketName, public: false });
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) return { name: bucketName, exists: true };
      throw error;
    }
  }

  async uploadFile(fileContent, bucketName, filePath) {
    try {
      await this.createBucket(bucketName);
      
      let contentBuffer;
      if (typeof fileContent === 'string' && fs.existsSync(fileContent)) {
        contentBuffer = fs.readFileSync(fileContent);
      } else {
        contentBuffer = fileContent;
      }

      const formData = new FormData();
      formData.append('file', contentBuffer, path.basename(filePath));

      const response = await this.client.post(
        `/api/v1/buckets/${bucketName}/files?path=${encodeURIComponent(filePath)}`,
        formData,
        { headers: formData.getHeaders() }
      );

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

  async uploadTextFile(text, bucketName, folderPath, filename) {
    const content = Buffer.from(text, 'utf-8');
    const fullFilename = filename.endsWith('.txt') ? filename : `${filename}.txt`;
    const fullPath = `${folderPath}/${fullFilename}`.replace(/\/+/g, '/');
    return this.uploadFile(content, bucketName, fullPath);
  }
}

function createStorageClient() {
  const baseURL = process.env.PPDRIVE_URL || 'http://localhost:8080';
  const apiKey = process.env.PPDRIVE_API_KEY || null;
  return new PPDRIVEStorage(baseURL, apiKey);
}

module.exports = { PPDRIVEStorage, createStorageClient };
