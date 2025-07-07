import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, notification } from 'antd';
import axios from '@utils/axios';
import { loginSuccess, logout } from '../../redux/authSlice';

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ visible: false, message: '' });
    const alertTimerRef = useRef();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (alert.visible) {
            if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
            alertTimerRef.current = setTimeout(() => {
                setAlert({ visible: false, message: '' });
            }, 6000);
        }
        return () => {
            if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
        };
    }, [alert.visible]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await axios.post(`/auth/login`, new URLSearchParams(values));
            const { access_token, user } = response.data;
            // Save token to Redux only
            dispatch(loginSuccess({ user, token: access_token }));
        } catch (error) {
            // Always clear any existing user/token on error
            dispatch(logout());
            setAlert({ visible: true, message: 'Invalid username or password. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div style={{ width: 300 }}>
                {alert.visible && (
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ background: '#fff1f0', border: '1px solid #ffa39e', color: '#cf1322', padding: 12, borderRadius: 4 }}>
                            {alert.message}
                        </div>
                    </div>
                )}
                <Form
                    name="login"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Please input your Username!' }]}
                    >
                        <Input placeholder="Username" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your Password!' }]}
                    >
                        <Input.Password placeholder="Password" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
                            Log in
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default LoginPage;
