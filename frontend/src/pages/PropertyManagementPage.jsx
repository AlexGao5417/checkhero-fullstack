import React, { useEffect, useState, useRef } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Spin, Alert } from 'antd';
import axios from '@utils/axios';
import { useSelector } from 'react-redux';
import { USER_ROLES } from '@utils/constants';
import AddressAutocomplete from '@components/Form/AddressAutocomplete';
import { useImmer } from 'use-immer';
import { useNavigate } from 'react-router-dom';

const PAGE_SIZE = 10;

const AddAddressModal = ({ visible, onOk, onCancel, form, addressValue, handleAddressSelectAndChange }) => (
  <Modal
    title="Add Address"
    visible={visible}
    onOk={onOk}
    onCancel={onCancel}
    okText="Add"
  >
    <Form form={form} layout="vertical">
      <Form.Item name="address" label="Address" rules={[{ required: true, message: 'Please input address' }]}> 
        <AddressAutocomplete value={addressValue} onChange={handleAddressSelectAndChange} onSelect={handleAddressSelectAndChange} />
      </Form.Item>
      <Form.Item name="address_id" style={{ display: 'none' }}><Input /></Form.Item>
    </Form>
  </Modal>
);

const PropertyManagementPage = () => {
  const { user } = useSelector(state => state.auth);
  const isAgent = user?.user_type_id === USER_ROLES.AGENT;
  const [agents, updateAgents] = useImmer([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [form] = Form.useForm();
  const [addressData, updateAddressData] = useImmer({});
  const [addressValue, setAddressValue] = useState(null);
  const [addressId, setAddressId] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);
  const [deletingAddressId, setDeletingAddressId] = useState(null);
  const alertTimerRef = useRef();
  const navigate = useNavigate();

  const fetchAgents = async (page = 1) => {
    try {
      const skip = (page - 1) * PAGE_SIZE;
      const res = await axios.get('/users/', { params: { user_type_id: USER_ROLES.AGENT, skip, limit: PAGE_SIZE } });
      updateAgents(draft => {
        draft.length = 0;
        res.data.forEach(agent => draft.push(agent));
      });
      setTotal(res.data.length < PAGE_SIZE && page === 1 ? res.data.length : page * PAGE_SIZE + (res.data.length === PAGE_SIZE ? 1 : 0));
    } catch (err) {
      message.error('Failed to fetch agents');
    }
  };

  useEffect(() => {
    if (isAgent) {
      fetchAddressesForAgent(user.id);
      updateAgents(draft => {
        draft.length = 0;
        draft.push(user);
      });
      setTotal(1);
    } else {
      fetchAgents(currentPage);
    }
    // eslint-disable-next-line
  }, [currentPage, isAgent]);

  useEffect(() => {
    if (alertInfo) {
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      alertTimerRef.current = setTimeout(() => {
        setAlertInfo(null);
      }, 5000);
    }
    return () => {
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    };
  }, [alertInfo]);

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
  };

  const handleAddAddress = (agentId) => {
    setSelectedAgentId(agentId);
    setAddModalVisible(true);
    form.resetFields();
    setAddressValue(null);
    setAddressId(null);
    setAlertInfo(null);
  };

  const handleAddressSelectAndChange = ({ value, id }) => {
    setAddressValue(value);
    setAddressId(id);
    form.setFieldsValue({ address: value, address_id: id });
  };

  const handleRemoveAddress = async (agentId, addressAgentId) => {
    setAlertInfo({ type: 'info', message: 'Deleting address...' });
    setDeletingAddressId(addressAgentId);
    try {
      await axios.delete(`/agent/address/${addressAgentId}`);
      setAlertInfo({ type: 'success', message: 'Address deleted successfully' });
      fetchAddressesForAgent(agentId);
    } catch (err) {
      setAlertInfo({ type: 'error', message: err?.response?.data?.detail || 'Failed to delete address' });
    } finally {
      setDeletingAddressId(null);
    }
  };

  const handleAddModalOk = async () => {
    try {
      const { address, address_id } = await form.validateFields();
      const payload = { agent_id: selectedAgentId, address, address_id };
      setAddModalVisible(false);
      await axios.post('/agent/address', payload);
      fetchAddressesForAgent(selectedAgentId);
      message.success('Address added');
      setAlertInfo(null);
    } catch (err) {
      if (err?.response?.status === 409 && err?.response?.data) {
        const detail = err.response.data.detail;
        if (detail && detail.agent_id && detail.agent_username) {
          setAlertInfo({
            message: detail.message || 'This address is already assigned to another agent, please remove the existing association first',
            agent_username: detail.agent_username,
            agent_id: detail.agent_id,
          });
          return;
        }
      }
      message.error(err?.response?.data?.detail?.message || err?.response?.data?.detail || 'Failed to add address');
    }
  };

  const agentColumns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
  ];

  const fetchAddressesForAgent = async (agentId) => {
    updateAddressData(draft => {
      draft[agentId] = { loading: true, data: [] };
    });
    try {
      const res = await axios.get(`/agent/${agentId}/addresses`);
      updateAddressData(draft => {
        draft[agentId] = { loading: false, data: res.data };
      });
    } catch (err) {
      updateAddressData(draft => {
        draft[agentId] = { loading: false, data: [] };
      });
      message.error('Failed to fetch addresses');
    }
  };

  const handleAddressClick = (address) => {
    navigate('/reports', { state: { addressFilter: address } });
  };

  const expandedRowRender = (agent) => {
    const addressColumns = [
      {
        title: 'Address',
        dataIndex: 'address',
        key: 'address',
        render: (text) => (
          <a style={{ cursor: 'pointer' }} onClick={() => handleAddressClick(text)}>{text}</a>
        ),
      },
      { title: 'Last Report Type', dataIndex: 'last_inspect_type_id', key: 'last_inspect_type_id' },
      { title: 'Last Report Time', dataIndex: 'last_inspect_time', key: 'last_inspect_time' },
      {
        title: 'Action',
        key: 'action',
        render: (_, record) => (
          <Button danger onClick={() => handleRemoveAddress(agent.id, record.id)} disabled={deletingAddressId === record.address_id}>
            {deletingAddressId === record.address_id ? 'Deleting...' : 'Remove'}
          </Button>
        ),
      },
    ];
    const addresses = addressData[agent.id]?.data || [];
    const loading = addressData[agent.id]?.loading;
    return (
      <div>
        <Space style={{ marginBottom: 8 }}>
          <Button type="primary" onClick={() => handleAddAddress(agent.id)}>
            Add Address
          </Button>
        </Space>
        {loading ? (
          <Spin style={{ display: 'block', margin: '40px auto' }} />
        ) : (
          <Table
            columns={addressColumns}
            dataSource={addresses}
            rowKey="address_id"
            pagination={false}
            size="small"
          />
        )}
      </div>
    );
  };

  // Only fetch addresses when a row is expanded for the first time
  const handleExpand = (expanded, record) => {
    if (expanded && !addressData[record.id]) {
      fetchAddressesForAgent(record.id);
    }
  };

  if (isAgent) {
    const addressColumns = [
      {
        title: 'Address',
        dataIndex: 'address',
        key: 'address',
        render: (text) => (
          <a style={{ cursor: 'pointer' }} onClick={() => handleAddressClick(text)}>{text}</a>
        ),
      },
      { title: 'Last Report Type', dataIndex: 'last_inspect_type_id', key: 'last_inspect_type_id' },
      { title: 'Last Report Time', dataIndex: 'last_inspect_time', key: 'last_inspect_time' },
      {
        title: 'Action',
        key: 'action',
        render: (id, record) => (
          <Button danger onClick={() => handleRemoveAddress(user.id, record.id)} disabled={deletingAddressId === record.address_id}>
            {deletingAddressId === record.address_id ? 'Deleting...' : 'Remove'}
          </Button>
        ),
      },
    ];
    const addresses = addressData[user.id]?.data || [];
    const loading = addressData[user.id]?.loading;
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 24 }}>My Addresses</h2>
        {alertInfo && (
          <Alert
            type={alertInfo.type || 'warning'}
            message={
              alertInfo.agent_username ? (
                <div>
                  <p>{alertInfo.message}</p>
                  <p><b>Agent:</b> {alertInfo.agent_username} (ID: {alertInfo.agent_id})</p>
                </div>
              ) : (
                alertInfo.message
              )
            }
            closable
            onClose={() => setAlertInfo(null)}
            style={{ marginBottom: 16 }}
          />
        )}
        <Space style={{ marginBottom: 8 }}>
          <Button type="primary" onClick={() => handleAddAddress(user.id)}>
            Add Address
          </Button>
        </Space>
        {loading ? (
          <Spin style={{ display: 'block', margin: '40px auto' }} />
        ) : (
          <Table
            columns={addressColumns}
            dataSource={addresses}
            rowKey="address_id"
            pagination={false}
            size="small"
          />
        )}
        <AddAddressModal
          visible={addModalVisible}
          onOk={handleAddModalOk}
          onCancel={() => setAddModalVisible(false)}
          form={form}
          addressValue={addressValue}
          handleAddressSelectAndChange={handleAddressSelectAndChange}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 24 }}>Property Management</h2>
      {alertInfo && (
        <Alert
          type={alertInfo.type || 'warning'}
          message={
            alertInfo.agent_username ? (
              <div>
                <p>{alertInfo.message}</p>
                <p><b>Agent:</b> {alertInfo.agent_username} (ID: {alertInfo.agent_id})</p>
              </div>
            ) : (
              alertInfo.message
            )
          }
          closable
          onClose={() => setAlertInfo(null)}
          style={{ marginBottom: 16 }}
        />
      )}
      <Table
        columns={agentColumns}
        dataSource={agents}
        rowKey="id"
        expandable={{ expandedRowRender, onExpand: handleExpand }}
        bordered
        pagination={{
          current: currentPage,
          pageSize: PAGE_SIZE,
          total: total,
          showSizeChanger: false,
        }}
        onChange={handleTableChange}
      />
      <AddAddressModal
        visible={addModalVisible}
        onOk={handleAddModalOk}
        onCancel={() => setAddModalVisible(false)}
        form={form}
        addressValue={addressValue}
        handleAddressSelectAndChange={handleAddressSelectAndChange}
      />
    </div>
  );
};

export default PropertyManagementPage; 