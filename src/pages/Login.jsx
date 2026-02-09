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
    // const [hue, setHue] = useState(170); // Kept for Orb if needed, or remove if static

    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzQ0bJ47zyj28Y-587fS69nYjKj9fsOsuYRP_8my0P2d9QFFeuIH0HysnJ2SvRadX498w/exec";

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
                        <h2>Sign In</h2>
                        <p>Sign in with Google to continue</p>
                    </div>

                    <div className="google-login-wrapper" style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', marginBottom: '2rem' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => {
                                console.log('Login Failed');
                                alert('Google Login Failed');
                            }}
                            theme="filled_black"
                            shape="pill"
                            text="signin_with"
                            size="large"
                            width="250"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
