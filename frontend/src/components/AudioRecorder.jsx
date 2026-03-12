import React from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import api from '../services/api';

const AudioRecorder = ({ notebookId, metodo, onProcessed }) => {
  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({
    audio: true,
    onStop: async (blobUrl, blob) => {
      const formData = new FormData();
      formData.append('file', blob, 'recording.webm');
      formData.append('caderno_id', notebookId);
      formData.append('metodo', metodo);
      formData.append('titulo', `Nota por áudio - ${new Date().toLocaleString()}`);
      
      try {
        const response = await api.post('/gerar-anotacoes', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data.success) {
          onProcessed(response.data.pagina);
        }
      } catch (error) {
        console.error('Erro ao processar áudio:', error);
        alert('Erro ao processar áudio. Tente novamente.');
      }
    }
  });

  return (
    <div className="audio-recorder">
      <p>Status: {status}</p>
      <button onClick={startRecording}>Iniciar Gravação</button>
      <button onClick={stopRecording}>Parar Gravação</button>
      {mediaBlobUrl && (
        <audio src={mediaBlobUrl} controls />
      )}
    </div>
  );
};

export default AudioRecorder;
