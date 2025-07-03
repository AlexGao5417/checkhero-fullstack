import React, { useEffect, useState } from 'react';
import { Table, Input, Select, Row, Col, Typography, Space, Pagination, Spin, notification, Button } from 'antd';
import axios from '@utils/axios';
import { useSelector } from 'react-redux';

const { Title } = Typography;
const { Option } = Select;
const PAGE_SIZE = 20;

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [users, setUsers] = useState([]);
  const [actionOptions, setActionOptions] = useState([]);
  const [targetTypeOptions, setTargetTypeOptions] = useState([]);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    fetchLogs(currentPage, userIdFilter, actionFilter, targetTypeFilter);
    // eslint-disable-next-line
  }, [currentPage]);

  useEffect(() => {
    // Fetch all users for filter dropdown
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/users/', { params: { limit: 1000 } });
        setUsers(res.data);
      } catch (err) {
        // ignore
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    // Fetch unique action and target_type options for dropdowns
    const fetchOptions = async () => {
      try {
        const res = await axios.get('/audit/', { params: { limit: 1000 } });
        const actions = Array.from(new Set(res.data.map(l => l.action))).filter(Boolean);
        const targetTypes = Array.from(new Set(res.data.map(l => l.target_type))).filter(Boolean);
        setActionOptions(actions);
        setTargetTypeOptions(targetTypes);
      } catch (err) {
        // ignore
      }
    };
    fetchOptions();
  }, []);

  const fetchLogs = async (page, userId, action, targetType) => {
    setLoading(true);
    try {
      const params = {
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      };
      if (userId) params.user_id = userId;
      if (action) params.action = action;
      if (targetType) params.target_type = targetType;
      const res = await axios.get('/audit/', { params });
      setLogs(res.data);
      setTotal(res.data.length < PAGE_SIZE && page === 1 ? res.data.length : page * PAGE_SIZE + (res.data.length === PAGE_SIZE ? 1 : 0));
    } catch (err) {
      notification.error({ message: 'Failed to fetch audit logs', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogs(1, userIdFilter, actionFilter, targetTypeFilter);
  };

  const handleReset = () => {
    setUserIdFilter('');
    setActionFilter('');
    setTargetTypeFilter('');
    setCurrentPage(1);
    fetchLogs(1, '', '', '');
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'User ID', dataIndex: 'user_id', key: 'user_id' },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Action', dataIndex: 'action', key: 'action' },
    { title: 'Target Type', dataIndex: 'target_type', key: 'target_type' },
    { title: 'Target ID', dataIndex: 'target_id', key: 'target_id' },
    { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp', render: (ts) => ts ? new Date(ts).toLocaleString() : '' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>Audit Logs</Title>
      <Row gutter={16} style={{ marginBottom: 16 }} align="middle">
        <Col xs={24} sm={8} md={6} lg={5} xl={4} style={{ marginBottom: 8 }}>
          <Select
            showSearch
            placeholder="Filter by User"
            value={userIdFilter || undefined}
            onChange={setUserIdFilter}
            allowClear
            style={{ width: '100%' }}
            optionFilterProp="children"
          >
            {users.map(u => (
              <Option key={u.id} value={u.id}>{u.username}</Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={8} md={6} lg={5} xl={4} style={{ marginBottom: 8 }}>
          <Select
            showSearch
            placeholder="Filter by Action"
            value={actionFilter || undefined}
            onChange={setActionFilter}
            allowClear
            style={{ width: '100%' }}
            optionFilterProp="children"
          >
            {actionOptions.map(a => (
              <Option key={a} value={a}>{a}</Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={8} md={6} lg={5} xl={4} style={{ marginBottom: 8 }}>
          <Select
            showSearch
            placeholder="Filter by Target Type"
            value={targetTypeFilter || undefined}
            onChange={setTargetTypeFilter}
            allowClear
            style={{ width: '100%' }}
            optionFilterProp="children"
          >
            {targetTypeOptions.map(t => (
              <Option key={t} value={t}>{t}</Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={24} md={6} lg={5} xl={4} style={{ marginBottom: 8 }}>
          <Space>
            <Button type="primary" onClick={handleSearch}>Search</Button>
            <Button onClick={handleReset}>Reset</Button>
          </Space>
        </Col>
      </Row>
      {loading ? (
        <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />
      ) : (
        <>
          <Table
            columns={columns}
            dataSource={logs}
            pagination={false}
            rowKey="id"
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
        </>
      )}
    </div>
  );
};

export default AuditLogsPage; 