import React from 'react';
import logo from '../../logo.png';
import './GridLoader.css';

const GridLoader = () => {
    return (
        <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '120px',
            height: '120px'
        }}>
            {/* Circular Spinner */}
            <div className="spinner-loader"></div>

            {/* Logo in Center with Float Animation */}
            <img
                src={logo}
                alt="Logo"
                className="logo-float"
                style={{
                    position: 'absolute',
                    width: '40px',
                    height: 'auto',
                    zIndex: 10,
                    filter: 'drop-shadow(0 0 10px rgba(226, 90, 131, 0.3))'
                }}
            />
        </div>
    );
};

export default GridLoader;
