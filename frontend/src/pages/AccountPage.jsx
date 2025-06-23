import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Card, Typography, Row, Col } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import axios from '@utils/axios';
import { loginSuccess } from '../redux/authSlice';

const { Title } = Typography;

const AccountPage = () => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const [form] = Form.useForm();
    const { user, token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                username: user.username,
                email: user.email,
                phone: user.phone,
            });
        }
    }, [user, form]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const payload = {
                username: values.username,
                email: values.email,
                phone: values.phone,
            };

            if (values.password) {
                payload.password = values.password;
            }

            const response = await axios.put(`${API_BASE}/users/${user.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update user info in redux state
            dispatch(loginSuccess({ user: response.data, token }));
            message.success('Account updated successfully!');
            
            if (values.password) {
                form.resetFields(['password', 'confirm']);
            }

        } catch (error) {
            console.error('Failed to update account:', error);
            message.error(error.response?.data?.detail || 'Failed to update account.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Row justify="center" style={{ marginTop: '50px' }}>
            <Col xs={24} sm={18} md={12} lg={10} xl={8}>
                <Card>
                    <Title level={2} style={{ textAlign: 'center' }}>My Account</Title>
                    <Form
                        form={form}
                        layout="vertical"
                        name="account_form"
                        onFinish={onFinish}
                        initialValues={{
                            username: user?.username,
                            email: user?.email,
                            phone: user?.phone,
                        }}
                    >
                        <Form.Item
                            name="username"
                            label="Username"
                            rules={[{ required: true, message: 'Please input your username!' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[{ required: true, type: 'email', message: 'Please input a valid email!' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="phone"
                            label="Phone Number"
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="password"
                            label="New Password"
                            help="Leave blank to keep your current password."
                        >
                            <Input.Password />
                        </Form.Item>
                        <Form.Item
                            name="confirm"
                            label="Confirm New Password"
                            dependencies={['password']}
                            hasFeedback
                            rules={[
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!getFieldValue('password') || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('The two passwords that you entered do not match!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} block>
                                Save Changes
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </Col>
        </Row>
    );
};

export default AccountPage; 