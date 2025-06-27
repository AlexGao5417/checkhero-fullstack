import React, { useState, useEffect } from 'react';
import { Table, Input, Row, Col, Card, Typography, Spin, notification } from 'antd';
import axios from '@utils/axios';
import { API_ENDPOINTS } from '@utils/constants';

const { Title } = Typography;
const PAGE_SIZE = 10;

const AgentRewardsPage = () => {
  const [agentRewards, setAgentRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentNameFilter, setAgentNameFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchAgentRewards = async (page = 1, agentName = '') => {
    setLoading(true);
    try {
      let url = `/agent/rewards?page=${page}&page_size=${PAGE_SIZE}`;
      if (agentName) url += `&agent_name=${encodeURIComponent(agentName)}`;
      const res = await axios.get(url);
      setAgentRewards(res.data.results);
      setTotal(res.data.total);
    } catch (err) {
      notification.error({ message: 'Failed to fetch agent rewards', description: err.response?.data?.detail || err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentRewards(currentPage, agentNameFilter);
  }, [currentPage, agentNameFilter]);

  const columns = [
    { title: 'Agent ID', dataIndex: 'agent_id', key: 'agent_id' },
    { title: 'Agent Name', dataIndex: 'agent_name', key: 'agent_name' },
    { title: 'Balance', dataIndex: 'balance', key: 'balance', render: (balance) => `$${Number(balance).toFixed(2)}` },
  ];

  return (
    <div style={{ padding: 24 }}>
        <Title level={2} style={{ marginBottom: 24 }}>Agent Rewards</Title>
        <Row gutter={16} style={{ marginBottom: 16 }} align="middle">
          <Col xs={24} sm={8} md={6} lg={5} xl={4} style={{ marginBottom: 8 }}>
            <Input
              placeholder="Search Agent Name"
              value={agentNameFilter}
              onChange={e => { setAgentNameFilter(e.target.value); setCurrentPage(1); }}
              allowClear
            />
          </Col>
        </Row>
        {loading ? (
          <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />
        ) : (
          <Table
            columns={columns}
            dataSource={agentRewards}
            rowKey="agent_id"
            bordered
            pagination={{
              current: currentPage,
              pageSize: PAGE_SIZE,
              total,
              onChange: setCurrentPage,
              showTotal: (total) => `Total ${total} agents`,
            }}
            style={{ borderRadius: 12, overflow: 'hidden' }}
          />
        )}
    </div>
  );
};

export default AgentRewardsPage; 