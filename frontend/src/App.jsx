import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Planner from './pages/Planner';
import Notebooks from './pages/Notebooks';
import NotebookDetail from './pages/NotebookDetail';
import Books from './pages/Books';
import Podcasts from './pages/Podcasts';
import PDFs from './pages/PDFs';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/notebooks" element={<Notebooks />} />
              <Route path="/notebooks/:id" element={<NotebookDetail />} />
              <Route path="/books" element={<Books />} />
              <Route path="/podcasts" element={<Podcasts />} />
              <Route path="/pdfs" element={<PDFs />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
