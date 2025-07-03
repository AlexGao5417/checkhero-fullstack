import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Spin, Statistic, Avatar, Badge, Space, Typography, Tag, notification } from 'antd';
import { logout } from '../redux/authSlice';
import {
  UserOutlined,
  SolutionOutlined,
  FileTextOutlined,
  HomeOutlined,
  DollarCircleOutlined,
  TeamOutlined,
  FormOutlined
} from '@ant-design/icons';
import { USER_ROLES } from '@utils/constants';
import axios from '@utils/axios';

const { Sider } = Layout;
const { Text, Title } = Typography;

const Sidebar = () => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [agentStatus, setAgentStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  useEffect(() => {
    const fetchAgentStatus = async () => {
      if (user && user.user_type_id === USER_ROLES.AGENT) {
        setLoadingStatus(true);
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          const res = await axios.get(`${apiUrl}/agent/status`);
          setAgentStatus(res.data);
        } catch (error) {
          console.error("Failed to fetch agent status:", error);
          setAgentStatus(null);
        } finally {
          setLoadingStatus(false);
        }
      } else {
        setAgentStatus(null);
      }
    };

    fetchAgentStatus();
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  const isAdmin = user.user_type_id === USER_ROLES.ADMIN;
  const isAgent = user.user_type_id === USER_ROLES.AGENT;
  const isElectrician = user.user_type_id === USER_ROLES.USER;

  const menuItems = [
    { key: 'account', icon: <UserOutlined />, label: <Link to="/account">My Account</Link> },
    { key: 'reports', icon: <FileTextOutlined />, label: <Link to="/reports">Reports</Link> },
    { key: 'property-management', icon: <HomeOutlined />, label: <Link to="/property-management">Property Management</Link> },
    isAdmin && { key: 'users', icon: <TeamOutlined />, label: <Link to="/users">User Management</Link> },
    (isAgent && user.isAffiliate || isAdmin) && { key: 'withdraw', icon: <DollarCircleOutlined />, label: <Link to="/withdraw">Withdrawals</Link> },
    isAdmin && { key: 'agent-rewards', icon: <DollarCircleOutlined />, label: <Link to="/agent-rewards">Agent Rewards</Link> },
    (isAdmin || isElectrician) && { 
      key: 'forms', 
      icon: <FormOutlined />, 
      label: 'Forms',
      children: [
        { key: 'form-electric', label: <Link to="/form">Electrical/Smoke</Link> },
        { key: 'form-gas', label: <Link to="/gas-form">Gas</Link> },
        { key: 'form-smoke', label: <Link to="/smoke-form">Smoke Only</Link> },
      ]
    },
    isAdmin && { key: 'audit-logs', icon: <FileTextOutlined />, label: <Link to="/audit-logs">Audit Logs</Link> },
  ].filter(Boolean);

  // Map pathnames to menu keys
  const pathToKey = {
    '/account': 'account',
    '/reports': 'reports',
    '/property-management': 'property-management',
    '/users': 'users',
    '/withdraw': 'withdraw',
    '/agent-rewards': 'agent-rewards',
    '/form': 'form-electric',
    '/gas-form': 'form-gas',
    '/smoke-form': 'form-smoke',
    '/audit-logs': 'audit-logs',
  };
  // For nested forms, highlight 'forms' parent if on a form page
  const formPaths = ['/form', '/gas-form', '/smoke-form'];
  let selectedKey = pathToKey[location.pathname] || 'account';
  let openKeys = [];
  if (formPaths.includes(location.pathname)) {
    openKeys = ['forms'];
  }

  return (
    <Sider width={250} style={{ background: '#fff', padding: '16px' }}>
       {loadingStatus ? (
        <Spin />
      ) : agentStatus?.is_affiliate && (
        <div style={{ padding: '8px', border: '1px solid #f0f0f0', borderRadius: '8px', marginBottom: '16px' }}>
          <Statistic title="Balance" value={agentStatus.balance} precision={0} prefix="$" style={{ marginBottom: '12px' }}/>
          {agentStatus.pending_withdrawal > 0 && (
            <Statistic title="Pending Withdrawal" value={agentStatus.pending_withdrawal} precision={0} prefix="$" />
          )}
        </div>
      )}
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={openKeys}
        style={{ height: 'calc(100% - 150px)', borderRight: 0 }}
        items={menuItems}
      />
      <div style={{ position: 'absolute', bottom: 20, width: 'calc(100% - 32px)', textAlign: 'center' }}>
        <Button type="primary" onClick={handleLogout} block>
          Sign Out
        </Button>
      </div>
    </Sider>
  );
};

export default Sidebar; 