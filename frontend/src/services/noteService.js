import api from './api';

const noteService = {
  createFromFile: (formData) => api.post('/notes/from-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  createCustom: (data) => api.post('/notes/custom', data),
  getNotes: (params) => api.get('/notes', { params }),
  getNote: (id) => api.get(`/notes/${id}`),
  updateNote: (id, data) => api.put(`/notes/${id}`, data),
  deleteNote: (id) => api.delete(`/notes/${id}`)
};

export default noteService;