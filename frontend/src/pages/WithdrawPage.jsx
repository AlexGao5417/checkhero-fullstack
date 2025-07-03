import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Table, Button, Modal, Form, InputNumber, Pagination, Spin, notification, Row, Col, Card, Tag, Statistic, Upload, Space, Input } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from '@utils/axios';
import { customUploadRequest } from '@utils/s3Upload';
import { format } from 'date-fns';
import { USER_ROLES } from '@utils/constants';

const PAGE_SIZE = 10;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const statusColors = {
  pending: 'processing',
  approved: 'success',
  denied: 'error',
};

const WithdrawPage = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ balance: 0, is_affiliate: false, approved_withdraw: 0, pending_withdrawal: 0 });
  const [form] = Form.useForm();

  // Admin Review Modal State
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [agentNameFilter, setAgentNameFilter] = useState('');

  const user = useSelector(state => state.auth.user);
  const isAdmin = user?.user_type_id === USER_ROLES.ADMIN;

  const maxWithdrawalAmount = status.balance - status.pending_withdrawal;

  const fetchWithdrawals = async (page = 1) => {
    try {
      setLoading(true);
      let url = isAdmin ? `${API_BASE}/agent/withdrawals?page=${page}&page_size=${PAGE_SIZE}` : `${API_BASE}/agent/withdrawals?page=${page}&page_size=${PAGE_SIZE}`;
      if (isAdmin && agentNameFilter) {
        url += `&agent_name=${encodeURIComponent(agentNameFilter)}`;
      }
      const response = await axios.get(url);
      const data = isAdmin ? response.data.results : response.data.results || response.data;
      setWithdrawals(data.map(w => ({ ...w, key: w.id })));
      setTotal(isAdmin ? response.data.total : data.length);
    } catch (err) {
      notification.error({
        message: 'Failed to fetch withdrawals',
        description: err.response?.data?.detail || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentStatus = async () => {
    if (isAdmin) return; // Admins don't have this status
    try {
      const res = await axios.get(`${API_BASE}/agent/status`);
      setStatus(res.data);
    } catch (err) {
      notification.error({
        message: 'Failed to fetch agent status',
        description: err.response?.data?.detail || err.message,
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchAgentStatus();
      fetchWithdrawals(currentPage);
    }
  }, [user, currentPage, agentNameFilter]);

  const showWithdrawModal = () => {
    fetchAgentStatus();
    setIsModalVisible(true);
  };

  const handleWithdraw = async (values) => {
    setSubmitting(true);
    try {
      await axios.post(
        `${API_BASE}/agent/withdraw`, 
        { amount: values.amount, invoice_pdf: values.invoice_pdf }, 
        { headers: { 'Content-Type': 'application/json' } }
      );
      notification.success({ message: 'Withdrawal request submitted' });
      setIsModalVisible(false);
      form.resetFields();
      fetchWithdrawals(currentPage);
      fetchAgentStatus();
    } catch (err) {
      notification.error({ message: 'Withdrawal failed', description: err.response?.data?.detail || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewClick = (record) => {
    setSelectedRecord(record);
    setIsReviewModalVisible(true);
  };

  const handleReviewCancel = () => {
    setIsReviewModalVisible(false);
    setSelectedRecord(null);
  };
  
  const handleApproveDecline = async (isApproved) => {
    setSubmitting(true);
    try {
        await axios.put(`${API_BASE}/users/withdrawals/${selectedRecord.id}/approve`, { is_approved: false });
        notification.success({ message: 'Withdrawal declined' });
        setIsReviewModalVisible(false);
        fetchWithdrawals(currentPage);
    } catch(err) {
        notification.error({ message: 'Action failed', description: err.response?.data?.detail || err.message });
    } finally {
        setSubmitting(false);
    }
  };

  const handleConfirmApproval = async () => {
    setSubmitting(true);
    try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_BASE}/users/withdrawals/${selectedRecord.id}/approve`, { is_approved: true }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        notification.success({ message: 'Withdrawal approved' });
        setIsReviewModalVisible(false);
        fetchWithdrawals(currentPage);
    } catch(err) {
        notification.error({ message: 'Approval failed', description: err.response?.data?.detail || err.message });
    } finally {
        setSubmitting(false);
    }
  }

  const pdfUploadProps = {
    name: 'file',
    accept: '.pdf',
    multiple: false,
    maxCount: 1,
    beforeUpload: () => {
        setIsUploading(true);
        return true;
    },
    customRequest: async (options) => {
      setIsUploading(true);
      await customUploadRequest(options, (url) => setInvoiceUrl(url));
      setIsUploading(false);
    },
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    isAdmin && { title: 'Agent', dataIndex: 'agent_name', key: 'agent_name' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (amount) => `$${Number(amount).toFixed(0)}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag> },
    { title: 'Date Submitted', dataIndex: 'submit_datetime', key: 'submit_datetime', render: (date) => format(new Date(date), 'PPpp') },
    { title: 'Date Reviewed', dataIndex: 'review_datetime', key: 'review_datetime', render: (date) => date ? format(new Date(date), 'PPpp') : 'N/A' },
    { title: 'Invoice', key: 'invoice', render: (_, record) => record.invoice_pdf ? <Button type="primary" ghost onClick={() => window.open(record.invoice_pdf, '_blank')}>Download</Button> : 'N/A' },
    isAdmin && { title: 'Review', key: 'review', render: (_, record) => record.status === 'pending' ? <Button onClick={() => handleReviewClick(record)}>Review</Button> : 'N/A' }
  ].filter(Boolean);

  const TitleBar = () => (
    <>
    <Row align="middle" justify="space-between" style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontWeight: 700, fontSize: 28 }}>{isAdmin ? 'All Withdrawals' : 'My Withdrawal History'}</h2>
      </Row>
      {!isAdmin && (
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
            <Statistic title="Available Withdrawal Balance" value={maxWithdrawalAmount} precision={0} prefix="$" /> 
          </Col>
          <Col>
            <Statistic title="Pending Withdrawal" value={status.pending_withdrawal} precision={0} prefix="$" /> 
          </Col>
          <Col>
            <Button type="primary" onClick={showWithdrawModal} size="large">Request Withdrawal</Button>
        </Col>
        </Row>
      )}
    </>
  );

  if (loading && !withdrawals.length) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spin size="large" /></div>;
  }
  
  if (!isAdmin && !status.is_affiliate) {
    return <Card><p>You are not registered as an affiliate. Please contact support to get started.</p></Card>;
  }
  
  const paginatedData = withdrawals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div style={{ padding: 24 }}>
      <TitleBar />
      {isAdmin && (
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
      )}
      <Table columns={columns} dataSource={paginatedData} pagination={false} rowKey="key" loading={loading} bordered />
      <Pagination current={currentPage} pageSize={PAGE_SIZE} total={total} onChange={setCurrentPage} style={{ marginTop: 16, textAlign: 'right' }} />
      
      {/* Agent withdrawal modal */}
      <Modal open={isModalVisible} title="Request a Withdrawal" onCancel={() => setIsModalVisible(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleWithdraw} initialValues={{ amount: maxWithdrawalAmount }}>
            <p>Your current available balance is <strong>${maxWithdrawalAmount.toFixed(0)}</strong>.</p>
            <Form.Item name="amount" label="Amount to Withdraw" rules={[{ required: true, message: 'Please input the amount!' }, { type: 'number', min: 0.01 }, { type: 'number', max: maxWithdrawalAmount }]}>
                <InputNumber style={{ width: '100%' }} precision={0} min={1} max={maxWithdrawalAmount} />
            </Form.Item>
            <Form.Item name="invoice_pdf" label="Upload Invoice PDF">
                <Upload {...pdfUploadProps}>
                    <Button icon={<UploadOutlined />}>Click to Upload PDF</Button>
                </Upload>
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting}>Submit Request</Button>
            </Form.Item>
        </Form>
      </Modal>

      {/* Admin review modal */}
      {isReviewModalVisible && selectedRecord && (
        <Modal open={isReviewModalVisible} title="Review Withdrawal" onCancel={() => setIsReviewModalVisible(false)} footer={null}>
          <Space direction="vertical" style={{width: '100%'}}>
            <p>Agent: <strong>{selectedRecord?.agent_name}</strong></p>
            <p>Amount: <strong>${Number(selectedRecord?.amount).toFixed(2)}</strong></p>
            <p>Decide the outcome for this withdrawal request.</p>
            <Space style={{marginTop: 16, justifyContent: 'flex-end', width: '100%'}}>
                <Button onClick={() => handleApproveDecline(false)} loading={submitting} danger>Decline</Button>
                <Button type="primary" onClick={() => handleApproveDecline(true)} loading={submitting}>Approve</Button>
            </Space>
            <p>Invoice PDF Preview:</p>
            {selectedRecord.invoice_pdf ? (
              <iframe src={selectedRecord.invoice_pdf} title="Invoice PDF Preview" width="100%" height="400px" style={{ border: '1px solid #ccc', borderRadius: 4 }} />
            ) : (
              <p>No invoice PDF uploaded.</p>
            )}
            <Button type="primary" onClick={handleConfirmApproval} loading={submitting || isUploading}>
              Confirm Approval
            </Button>
          </Space>
        </Modal>
      )}
    </div>
  );
};

export default WithdrawPage; 