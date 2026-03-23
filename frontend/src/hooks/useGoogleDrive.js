import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const STORAGE_KEY = 'driveToken';

export const useGoogleDrive = () => {
  const [token, setToken] = useState(localStorage.getItem(STORAGE_KEY));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Captura token da URL após redirecionamento
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      localStorage.setItem(STORAGE_KEY, urlToken);
      setToken(urlToken);
      // Remove o token da URL sem recarregar a página
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Função para iniciar o fluxo de login do Google
  const login = useCallback((state = '') => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google?state=${state}`;
  }, []);

  // Função para fazer uma requisição autenticada para os endpoints do Drive
  const request = useCallback(async (endpoint, data, method = 'POST') => {
    if (!token) {
      // Se não há token, redireciona para login (opcional)
      // throw new Error('Não autenticado');
      login();
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api({
        method,
        url: endpoint,
        data,
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (err) {
      console.error(`Erro na requisição para ${endpoint}:`, err);
      setError(err.response?.data?.error || err.message);
      // Se o token for inválido ou expirado, força novo login
      if (err.response?.status === 401) {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        login();
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, login]);

  // Função para exportar uma página (NotebookDetail)
  const exportPage = useCallback(async (paginaId) => {
    return request('/drive/export-page', { pagina_id: paginaId });
  }, [request]);

  // Função para exportar um PDF (PDFs)
  const exportPDF = useCallback(async (pdfId) => {
    return request('/drive/export-pdf', { pdf_id: pdfId });
  }, [request]);

  // Função para exportar um caderno (Notebooks)
  const exportNotebook = useCallback(async (notebookId) => {
    return request('/drive/export-notebook', { notebook_id: notebookId });
  }, [request]);

  // Função para limpar token (logout)
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
  }, []);

  return {
    token,
    loading,
    error,
    login,
    logout,
    exportPage,
    exportPDF,
    exportNotebook
  };
};