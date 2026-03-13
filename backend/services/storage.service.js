// backend/services/storage.service.js
const { Dropbox } = require('dropbox');
const fetch = require('isomorphic-fetch');
const fs = require('fs');

let dropboxClient = null;

/**
 * Inicializa o cliente Dropbox com as credenciais
 */
function initDropboxClient() {
  if (!dropboxClient) {
    dropboxClient = new Dropbox({
      clientId: process.env.DROPBOX_APP_KEY,
      clientSecret: process.env.DROPBOX_APP_SECRET,
      refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
      fetch
    });
  }
  return dropboxClient;
}

/**
 * Cria uma pasta no Dropbox
 * @param {string} folderPath - Caminho da pasta (ex: '/AcademicBinder/Matematica')
 * @returns {Promise<Object>} Metadata da pasta
 */
async function createFolder(folderPath) {
  const dbx = initDropboxClient();
  try {
    const response = await dbx.filesCreateFolderV2({
      path: folderPath,
      autorename: true
    });
    return response.result;
  } catch (error) {
    // Se a pasta já existe, não é erro
    if (error.status === 409) {
      return { path: folderPath };
    }
    console.error('Erro ao criar pasta no Dropbox:', error);
    throw error;
  }
}

/**
 * Faz upload de um arquivo para o Dropbox
 * @param {Buffer|string} fileContent - Conteúdo do arquivo ou caminho
 * @param {string} dropboxPath - Caminho no Dropbox
 * @param {string} filename - Nome do arquivo
 * @returns {Promise<Object>} Metadata do arquivo
 */
async function uploadFile(fileContent, dropboxPath, filename) {
  const dbx = initDropboxClient();
  
  try {
    // Garantir que a pasta existe
    await createFolder(dropboxPath);
    
    const fullPath = `${dropboxPath}/${filename}`;
    
    // Se fileContent for caminho de arquivo, ler como buffer
    let content;
    if (typeof fileContent === 'string' && fs.existsSync(fileContent)) {
      content = fs.readFileSync(fileContent);
    } else {
      content = fileContent;
    }

    const response = await dbx.filesUpload({
      path: fullPath,
      contents: content,
      mode: 'add',
      autorename: true
    });

    // Criar link compartilhado
    const shared = await dbx.sharingCreateSharedLink({
      path: response.result.path_lower
    });

    return {
      fileId: response.result.id,
      name: response.result.name,
      path: response.result.path_display,
      link: shared.result.url.replace('?dl=0', '?dl=1'), // Link direto
      size: response.result.size
    };
  } catch (error) {
    console.error('Erro ao fazer upload para Dropbox:', error);
    throw error;
  }
}

/**
 * Faz upload de texto como arquivo .txt
 * @param {string} text - Conteúdo do texto
 * @param {string} dropboxPath - Caminho da pasta
 * @param {string} filename - Nome do arquivo (sem extensão)
 * @returns {Promise<Object>} Metadata do arquivo
 */
async function uploadTextFile(text, dropboxPath, filename) {
  const content = Buffer.from(text, 'utf-8');
  const fullFilename = filename.endsWith('.txt') ? filename : `${filename}.txt`;
  return uploadFile(content, dropboxPath, fullFilename);
}

/**
 * Obtém metadados de um arquivo/pasta
 * @param {string} path - Caminho no Dropbox
 * @returns {Promise<Object>} Metadata
 */
async function getMetadata(path) {
  const dbx = initDropboxClient();
  try {
    const response = await dbx.filesGetMetadata({ path });
    return response.result;
  } catch (error) {
    console.error('Erro ao obter metadados:', error);
    throw error;
  }
}

/**
 * Lista conteúdo de uma pasta
 * @param {string} folderPath - Caminho da pasta
 * @returns {Promise<Array>} Lista de arquivos/pastas
 */
async function listFolder(folderPath) {
  const dbx = initDropboxClient();
  try {
    const response = await dbx.filesListFolder({ path: folderPath });
    return response.result.entries;
  } catch (error) {
    console.error('Erro ao listar pasta:', error);
    throw error;
  }
}

module.exports = {
  createFolder,
  uploadFile,
  uploadTextFile,
  getMetadata,
  listFolder,
  initDropboxClient
};
