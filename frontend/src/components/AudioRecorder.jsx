import React, { useState } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import api from '../services/api';

const AudioRecorder = ({ notebookId, metodo, onProcessed }) => {
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({
    audio: true,
    onStop: (blobUrl, blob) => {
      setRecordingBlob(blob);
      setStatusMessage('Áudio gravado. Clique em "Gerar Notas" para processar.');
    }
  });

  const handleGenerateNotes = async () => {
    if (!recordingBlob) {
      alert('Nenhum áudio gravado. Grave primeiro.');
      return;
    }
    setIsProcessing(true);
    setProgress(10);
    setStatusMessage('Enviando áudio...');

    const formData = new FormData();
    formData.append('file', recordingBlob, 'recording.webm');
    formData.append('caderno_id', notebookId);
    formData.append('metodo', metodo);
    formData.append('titulo', `Nota por áudio - ${new Date().toLocaleString()}`);

    try {
      setProgress(40);
      const response = await api.post('/gerar-anotacoes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(40 + percent * 0.5); // até 90%
        }
      });
      setProgress(100);
      setStatusMessage('Notas geradas com sucesso!');
      if (response.data.success) {
        onProcessed(response.data.pagina);
        setRecordingBlob(null);
        setTimeout(() => setStatusMessage(''), 2000);
      }
    } catch (error) {
      console.error('Erro ao processar áudio:', error);
      setStatusMessage('Erro no processamento. Verifique o console.');
      alert(`Erro ao processar áudio: ${error.response?.data?.details || error.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className="audio-recorder">
      <p>Status: {status}</p>
      <div className="recorder-buttons">
        <button onClick={startRecording}>Iniciar Gravação</button>
        <button onClick={stopRecording}>Parar Gravação</button>
      </div>
      {mediaBlobUrl && (
        <div>
          <audio src={mediaBlobUrl} controls />
          <button
            onClick={handleGenerateNotes}
            disabled={!recordingBlob || isProcessing}
            className="btn-primary"
            style={{ marginTop: '1rem' }}
          >
            {isProcessing ? 'Processando...' : 'Gerar Notas'}
          </button>
        </div>
      )}
      {isProcessing && (
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          <p>{statusMessage}</p>
        </div>
      )}
      {!isProcessing && statusMessage && <p>{statusMessage}</p>}
    </div>
  );
};

export default AudioRecorder;