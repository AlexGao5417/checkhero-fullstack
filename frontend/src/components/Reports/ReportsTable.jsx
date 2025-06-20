import React, { useState, useEffect } from 'react';
import { Table, Button, Pagination, Tag, Space, Row, Col, Input, Select } from 'antd';

// Map user_type_id to type string for demo
const userTypeMap = { 1: 'admin', 2: 'agent', 3: 'electrician' };

// Dummy data for demonstration
const dummyReports = [
  {
    id: 1,
    address: '123 Main St',
    publisher: 'Alice',
    publisher_id: 101,
    created_date: '2024-06-01',
    review_date: '2024-06-10',
    status: 'draft',
    comment: 'Needs more info',
    reviewer: 'Bob',
    // Full form fields for prefill
    electricalSafetyCheck: true,
    smokeSafetyCheck: true,
    installationExtent: {
      'Main Switchboard': true,
      'Other living areas': false,
      'Main earthing system': true,
      'Laundry': true,
      'Kitchen': true,
      'Garage': false,
      'Bathroom (main)': true,
      'Solar/battery system': false,
      'Other bathrooms/ensuites': false,
      'Installation - Electric water heater': true,
      'Bedroom (main)': true,
      'Installation - Dishwasher': false,
      'Other bedrooms': true,
      'Installation - Electric room/space heaters': false,
      'Living room': true,
      'Installation - Swimming pool equipment': false,
    },
    visualInspection: {
      'Visual - Consumers mains': true,
      'Visual - Space heaters': false,
      'Visual - Switchboards': true,
      'Visual - Cooking equipment': true,
      'Visual - Exposed earth electrode': false,
      'Visual - Dishwasher': false,
      'Visual - Metallic water pipe bond': true,
      'Visual - Exhaust fans': true,
      'Visual - RCDs (Safety switches)': true,
      'Visual - Celling fans': false,
      'Visual - Circuit protection (circuit breakers/fuses)': true,
      'Visual - Washing machinedryer/': false,
      'Visual - Socket-outlets': true,
      'Visual - Installation wiring': true,
      'Visual - Light fittings': true,
      'Visual - Solar and other renewable systems': false,
      'Visual - Electric water heater': true,
      'Visual - Swimming pool equipment': false,
      'Visual - Air conditioners': true,
      'Visual - Vehicle chargers': false,
    },
    polarityTesting: {
      'Polarity - Consumers mains': true,
      'Polarity - Electric water heater': true,
      'Polarity - Circuit protection (circuit breakers/fuses)': true,
      'Polarity - Air conditioners': false,
      'Polarity - RCDs (Safety switches)': true,
      'Polarity - Cooking equipment': true,
      'Polarity - Dishwasher': false,
      'Polarity - Circuit protection (circuit breakers/fuses) (D2)': false,
      'Polarity - Solar and other renewable systems': false,
      'Polarity - Socket-outlets': true,
      'Polarity - Swimming pool equipment': false,
      'Polarity - Vehicle chargers': false,
    },
    earthContinuityTesting: {
      'Earth - Mains earth conductor': true,
      'Earth - Electric water heater': false,
      'Earth - Metallic water pipe bond': true,
      'Earth - Air conditioners': false,
      'Earth - Socket-outlets': true,
      'Earth - Cooking equipment': true,
      'Earth - Light fittings': false,
      'Earth - Dishwasher': false,
      'Earth - Exhaust fans': true,
      'Earth - Solar and other renewable systems': false,
      'Earth - Celling fans': false,
      'Earth - Swimming pool equipment': false,
      'Earth - Vehicle chargers': false,
    },
    rcdTestingPassed: true,
    smokeAlarmsWorking: true,
    nextSmokeAlarmCheckDate: '2024-07-01',
    smokeAlarmDetails: [
      { voltage: '240V', status: 'Working', location: 'Hallway', level: '1', expiration: '2026-01-01' },
      { voltage: '240V', status: 'Working', location: 'Bedroom', level: '2', expiration: '2026-01-01' },
    ],
    observation: 'Minor issues found in kitchen wiring.',
    recommendation: 'Re-inspect in 6 months.',
    images: [],
    electricalSafetyCheckCompletedBy: 'Alice',
    licenceNumber: 'A123456',
    inspectionDate: '2024-06-01',
    nextInspectionDueDate: '2025-06-01',
    signatureDate: '2024-06-01',
  },
  {
    id: 2,
    address: '456 Oak Ave',
    publisher: 'Charlie',
    publisher_id: 102,
    created_date: '2024-06-02',
    review_date: '2024-06-11',
    status: 'approved',
    comment: 'All good',
    reviewer: 'Dana',
  },
  {
    id: 3,
    address: '789 Pine Rd',
    publisher: 'Eve',
    publisher_id: 103,
    created_date: '2024-06-03',
    review_date: '2024-06-12',
    status: 'denied',
    comment: 'Incorrect wiring',
    reviewer: 'Frank',
  },
  // ...more rows
];

