import React, { useState } from 'react';
import Orb from '../components/Orb';
import './Login.css';
import { User, Lock, ArrowRight, Eye, EyeOff, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import logo from '../../logo.png'; // Import logo

const Login = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [hue, setHue] = useState(170); // Start Orange (Blue + 170deg)
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });

    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzQ0bJ47zyj28Y-587fS69nYjKj9fsOsuYRP_8my0P2d9QFFeuIH0HysnJ2SvRadX498w/exec";

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGoogleSuccess = (credentialResponse) => {
        const decoded = jwtDecode(credentialResponse.credential);
        console.log("Google Login Success:", decoded);

        // Save User to LocalStorage
        localStorage.setItem('user', JSON.stringify({
            name: decoded.name,
            email: decoded.email,
            picture: decoded.picture
        }));

        // Send Google User Data to Sheets (Fire and forget)
        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            keepalive: true,
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                email: decoded.email,
                username: decoded.name,
                password: 'GOOGLE_SIGN_IN', // Placeholder
                type: 'google-login',
                timestamp: new Date().toISOString()
            })
        }).catch(err => console.error(err));

        navigate('/home');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Determine display name
            let displayName = formData.username;
            if (isLogin) {
                // Determine name from email if not registering
                displayName = formData.email.split('@')[0];
            }

            // Save User to LocalStorage
            localStorage.setItem('user', JSON.stringify({
                name: displayName,
                email: formData.email,
                picture: null // No picture for manual login
            }));

            // INSTANT LOGIN (Fire and forget, no verification)
            // User requested speed over invalid password checking
            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                keepalive: true,
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    ...formData,
                    type: isLogin ? 'login' : 'register',
                    timestamp: new Date().toISOString()
                })
            }).catch(err => console.error(err));

            // Navigate immediately
            navigate('/home');

        } catch (error) {
            console.error("Error submitting form", error);
            navigate('/home'); // Fallback direct navigation
        }
    };

    return (
        <div className="login-wrapper">
            <div className="orb-background">
                <Orb
                    hue={0}
                    hoverIntensity={0.5}
                    rotateOnHover={true}
                    backgroundColor="transparent"
                    baseColor="#e75b73"
                />
            </div>

            {/* Header with Logo and Title - Centered */}
            {/* Header with Logo and Title - Centered */}
            <div className="login-header">
                <img
                    src={logo}
                    alt="Report-maker.ai Logo"
                    className="login-logo"
                />
                <h1 className="login-title">
                    Report-maker.ai
                </h1>
            </div>

            <div className="login-content">

                <div className="glass-card">
                    <div className="card-header">
                        <h2>{isLogin ? 'Log In' : 'Create Account'}</h2>
                        <p>{isLogin ? 'Enter your credentials to access your account' : 'Sign up to get started'}</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className="input-group">
                                <User size={18} className="input-icon" />
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        )}

                        <div className="input-group">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <Lock size={18} className="input-icon" />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <button type="submit" className="submit-btn">
                            {isLogin ? 'Log In' : 'Sign Up'}
                            <ArrowRight size={18} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                            <span style={{ padding: '0 10px', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>OR</span>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                        </div>

                        <div className="google-login-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => {
                                    console.log('Login Failed');
                                    alert('Google Login Failed');
                                }}
                                theme="filled_black"
                                shape="pill"
                                text="continue_with"
                            />
                        </div>

                    </form>

                    <div className="card-footer">
                        <p>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <span onClick={() => setIsLogin(!isLogin)}>
                                {isLogin ? 'Sign Up' : 'Log In'}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
