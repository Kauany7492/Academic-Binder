import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaUpload, FaTrash, FaEye, FaTimes } from 'react-icons/fa';
import DownloadButton from '../components/DownloadButton';
import DriveButton from '../components/DriveButton'; // <-- importação correta
import { Document, Page, pdfjs } from 'react-pdf';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFs = () => {
  const { token, login, exportPDF, loading: driveLoading } = useGoogleDrive();
  const [pdfs, setPdfs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [cadernoId, setCadernoId] = useState('');
  const [cadernos, setCadernos] = useState([]);
  const [previewPdf, setPreviewPdf] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [progress, setProgress] = useState(0);
  const [exporting, setExporting] = useState({});

  useEffect(() => {
    fetchPDFs();
    fetchCadernos();
  }, []);

  const fetchPDFs = async () => {
    try {
      const res = await api.get('/pdfs');
      setPdfs(res.data);
    } catch (error) {
      console.error('Erro ao carregar PDFs:', error);
    }
  };

  const fetchCadernos = async () => {
    try {
      const res = await api.get('/cadernos');
      setCadernos(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !titulo) return;
    const formData = new FormData();
    formData.append('arquivo', selectedFile);
    formData.append('titulo', titulo);
    formData.append('caderno_id', cadernoId || 1);

    try {
      setUploading(true);
      setProgress(30);
      const res = await api.post('/pdfs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percent);
        }
      });
      setProgress(100);
      await api.post(`/pdfs/${res.data.id}/resumir`);
      fetchPDFs();
      setSelectedFile(null);
      setTitulo('');
      setCadernoId('');
      setTimeout(() => setProgress(0), 1000);
    } catch (error) {
      console.error(error);
      alert('Erro ao fazer upload do PDF');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Excluir PDF?')) {
      try {
        await api.delete(`/pdfs/${id}`);
        fetchPDFs();
      } catch (error) {
        console.error(error);
        alert('Erro ao excluir PDF');
      }
    }
  };

  const handleDriveExport = async (pdf) => {
    if (!token) {
      login(`pdf-${pdf.id}`);
      return;
    }
    setExporting(prev => ({ ...prev, [pdf.id]: true }));
    try {
      const result = await exportPDF(pdf.id);
      alert(`PDF enviado para o Drive com sucesso! ${result.link}`);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Falha ao enviar para o Drive.');
    } finally {
      setExporting(prev => ({ ...prev, [pdf.id]: false }));
    }
  };

  const handlePreview = (pdf) => {
    const baseURL = api.defaults.baseURL.replace('/api', '');
    setPreviewPdf({
      url: `${baseURL}${pdf.arquivo_path}`,
      titulo: pdf.titulo
    });
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  return (
    <div className="pdfs-container page-container">
      <h1>PDFs</h1>
      <form onSubmit={handleUpload} className="upload-form">
        <div className="form-row">
          <input
            type="text"
            placeholder="Título do PDF"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
          <select value={cadernoId} onChange={(e) => setCadernoId(e.target.value)} required>
            <option value="">Selecione um caderno</option>
            {cadernos.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
          </select>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            required
          />
          <button type="submit" disabled={uploading} className="btn-primary">
            <FaUpload /> {uploading ? 'Enviando...' : 'Upload PDF'}
          </button>
        </div>
        {uploading && (
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </form>
      <div className="supported-formats">
        Formatos suportados: PDF
      </div>

      <div className="pdfs-grid">
        {pdfs.map(pdf => (
          <div key={pdf.id} className="pdf-card">
            <h3>{pdf.titulo}</h3>
            {pdf.resumo_ia && <p className="resumo"><strong>Resumo IA:</strong> {pdf.resumo_ia}</p>}
            <div className="actions">
              <button onClick={() => handlePreview(pdf)} className="btn-preview">
                <FaEye /> Visualizar
              </button>
              <DownloadButton filePath={pdf.arquivo_path} fileName={pdf.titulo + '.pdf'} />
              <DriveButton
                onClick={() => handleDriveExport(pdf)}
                disabled={exporting[pdf.id] || driveLoading}
                title="Enviar para o Google Drive"
              />
              <button onClick={() => handleDelete(pdf.id)} className="delete">
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {previewPdf && (
        <div className="modal pdf-preview-modal">
          <div className="modal-content large">
            <div className="modal-header">
              <h2>{previewPdf.titulo}</h2>
              <button onClick={() => setPreviewPdf(null)} className="close-btn">
                <FaTimes />
              </button>
            </div>
            <div className="pdf-container">
              <Document
                file={previewPdf.url}
                onLoadSuccess={onDocumentLoadSuccess}
                loading="Carregando PDF..."
                error="Erro ao carregar PDF"
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <Page key={`page_${index + 1}`} pageNumber={index + 1} />
                ))}
              </Document>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFs;