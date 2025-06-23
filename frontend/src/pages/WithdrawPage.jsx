import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Table, Button, Modal, Form, InputNumber, Pagination, Spin, notification, Row, Col, Card, Tag, Statistic, Upload, Space } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from '@utils/axios';
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
  const [status, setStatus] = useState({ balance: 0, is_affiliate: false });
  const [form] = Form.useForm();

  // Admin Review Modal State
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [reviewStep, setReviewStep] = useState(1);
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const user = useSelector(state => state.auth.user);
  const isAdmin = user?.user_type_id === USER_ROLES.ADMIN;

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = isAdmin ? `${API_BASE}/users/withdrawals` : `${API_BASE}/agent/withdrawals`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data.map(w => ({ ...w, key: w.id }));
      setWithdrawals(data);
      setTotal(data.length);
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
  }, [user, currentPage]);

  const showWithdrawModal = () => {
    fetchAgentStatus();
    setIsModalVisible(true);
  };

  const handleWithdraw = async (values) => {
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/agent/withdraw`, values.amount, { headers: { 'Content-Type': 'application/json' } });
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
    setReviewStep(1);
    setInvoiceUrl('');
  };

  const handleReviewCancel = () => {
    setIsReviewModalVisible(false);
    setSelectedRecord(null);
  };
  
  const handleApproveDecline = async (isApproved) => {
    if (isApproved) {
        setReviewStep(2);
    } else {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE}/users/withdrawals/${selectedRecord.id}/approve`, { is_approved: false }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notification.success({ message: 'Withdrawal declined' });
            setIsReviewModalVisible(false);
            fetchWithdrawals(currentPage);
        } catch(err) {
            notification.error({ message: 'Action failed', description: err.response?.data?.detail || err.message });
        } finally {
            setSubmitting(false);
        }
    }
  };

  const handleConfirmApproval = async () => {
    setSubmitting(true);
    try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_BASE}/users/withdrawals/${selectedRecord.id}/approve`, { is_approved: true, invoice_pdf: invoiceUrl }, {
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
    customRequest: async ({ file, onSuccess, onError }) => {
        try {
            const presignRes = await axios.get(`${API_BASE}/reports/presigned-url/?content_type=${encodeURIComponent(file.type)}`);
            const { upload_url, public_url } = presignRes.data;
            await axios.put(upload_url, file, { headers: { 'Content-Type': file.type } });
            setInvoiceUrl(public_url);
            onSuccess();
            notification.success({ message: 'Invoice uploaded successfully!' });
        } catch (err) {
            notification.error({ message: 'Upload failed', description: err.message });
            onError(err);
        } finally {
            setIsUploading(false);
        }
    },
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    isAdmin && { title: 'Agent', dataIndex: 'agent_username', key: 'agent_username' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (amount) => `$${Number(amount).toFixed(2)}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag> },
    { title: 'Date Submitted', dataIndex: 'submit_datetime', key: 'submit_datetime', render: (date) => format(new Date(date), 'PPpp') },
    { title: 'Date Reviewed', dataIndex: 'review_datetime', key: 'review_datetime', render: (date) => date ? format(new Date(date), 'PPpp') : 'N/A' },
    { title: 'Invoice', key: 'invoice', render: (_, record) => record.invoice_pdf ? <Button type="primary" ghost onClick={() => window.open(record.invoice_pdf, '_blank')}>Download</Button> : 'N/A' },
    isAdmin && { title: 'Review', key: 'review', render: (_, record) => record.status === 'pending' ? <Button onClick={() => handleReviewClick(record)}>Review</Button> : null }
  ].filter(Boolean);

  const TitleBar = () => (
    <Row align="middle" justify="space-between" style={{ marginBottom: 24 }}>
      <Col>
        <h2 style={{ margin: 0, fontWeight: 700, fontSize: 28 }}>{isAdmin ? 'All Withdrawals' : 'My Withdrawal History'}</h2>
      </Col>
      {!isAdmin && (
        <Col>
          <Space>
            <Statistic title="Available Balance" value={status.balance} precision={2} prefix="$" />
            <Button type="primary" onClick={showWithdrawModal} size="large">Request Withdrawal</Button>
          </Space>
        </Col>
      )}
    </Row>
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
      <Table columns={columns} dataSource={paginatedData} pagination={false} rowKey="key" loading={loading} bordered />
      <Pagination current={currentPage} pageSize={PAGE_SIZE} total={total} onChange={setCurrentPage} style={{ marginTop: 16, textAlign: 'right' }} />
      
      {/* Agent withdrawal modal */}
      <Modal open={isModalVisible} title="Request a Withdrawal" onCancel={() => setIsModalVisible(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleWithdraw} initialValues={{ amount: status.balance }}>
            <p>Your current available balance is <strong>${status.balance.toFixed(2)}</strong>.</p>
            <Form.Item name="amount" label="Amount to Withdraw" rules={[{ required: true, message: 'Please input the amount!' }, { type: 'number', min: 0.01 }, { type: 'number', max: status.balance }]}>
                <InputNumber style={{ width: '100%' }} precision={2} min={0.01} max={status.balance} />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting}>Submit Request</Button>
            </Form.Item>
        </Form>
      </Modal>

      {/* Admin review modal */}
      <Modal 
        open={isReviewModalVisible} 
        title={`Review Withdrawal ID: ${selectedRecord?.id}`} 
        onCancel={handleReviewCancel}
        footer={null}
        destroyOnHidden
      >
        {reviewStep === 1 && (
            <Space direction="vertical" style={{width: '100%'}}>
                <p>Agent: <strong>{selectedRecord?.agent_username}</strong></p>
                <p>Amount: <strong>${Number(selectedRecord?.amount).toFixed(2)}</strong></p>
                <p>Decide the outcome for this withdrawal request.</p>
                <Space style={{marginTop: 16, justifyContent: 'flex-end', width: '100%'}}>
                    <Button onClick={() => handleApproveDecline(false)} loading={submitting} danger>Decline</Button>
                    <Button type="primary" onClick={() => handleApproveDecline(true)} loading={submitting}>Approve</Button>
                </Space>
            </Space>
        )}
        {reviewStep === 2 && (
            <Space direction="vertical" style={{width: '100%'}}>
                <p>Upload the invoice PDF for this withdrawal.</p>
                <Upload {...pdfUploadProps}>
                    <Button icon={<UploadOutlined />}>Click to Upload PDF</Button>
                </Upload>
                <Button type="primary" onClick={handleConfirmApproval} loading={submitting || isUploading} disabled={!invoiceUrl}>
                    Confirm Approval
                </Button>
            </Space>
        )}
      </Modal>
    </div>
  );
};

export default WithdrawPage; 