import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Table,
  Button,
  Pagination,
  Tag,
  Space,
  Row,
  Col,
  Input,
  Select,
  Spin,
  Alert,
  Modal,
} from "antd";
import { DownloadOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Map user_type_id to type string for demo
const userTypeMap = { 1: "admin", 2: "agent", 3: "electrician" };

const statusColors = {
  draft: "default",
  approved: "success",
  denied: "error",
};

const PAGE_SIZE = 5;

const { confirm } = Modal;

const ReportsTable = ({ onEditReport }) => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Filter state
  const [addressFilter, setAddressFilter] = useState("");
  const [publisherFilter, setPublisherFilter] = useState("");
  const [reviewerFilter, setReviewerFilter] = useState("");
  const navigate = useNavigate();

  // Fetch reports from backend
  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const params = new URLSearchParams({
      user_id: currentUser.id,
      user_type_id: currentUser.user_type_id,
    });
    fetch(`${apiUrl}/reports/?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch reports");
        return res.json();
      })
      .then((data) => {
        setReports(data);
        setTotal(data.length);
        setCurrentPage(1);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [currentUser]);

  // Filtered and paginated reports
  const filteredReports = reports.filter((r) => {
    let match = true;
    if (addressFilter)
      match =
        match && r.address?.toLowerCase().includes(addressFilter.toLowerCase());
    if (publisherFilter) match = match && r.publisher === publisherFilter;
    if (reviewerFilter) match = match && r.reviewer === reviewerFilter;
    return match;
  });
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Unique publishers and reviewers for dropdowns
  const publisherOptions = Array.from(
    new Set(reports.map((r) => r.publisher).filter(Boolean))
  );
  const reviewerOptions = Array.from(
    new Set(reports.map((r) => r.reviewer).filter(Boolean))
  );

  const handleEdit = (record) => {
    navigate("/form", {
      state: { formData: record.form_data, reportId: record.id },
    });
  };

  const handleDelete = (record) => {
    confirm({
      title: "Are you sure you want to delete this report?",
      icon: <ExclamationCircleOutlined />,
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "No, Cancel",
      onOk: async () => {
        try {
          const apiUrl =
            import.meta.env.VITE_API_URL || "http://localhost:8000";
          await axios.delete(`${apiUrl}/reports/delete/${record.id}`);
          setReports(reports.filter((r) => r.id !== record.id));
          // You might want to show a success message here
        } catch (err) {
          setError("Failed to delete report. Please try again.");
        }
      },
    });
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleReset = () => {
    setAddressFilter("");
    setPublisherFilter("");
    setReviewerFilter("");
    setCurrentPage(1);
  };

  const columns = [
    { title: "Address", dataIndex: "address", key: "address" },
    {
      title: "Publisher",
      dataIndex: "publisher",
      key: "publisher",
    },
    { title: "Created Date", dataIndex: "created_date", key: "created_date" },
    { title: "Review Date", dataIndex: "review_date", key: "review_date" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    { title: "Comment", dataIndex: "comment", key: "comment" },
    {
      title: "Reviewer",
      dataIndex: "reviewer",
      key: "reviewer",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {record.status === 'approved' ? (
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              href={record.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download PDF
            </Button>
          ) : (
            <Button type="link" onClick={() => handleEdit(record)}>Edit</Button>
          )}
          {currentUser.user_type_id === 1 && (
            <Button type="link" danger onClick={() => handleDelete(record)}>Delete</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 24 }}>
        Reports
      </h2>
      {error && (
        <Alert type="error" message={error} style={{ marginBottom: 16 }} />
      )}
      <Row gutter={16} style={{ marginBottom: 16 }} align="middle">
        <Col xs={24} sm={8} md={6} lg={5} xl={4} style={{ marginBottom: 8 }}>
          <Input
            placeholder="Filter by Address"
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
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
            style={{ width: "100%" }}
          >
            {publisherOptions.map((p) => (
              <Select.Option key={p} value={p}>
                {p}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={8} md={6} lg={5} xl={4} style={{ marginBottom: 8 }}>
          <Select
            placeholder="Filter by Reviewer"
            value={reviewerFilter || undefined}
            onChange={setReviewerFilter}
            allowClear
            style={{ width: "100%" }}
          >
            {reviewerOptions.map((r) => (
              <Select.Option key={r} value={r}>
                {r}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={24} md={6} lg={5} xl={4} style={{ marginBottom: 8 }}>
          <Space>
            <Button type="primary" onClick={handleSearch}>
              Search
            </Button>
            <Button onClick={handleReset}>Reset</Button>
          </Space>
        </Col>
      </Row>
      {loading ? (
        <Spin size="large" style={{ display: "block", margin: "40px auto" }} />
      ) : (
        <>
          <Table
            columns={columns}
            dataSource={paginatedReports}
            pagination={false}
            rowKey="id"
            bordered
            style={{ borderRadius: 12, overflow: "hidden" }}
          />
          <Pagination
            current={currentPage}
            pageSize={PAGE_SIZE}
            total={filteredReports.length}
            onChange={setCurrentPage}
            style={{ marginTop: 16, textAlign: "right" }}
          />
        </>
      )}
    </div>
  );
};

export default ReportsTable;
