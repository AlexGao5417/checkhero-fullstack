import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button } from 'antd';
import { logout } from '../redux/authSlice';
import {
  UserOutlined,
  SolutionOutlined,
  FileTextOutlined,
  HomeOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = () => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getMenuItems = () => {
    const items = [];
    if (!user) return items;

    const { user_type_id } = user;

    if (user_type_id === 1) { // Admin
      items.push(
        { key: '1', icon: <SolutionOutlined />, label: <Link to="/reports">Reports</Link> },
        { key: '2', icon: <UserOutlined />, label: <Link to="/user-management">User Management</Link> },
        { key: '3', icon: <FileTextOutlined />, label: <Link to="/form">Form</Link> },
        { key: '4', icon: <FileTextOutlined />, label: <Link to="/gas-form">Gas Safety Check Form</Link> },
        { key: '5', icon: <FileTextOutlined />, label: <Link to="/smoke-form">Smoke Safety Check Form</Link> }
      );
    } else if (user_type_id === 2) { // Agent
      items.push(
        { key: '1', icon: <HomeOutlined />, label: <Link to="/property-management">Property Management</Link> },
        { key: '2', icon: <SolutionOutlined />, label: <Link to="/reports">Reports</Link> }
      );
    } else if (user_type_id === 3) { // Electrician
      items.push(
        { key: '1', icon: <SolutionOutlined />, label: <Link to="/reports">Reports</Link> },
        { key: '2', icon: <FileTextOutlined />, label: <Link to="/form">Electricity & Smoke Safety Check Form</Link> },
        { key: '3', icon: <FileTextOutlined />, label: <Link to="/gas-form">Gas Safety Check Form</Link> },
        { key: '4', icon: <FileTextOutlined />, label: <Link to="/smoke-form">Smoke Safety Check Form</Link> }
      );
    }
    return items;
  };

  return (
    <Sider width={200} style={{ background: '#fff' }}>
      <Menu
        mode="inline"
        defaultSelectedKeys={['1']}
        style={{ height: '100%', borderRight: 0, display: 'flex', flexDirection: 'column' }}
        items={getMenuItems()}
      />
      <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center' }}>
        <Button type="primary" onClick={handleLogout}>
          Sign Out
        </Button>
      </div>
    </Sider>
  );
};

export default Sidebar; 