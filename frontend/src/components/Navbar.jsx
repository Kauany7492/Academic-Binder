import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { FaHome, FaCalendarAlt, FaBook, FaPodcast, FaFilePdf, FaMoon, FaSun, FaBookOpen, FaSignInAlt, FaSignOutAlt } from 'react-icons/fa';
import LoginModal from './LoginModal';
import { FaStickyNote } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const navItems = [
    { path: '/', icon: <FaHome />, label: 'Home' },
    { path: '/planner', icon: <FaCalendarAlt />, label: 'Planner' },
    { path: '/notebooks', icon: <FaBook />, label: 'Notebooks' },
    { path: '/notes', icon: <FaStickyNote />, label: 'Anotações' },
    { path: '/books', icon: <FaBookOpen />, label: 'Livros' },
    { path: '/podcasts', icon: <FaPodcast />, label: 'Podcasts' },
    { path: '/pdfs', icon: <FaFilePdf />, label: 'PDFs' }
  ];

  return (
    <>
      <nav className={`navbar ${isDark ? 'dark' : 'light'}`}>
        <div className="nav-links">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="nav-bottom">
          <button onClick={toggleTheme} className="theme-toggle">
            {isDark ? <FaSun /> : <FaMoon />}
            <span className="nav-label">Theme</span>
          </button>
          <div className="auth-item">
            {user ? (
              <button onClick={logout} className="logout-btn" title="Sair">
                <FaSignOutAlt />
                <span className="nav-label">{user.name?.split(' ')[0]}</span>
              </button>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="login-btn" title="Entrar">
                <FaSignInAlt />
                <span className="nav-label">Login</span>
              </button>
            )}
          </div>
        </div>
      </nav>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
};

export default Navbar;