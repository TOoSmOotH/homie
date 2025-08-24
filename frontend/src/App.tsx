import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Settings from './pages/Settings';
import Login from './pages/Login';
import InitialSetup from './pages/InitialSetup';
import PasswordReset from './pages/PasswordReset';
import EmailVerification from './pages/EmailVerification';
import UserManagement from './pages/admin/UserManagement';
import NotFound from './pages/NotFound';
import { queryClient } from './utils/queryClient';

const App: React.FC = () => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App Error:', error, errorInfo);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Router basename={import.meta.env.VITE_BASE_PATH || ''}>
            <AuthProvider>
              <WebSocketProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/setup" element={<InitialSetup />} />
                  <Route path="/password-reset" element={<PasswordReset />} />
                  <Route path="/verify-email" element={<EmailVerification />} />
                  <Route element={<Layout />}>
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/services"
                      element={
                        <ProtectedRoute>
                          <Services />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/users"
                      element={
                        <ProtectedRoute requireAdmin>
                          <UserManagement />
                        </ProtectedRoute>
                      }
                    />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </WebSocketProvider>
            </AuthProvider>
          </Router>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;