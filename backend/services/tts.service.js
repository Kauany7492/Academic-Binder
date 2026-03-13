const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const polly = new AWS.Polly();

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
    return data.AudioStream;
  } catch (error) {
    console.error('Erro no Amazon Polly:', error);
    throw new Error(`Falha na síntese de voz: ${error.message}`);
  }
}

module.exports = { synthesizeSpeech };
