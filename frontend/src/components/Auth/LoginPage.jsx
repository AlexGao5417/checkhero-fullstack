import React, { useState } from 'react';
import InputField from '../Form/InputField';

const LoginPage = ({ onSignIn, onGoBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const handleSignInClick = async () => {
        if (!email || !password) {
            setMessage('Please enter both email and password.');
            setTimeout(() => setMessage(''), 3000);
            return;
        }
        setLoading(true);
        setMessage('');
        try {
            const form = new URLSearchParams();
            form.append('username', email);
            form.append('password', password);
            const response = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: form.toString(),
            });
            if (response.ok) {
                const data = await response.json();
                onSignIn(data.access_token);
            } else {
                setMessage('Login failed. Please check your credentials.');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (err) {
            setMessage('Login failed. Please try again.');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 font-inter antialiased p-4">
            <div className="bg-white rounded-2xl shadow-3xl p-8 md:p-12 w-full max-w-md text-center">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">Login to CheckHero</h2>
                <p className="text-gray-600 mb-8">Enter your credentials to access the report generator.</p>

                <InputField
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                />
                <InputField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                />

                {message && (
                    <p className={`mt-4 text-sm font-semibold text-red-600`}>{message}</p>
                )}

                <button
                    onClick={handleSignInClick}
                    className="mt-8 w-full px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-lg font-semibold disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Signing In...' : (<><i className="fas fa-sign-in-alt mr-3"></i> Sign In</>)}
                </button>

                <button
                    onClick={onGoBack}
                    className="mt-4 w-full px-6 py-3 bg-gray-300 text-gray-800 rounded-full shadow-md hover:bg-gray-400 transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-lg font-semibold"
                >
                    <i className="fas fa-arrow-left mr-3"></i> Go Back
                </button>
            </div>
        </div>
    );
};

export default LoginPage;
