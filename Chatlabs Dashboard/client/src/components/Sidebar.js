import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import './Sidebar.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const history = useHistory();
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { icon: '🏠', label: 'Home', route: '/' },
    { icon: '💬', label: 'Conversations', route: '/conversations' },
    { icon: '💡', label: 'Suggestions', route: '/suggestions' },
    { icon: '📚', label: 'Training', route: '/knowledge-base' },
    { icon: '📊', label: 'Performance', route: '/analytics' }
  ];

  const handleLogout = () => {
    // Use auth context logout
    logout();
    // Clear axios default header
    delete axios.defaults.headers.common['x-auth-token'];
    // Redirect to login
    history.replace('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        {/* <img src="/logo.png" alt="ChattonAI" className="logo" /> */}
        <span className="brand-name">chattonAI</span>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <div
            key={index}
            className={`nav-item ${location.pathname === item.route ? 'active' : ''}`}
            onClick={() => history.push(item.route)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">WC</div>
          <span className="user-name">David</span>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 