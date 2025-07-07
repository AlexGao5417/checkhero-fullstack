import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Popconfirm, Space, Pagination, notification, Row, Col, message, Switch } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import axios from '@utils/axios';
import { USER_ROLES } from '@utils/constants';

const { Option } = Select;

const userTypes = [
  { value: USER_ROLES.ADMIN, label: 'Admin' },
  { value: USER_ROLES.AGENT, label: 'Agent' },
  { value: USER_ROLES.USER, label: 'User' },
];

const PAGE_SIZE = 10;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
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
      const res = await axios.get(`/users/`, { params });
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
    form.setFieldsValue({
      ...record,
      user_type_id: record.user_type_id,
      is_affiliate: record.is_affiliate,
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  const showDeleteModal = (record) => {
    setUserToDelete(record);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      handleDelete(userToDelete.id);
    }
    setIsDeleteModalVisible(false);
    setUserToDelete(null);
  };

  const handleDelete = async (key) => {
    try {
      await axios.delete(`/users/${key}`);
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

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (isEdit && editingUser) {
        // Use the admin endpoint for edits
        const url = `/users/admin/${editingUser.id}`;
        const payload = { ...values };

        if (editingUser.user_type_id !== USER_ROLES.AGENT) {
          delete payload.is_affiliate;
        }
        await axios.put(url, payload);
        message.success('User updated successfully');

      } else {
        // Use the creation endpoint for new users
        await axios.post(`/users/`, {
          ...values,
        });
        message.success('User created successfully');
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
      console.error('Failed to save user:', err);
      message.error(err.response?.data?.detail || 'Failed to save user');
    }
  };

  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
        title: 'User Type',
        dataIndex: 'user_type',
        key: 'user_type',
    },
    {
        title: 'Affiliate',
        dataIndex: 'is_affiliate',
        key: 'is_affiliate',
        render: (is_affiliate, record) => {
            if (record.user_type_id !== USER_ROLES.AGENT) {
                return 'N/A';
            }
            return is_affiliate
                ? <CheckCircleFilled style={{ color: 'green', fontSize: '18px' }} />
                : <CloseCircleFilled style={{ color: 'red', fontSize: '18px' }} />;
        },
    },
    {
        title: 'Balance',
        dataIndex: 'balance',
        key: 'balance',
        render: (balance, record) => {
            if (record.user_type_id !== USER_ROLES.AGENT || !record.is_affiliate) {
                return 'N/A';
            }
            return record.is_affiliate ? `$${(balance ?? 0)}` : 'N/A';
        },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => showEditModal(record)}>Edit</Button>
          <Button type="link" danger onClick={() => showDeleteModal(record)}>Delete</Button>
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
        okText={isEdit ? 'Save' : 'Create'}
        cancelText="Cancel"
        onCancel={handleCancel}
        onOk={handleOk}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" name="user_form" initialValues={{ is_affiliate: false }}>
            {!isEdit && <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Please input the email!' }]}>
                <Input />
            </Form.Item>}
            <Form.Item name="username" label="Fullname" rules={[{ required: true, message: 'Please input the username!' }]}>
                <Input />
            </Form.Item>
            <Form.Item name="phone" label="Phone">
                <Input />
            </Form.Item>
            {!isEdit && <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please input the password!' }]}>
                <Input.Password />
            </Form.Item>}
            <Form.Item name="user_type_id" label="User Type" rules={[{ required: true, message: 'Please select a user type!' }]}>
                <Select placeholder="Select a user type">
                    {userTypes.map(type => (
                        <Option key={type.value} value={type.value}>{type.label}</Option>
                    ))}
                </Select>
            </Form.Item>
            {editingUser?.user_type_id === USER_ROLES.AGENT && (
                <Form.Item name="is_affiliate" label="Is Affiliate?" valuePropName="checked">
                    <Switch />
                </Form.Item>
            )}
        </Form>
      </Modal>

      <Modal
        title="Confirm Deletion"
        open={isDeleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText="Confirm Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        {userToDelete && (
          <div>
            <p>Are you sure you want to delete the user <strong>{userToDelete.username}</strong>?</p>
            {userToDelete.user_type_id === USER_ROLES.AGENT && userToDelete.balance > 0 && (
              <p style={{ color: 'red', fontWeight: 'bold' }}>
                WARNING: This agent has a remaining balance of ${userToDelete.balance.toFixed(2)}. Deleting this user is irreversible.
              </p>
            )}
            <p>This action cannot be undone.</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
