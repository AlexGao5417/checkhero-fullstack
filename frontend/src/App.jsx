import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Layout } from 'antd';
import LoginPage from './components/Auth/LoginPage';
import UserManagement from './components/Auth/UserManagement';
import ReportsTable from './components/Reports/ReportsTable';
import Sidebar from './components/Sidebar';
import GuestRoute from './components/Auth/GuestRoute';
import FormPage from './pages/FormPage';
import GasFormPage from './pages/GasFormPage';

const { Content } = Layout;

const ProtectedRoute = () => {
  const { isAuthenticated } = useSelector(state => state.auth);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

const AppLayout = () => (
  <Layout style={{ minHeight: '100vh' }}>
    <Sidebar />
    <Layout>
      <Content style={{ padding: '24px' }}>
        <Outlet />
      </Content>
    </Layout>
  </Layout>
);

const App = () => {
  const { user } = useSelector(state => state.auth);

  const getDefaultPath = () => {
    if (!user) return '/login';
    switch (user.user_type_id) {
      case 1: return '/reports';
      case 2: return '/property-management';
      case 3: return '/reports';
      default: return '/login';
    }
  };

  return (
    <Router>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/reports" element={<ReportsTable />} />
            <Route path="/form" element={<FormPage />} />
            <Route path="/gas-form" element={<GasFormPage />} />
            {/* Add other protected routes here */}
            <Route path="/" element={<Navigate to={getDefaultPath()} />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
