import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { FaMicrophone, FaUpload, FaLink, FaTrash } from 'react-icons/fa';
import AudioRecorder from '../components/AudioRecorder';
import DownloadButton from '../components/DownloadButton';
import DriveButton from '../components/DriveButton';
import { useGoogleDrive } from '../hooks/useGoogleDrive'; // <-- importa o hook

const NotebookDetail = () => {
  const { id } = useParams();
  const { token, login, exportPage, loading: driveLoading } = useGoogleDrive();
  const [notebook, setNotebook] = useState(null);
  const [paginas, setPaginas] = useState([]);
  const [destaques, setDestaques] = useState([]);
  const [showRecorder, setShowRecorder] = useState(false);
  const [selectedMetodo, setSelectedMetodo] = useState('cornell');
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [highlightColor, setHighlightColor] = useState('#ffff00');
  const [highlightComment, setHighlightComment] = useState('');
  const [currentPagina, setCurrentPagina] = useState(null);
  const [linkUniversidade, setLinkUniversidade] = useState('');
  const [editingLink, setEditingLink] = useState(false);
  const [uploadingNotes, setUploadingNotes] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pdfs, setPdfs] = useState([]);
  const [podcasts, setPodcasts] = useState([]);
  const [exportStatus, setExportStatus] = useState({});

  // ... (mantém os mesmos fetchs, etc., sem alterações)

  const exportToDrive = async (paginaId) => {
    if (!token) {
      login(paginaId); // passa o ID da página como state
      return;
    }
    try {
      const result = await exportPage(paginaId);
      setExportStatus({ ...exportStatus, [paginaId]: { success: true, link: result.link } });
    } catch (err) {
      setExportStatus({ ...exportStatus, [paginaId]: { success: false, error: err.message } });
    }
  };

  // ... (restante do componente)

  return (
    // ... (JSX permanece igual, mas o DriveButton agora usa a função exportToDrive)
    <div className="pagina-actions">
      <DriveButton
        onClick={() => exportToDrive(pagina.id)}
        disabled={driveLoading}
      />
      <button onClick={() => handleDeletePagina(pagina.id)} className="icon-btn delete" title="Excluir página">
        <FaTrash />
      </button>
    </div>
  );
};

export default NotebookDetail;