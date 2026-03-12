import React from 'react';
import { FaDownload } from 'react-icons/fa';
import api from '../services/api';

const DownloadButton = ({ filePath, fileName }) => {
  const baseURL = api.defaults.baseURL.replace('/api', '');
  const fileUrl = `${baseURL}${filePath}`;

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl, { method: 'HEAD' });
      if (!response.ok) throw new Error('Arquivo não encontrado');
      
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('Erro ao baixar o arquivo. Ele pode ter sido removido.');
      console.error(error);
    }
  };

  return (
    <button onClick={handleDownload} className="btn-download" title="Baixar arquivo">
      <FaDownload /> Download
    </button>
  );
};

export default DownloadButton;