const statusColors = {
  draft: 'default',
  approved: 'success',
  denied: 'error',
};

const PAGE_SIZE = 5;

const ReportsTable = ({ currentUser, onEditReport }) => {
  // currentUser: { id, user_type_id, user_type }
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  // Filter state
  const [addressFilter, setAddressFilter] = useState('');
  const [publisherFilter, setPublisherFilter] = useState('');
  const [reviewerFilter, setReviewerFilter] = useState('');

  // Unique publishers and reviewers for dropdowns
  const publisherOptions = Array.from(new Set(dummyReports.map(r => r.publisher)));
  const reviewerOptions = Array.from(new Set(dummyReports.map(r => r.reviewer)));

  // Simulate GET request on mount and when user_type_id/page/filters change
  useEffect(() => {
    let filtered;
    const user_type = userTypeMap[currentUser.user_type_id] || currentUser.user_type;
    if (user_type === 'admin') {
      filtered = dummyReports;
    } else if (user_type === 'electrician') {
      filtered = dummyReports.filter(r => r.publisher_id === currentUser.id);
    } else {
      filtered = [];
    }
    // Apply filters
    if (addressFilter) filtered = filtered.filter(r => r.address.toLowerCase().includes(addressFilter.toLowerCase()));
    if (publisherFilter) filtered = filtered.filter(r => r.publisher === publisherFilter);
    if (reviewerFilter) filtered = filtered.filter(r => r.reviewer === reviewerFilter);
    setTotal(filtered.length);
    setReports(filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));
  }, [currentUser, currentPage, addressFilter, publisherFilter, reviewerFilter]);

  const handleEdit = (record) => {
    if (onEditReport) {
      onEditReport(record);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleReset = () => {
    setAddressFilter('');
    setPublisherFilter('');
    setReviewerFilter('');
    setCurrentPage(1);
  };

  const columns = [
    { title: 'Address', dataIndex: 'address', key: 'address' },
    { title: 'Publisher', dataIndex: 'publisher', key: 'publisher' },
    { title: 'Created Date', dataIndex: 'created_date', key: 'created_date' },
    { title: 'Review Date', dataIndex: 'review_date', key: 'review_date' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={statusColors[status]}>{status}</Tag> },
    { title: 'Comment', dataIndex: 'comment', key: 'comment' },
    { title: 'Reviewer', dataIndex: 'reviewer', key: 'reviewer' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const user_type = userTypeMap[currentUser.user_type_id] || currentUser.user_type;
        if (record.status === 'approved' && user_type === 'electrician') return null;
        return (
          <Space>
            <Button type="link" onClick={() => handleEdit(record)}>Edit</Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 24 }}>Reports</h2>
      <Row gutter={16} style={{ marginBottom: 16 }} align="middle">
        <Col xs={24} sm={8} md={6} lg={5} xl={4} style={{ marginBottom: 8 }}>
          <Input
            placeholder="Filter by Address"
            value={addressFilter}
            onChange={e => setAddressFilter(e.target.value)}
            allowClear
            onPressEnter={handleSearch}
          />
        </Col>
        <Col xs={24} sm={8} md={6} lg={5} xl={4} style={{ marginBottom: 8 }}>
          <Select
            placeholder="Filter by Publisher"
            value={publisherFilter || undefined}
            onChange={setPublisherFilter}
            allowClear
            style={{ width: '100%' }}
          >
            {publisherOptions.map(p => (
              <Select.Option key={p} value={p}>{p}</Select.Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={8} md={6} lg={5} xl={4} style={{ marginBottom: 8 }}>
          <Select
            placeholder="Filter by Reviewer"
            value={reviewerFilter || undefined}
            onChange={setReviewerFilter}
            allowClear
            style={{ width: '100%' }}
          >
            {reviewerOptions.map(r => (
              <Select.Option key={r} value={r}>{r}</Select.Option>
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
      <Table
        columns={columns}
        dataSource={reports}
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
    </div>
  );
};

export default ReportsTable; 