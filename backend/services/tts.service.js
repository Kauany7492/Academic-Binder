// backend/services/tts.service.js
const AWS = require('aws-sdk');

// Configurar AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const polly = new AWS.Polly();

/**
 * Sintetiza texto em áudio usando Amazon Polly
 * @param {string} text - Texto a ser convertido
 * @param {string} voiceId - ID da voz (padrão: Camila - pt-BR)
 * @param {string} engine - neural ou standard
 * @returns {Promise<Buffer>} Buffer do áudio MP3
 */
async function synthesizeSpeech(text, voiceId = null, engine = null) {
  const params = {
    OutputFormat: 'mp3',
    Text: text,
    VoiceId: voiceId || process.env.POLLY_VOICE_ID || 'Camila',
    Engine: engine || process.env.POLLY_ENGINE || 'neural',
    LanguageCode: 'pt-BR',
    SampleRate: '24000'
  };

  try {
    const data = await polly.synthesizeSpeech(params).promise();
    return data.AudioStream; // Buffer do áudio
  } catch (error) {
    console.error('Erro no Amazon Polly:', error);
    throw new Error(`Falha na síntese de voz: ${error.message}`);
  }
}

/**
 * Lista todas as vozes disponíveis
 * @returns {Promise<Array>} Lista de vozes
 */
async function listVoices() {
  try {
    const data = await polly.describeVoices({ LanguageCode: 'pt-BR' }).promise();
    return data.Voices;
  } catch (error) {
    console.error('Erro ao listar vozes:', error);
    throw error;
  }
}

module.exports = {
  synthesizeSpeech,
  listVoices
};
