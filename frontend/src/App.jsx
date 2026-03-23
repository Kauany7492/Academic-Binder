import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Planner from './pages/Planner';
import Notebooks from './pages/Notebooks';
import NotebookDetail from './pages/NotebookDetail';
import Books from './pages/Books';
import Podcasts from './pages/Podcasts';
import PDFs from './pages/PDFs';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/planner" element={<Planner />} />
                <Route path="/notebooks" element={
                  <PrivateRoute>
                    <Notebooks />
                  </PrivateRoute>
                } />
                <Route path="/notebooks/:id" element={
                  <PrivateRoute>
                    <NotebookDetail />
                  </PrivateRoute>
                } />
                <Route path="/books" element={
                  <PrivateRoute>
                    <Books />
                  </PrivateRoute>
                } />
                <Route path="/podcasts" element={
                  <PrivateRoute>
                    <Podcasts />
                  </PrivateRoute>
                } />
                <Route path="/pdfs" element={
                  <PrivateRoute>
                    <PDFs />
                  </PrivateRoute>
                } />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;