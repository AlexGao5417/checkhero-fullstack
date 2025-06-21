import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Popconfirm, Space, Pagination, notification, Row, Col } from 'antd';
import axios from 'axios';

const { Option } = Select;

const userTypes = [
  { value: 1, label: 'Admin' },
  { value: 2, label: 'Agent' },
  { value: 3, label: 'Electrician' },
];

const PAGE_SIZE = 5;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  // Search/filter state
  const [searchUsername, setSearchUsername] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchUserType, setSearchUserType] = useState('');

  // Fetch users from backend
  const fetchUsers = async (page = 1, filters = {}) => {
    setLoading(true);
    try {
      const skip = (page - 1) * PAGE_SIZE;
      const params = { skip, limit: PAGE_SIZE };
      if (filters.username) params.username = filters.username;
      if (filters.email) params.email = filters.email;
      if (filters.user_type) params.user_type_id = filters.user_type;
      const res = await axios.get(`${API_BASE}/users/`, { params });
      setUsers(res.data.map(u => ({ ...u, key: u.id, userType: u.user_type })));
      setTotal(res.data.length < PAGE_SIZE && page === 1 ? res.data.length : page * PAGE_SIZE + (res.data.length === PAGE_SIZE ? 1 : 0));
    } catch (err) {
      notification.error({ message: 'Failed to fetch users', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, {
      username: searchUsername,
      email: searchEmail,
      user_type: searchUserType,
    });
    // eslint-disable-next-line
  }, [currentPage, searchUsername, searchEmail, searchUserType]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers(1, {
      username: searchUsername,
      email: searchEmail,
      user_type: searchUserType,
    });
  };

  const handleResetFilters = () => {
    setSearchUsername('');
    setSearchEmail('');
    setSearchUserType('');
    setCurrentPage(1);
  };

  const showAddModal = () => {
    setIsEdit(false);
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (record) => {
    setIsEdit(true);
    setEditingUser(record);
    form.setFieldsValue({ ...record, userType: record.userType });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  const handleDelete = async (key) => {
    try {
      await axios.delete(`${API_BASE}/users/${key}`);
      notification.success({ message: 'User deleted' });
      fetchUsers(currentPage, {
        username: searchUsername,
        email: searchEmail,
        user_type: searchUserType,
      });
    } catch (err) {
      notification.error({ message: 'Failed to delete user', description: err.message });
    }
  };

  const handleOk = async (values) => {
    try {
      console.log('Received values of form: ', values);
      values = await form.validateFields();
      if (isEdit && editingUser) {
        await axios.put(`${API_BASE}/users/${editingUser.key}`, {
          username: values.username,
          email: values.email,
          password: values.password || undefined,
          phone: values.phone,
          user_type_id: values.user_type_id,
        });
        notification.success({ message: 'User updated' });
      } else {
        await axios.post(`${API_BASE}/users/`, {
          username: values.username,
          email: values.email,
          password: values.password,
          phone: values.phone,
          user_type_id: values.user_type_id,
        });
        notification.success({ message: 'User created' });
      }
      setIsModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      fetchUsers(currentPage, {
        username: searchUsername,
        email: searchEmail,
        user_type: searchUserType,
      });
    } catch (err) {
      notification.error({ message: 'Failed to save user', description: err.response?.data?.detail || err.message });
    }
  };

  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'User Type', dataIndex: 'user_type_id', key: 'user_type_id', render: (type) => userTypes.find(u => u.value === type)?.label },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => showEditModal(record)}>Edit</Button>
          <Popconfirm title="Are you sure to delete this user?" onConfirm={() => handleDelete(record.key)} okText="Yes" cancelText="No">
            <Button type="link" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row align="middle" justify="space-between" style={{ marginBottom: 24 }}>
        <Col>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: 28, letterSpacing: 0.5 }}>User Management</h2>
        </Col>
        <Col>
          <Button type="primary" onClick={showAddModal} size="large">Add User</Button>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 16 }} align="middle">
        <Col xs={24} sm={8} md={6} lg={5} xl={4} style={{ marginBottom: 8 }}>
          <Input
            placeholder="Search Username"
            value={searchUsername}
            onChange={e => setSearchUsername(e.target.value)}
            allowClear
            onPressEnter={handleSearch}
          />
        </Col>
        <Col xs={24} sm={8} md={6} lg={5} xl={4} style={{ marginBottom: 8 }}>
          <Input
            placeholder="Search Email"
            value={searchEmail}
            onChange={e => setSearchEmail(e.target.value)}
            allowClear
            onPressEnter={handleSearch}
          />
        </Col>
        <Col xs={24} sm={8} md={6} lg={5} xl={4} style={{ marginBottom: 8 }}>
          <Select
            placeholder="User Type"
            value={searchUserType || undefined}
            onChange={setSearchUserType}
            allowClear
            style={{ width: '100%' }}
          >
            {userTypes.map(type => (
              <Option key={type.value} value={type.value}>{type.label}</Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={24} md={6} lg={5} xl={4} style={{ marginBottom: 8 }}>
          <Space>
            <Button type="primary" onClick={handleSearch}>Search</Button>
            <Button onClick={handleResetFilters}>Reset</Button>
          </Space>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={users}
        pagination={false}
        rowKey="key"
        loading={loading}
        bordered
        style={{ borderRadius: 12, overflow: 'hidden' }}
      />
      <Pagination
        current={currentPage}
        pageSize={PAGE_SIZE}
        total={total}
        onChange={setCurrentPage}
        style={{ marginTop: 16, textAlign: 'right' }}
      />
      <Modal
        open={isModalVisible}
        title={isEdit ? 'Edit User' : 'Add User'}
        okText="Create"
        cancelText="Cancel"
        okButtonProps={{ autoFocus: true, htmlType: 'submit' }}
        onCancel={handleCancel}
        destroyOnHidden
        modalRender={dom => (
          <Form
            layout="vertical"
            form={form}
            name="form_in_modal"
            clearOnDestroy
            onFinish={values => handleOk(values)}
          >
            {dom}
          </Form>
        )}
      >
        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: 'Please input the username!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, message: 'Please input a valid email!', type: 'email' }]}
        >
          <Input />
        </Form.Item>
        {!isEdit && <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: 'Please input a password!', type: 'password' }]}
        >
          <Input.Password />
        </Form.Item>}
        <Form.Item
          name="phone"
          label="Phone Number"
        >
          <Input />
        </Form.Item>
        <Form.Item name="user_type_id" label="User Type" rules={[{ required: true, message: 'Please select a user type!' }]}> 
          <Select> {userTypes.map(type => <Option key={type.value} value={type.value}>{type.label}</Option>)} </Select> 
        </Form.Item>
      </Modal>
    </div>
  );
};

export default UserManagement;
