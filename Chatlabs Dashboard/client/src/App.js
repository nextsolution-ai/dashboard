import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import KnowledgeBase from './components/KnowledgeBase';
import Conversations from './components/Conversations';
import './App.css';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  // Protected Route component
  const PrivateRoute = ({ component: Component, ...rest }) => (
    <Route
      {...rest}
      render={props =>
        isAuthenticated ? (
          <div className="app-container">
            <Component {...props} />
          </div>
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );

  return (
    <Switch>
      <Route exact path="/login">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <Login />}
      </Route>

      <PrivateRoute exact path="/" component={Dashboard} />
      <PrivateRoute path="/dashboard" component={Dashboard} />
      <PrivateRoute path="/knowledge-base" component={KnowledgeBase} />
      <PrivateRoute path="/conversations" component={Conversations} />
      <PrivateRoute path="/suggestions" component={Dashboard} />
      <PrivateRoute path="/analytics" component={Dashboard} />

      <Route path="*">
        <Redirect to={isAuthenticated ? "/dashboard" : "/login"} />
      </Route>
    </Switch>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App; 