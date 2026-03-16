import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { FaHome, FaCalendarAlt, FaBook, FaPodcast, FaFilePdf, FaMoon, FaSun, FaBookOpen } from 'react-icons/fa';

const Navbar = () => {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: <FaHome />, label: 'Home' },
    { path: '/planner', icon: <FaCalendarAlt />, label: 'Planner' },
    { path: '/notebooks', icon: <FaBook />, label: 'Notebooks' },
    { path: '/books', icon: <FaBookOpen />, label: 'Livros' },
    { path: '/podcasts', icon: <FaPodcast />, label: 'Podcasts' },
    { path: '/pdfs', icon: <FaFilePdf />, label: 'PDFs' },
  ];

  return (
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
      <button onClick={toggleTheme} className="theme-toggle">
        {isDark ? <FaSun /> : <FaMoon />}
        <span className="nav-label">Theme</span>
      </button>
    </nav>
  );
};

export default Navbar;
