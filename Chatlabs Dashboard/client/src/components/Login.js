import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const { login } = useAuth();
  
  // Cleanup function
  useEffect(() => {
    let mounted = true;
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password
      });

      if (response.data.token) {
        // Use auth context login
        login(response.data.token, response.data.user);
        
        // Set axios default header
        axios.defaults.headers.common['x-auth-token'] = response.data.token;
        
        // Navigate to dashboard
        history.replace('/dashboard');
      } else {
        setError('Invalid response from server');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'An error occurred during login');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Welcome to chattonAI</h1>
        <p>Sign in to access your dashboard</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your password"
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 