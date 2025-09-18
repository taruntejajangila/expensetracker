import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import AuthProvider
import { AuthProvider } from './app/contexts/AuthContext';

// Import your existing components
import Header from './components/Header';
import Sidebar from './components/Sidebar';

// Import pages from app directory
import Dashboard from './app/page';
import Users from './app/users/page';
import Alerts from './app/alerts/page';
import Analytics from './app/analytics/page';
import Banners from './app/banners/page';
import Financial from './app/financial/page';
import Logs from './app/logs/page';
import Monitoring from './app/monitoring/page';
import Notifications from './app/notifications/page';
import Reports from './app/reports/page';
import Settings from './app/settings/page';
import Login from './app/login/page';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <div className="admin-layout">
                <Header />
                <div className="main-content">
                  <Sidebar />
                  <div className="content">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/alerts" element={<Alerts />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/banners" element={<Banners />} />
                      <Route path="/financial" element={<Financial />} />
                      <Route path="/logs" element={<Logs />} />
                      <Route path="/monitoring" element={<Monitoring />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/settings" element={<Settings />} />
                    </Routes>
                  </div>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
