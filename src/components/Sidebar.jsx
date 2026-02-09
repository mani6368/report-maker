import React, { useEffect, useState } from 'react';
import { User, LogOut, FileText, PenSquare, PanelLeftClose, PanelLeftOpen, Search, Edit, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../../logo.png';

const Sidebar = ({ historyTrigger, isMobile, isOpen, onToggle, onClose, onReferral }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [history, setHistory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Use prop or default (for safety/desktop default behavior if props missing)
    const showSidebar = isOpen !== undefined ? isOpen : true;
    const isCollapsed = !showSidebar; // Derived state

    useEffect(() => {
        // Load User
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            console.log('Sidebar: Loaded user from localStorage:', parsedUser);
            console.log('Profile picture URL:', parsedUser.picture);
            setUser(parsedUser);
        } else {
            console.log('Sidebar: No user found in localStorage');
        }

        // Load History
        const storedHistory = localStorage.getItem('generation_history');
        if (storedHistory) {
            setHistory(JSON.parse(storedHistory));
        }
    }, [historyTrigger]); // Reload when trigger changes

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    const handleNewReport = () => {
        window.location.reload(); // Refresh to reset the form
    };

    return (
        <>
            {/* Mobile Backdrop */}
            {isMobile && showSidebar && (
                <div
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 99,
                        backdropFilter: 'blur(2px)'
                    }}
                />
            )}

            {/* Sidebar Panel */}
            <div style={{
                width: isMobile ? '280px' : (isCollapsed ? '60px' : '340px'), // Mobile: 280px, Desktop: 340px or 60px
                height: '100vh',
                background: '#171717',
                display: 'flex',
                flexDirection: 'column',
                color: 'white',
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: 100,
                transition: 'transform 0.3s ease, width 0.3s ease',
                transform: isMobile ? (showSidebar ? 'translateX(0)' : 'translateX(-100%)') : 'none',
                overflow: 'hidden',
                boxShadow: isMobile && showSidebar ? '4px 0 15px rgba(0,0,0,0.5)' : 'none'
            }}>
                {/* Header with Logo and Toggle */}
                <div style={{ padding: '1rem', position: 'relative' }}>
                    {isCollapsed && !isMobile ? (
                        // Collapsed state (Desktop Only) - Vertical icon layout
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <img
                                src={logo}
                                alt="Logo"
                                style={{ width: '40px', height: 'auto', cursor: 'pointer' }}
                                onClick={onToggle}
                                title="Expand sidebar"
                            />
                            <button
                                onClick={handleNewReport}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    padding: '0.6rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                                title="New Report"
                            >
                                <PenSquare size={20} />
                            </button>
                            <button
                                onClick={onToggle}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    padding: '0.6rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                                title="Expand sidebar"
                            >
                                <PanelLeftOpen size={20} />
                            </button>
                        </div>
                    ) : (
                        // Expanded state (Desktop) OR Mobile Open State - Logo and close button
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <img src={logo} alt="Logo" style={{ width: '40px', height: 'auto', flexShrink: 0 }} />
                            {!isMobile && (
                                <button
                                    onClick={onToggle}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        padding: '0.5rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                    title="Close sidebar"
                                >
                                    <PanelLeftClose size={20} />
                                </button>
                            )}
                        </div>
                    )}



                    {(showSidebar || isMobile) && (
                        <>
                            <button
                                onClick={handleNewReport}
                                style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '1.15rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <PenSquare size={18} />
                                New Report
                            </button>

                            <button
                                onClick={onReferral}
                                style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#4ade80', // Green text to stand out slightly or just white
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '1.15rem',
                                    transition: 'all 0.2s',
                                    marginTop: '0.2rem'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <Users size={18} />
                                Refer a Friend
                            </button>
                        </>
                    )}
                </div>

                {/* History Section */}
                {(showSidebar || isMobile) && (
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '0 1rem',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        paddingTop: '1rem'
                    }}>
                        <h4 style={{
                            fontSize: '1rem',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            color: 'rgba(255,255,255,0.5)',
                            marginBottom: '0.75rem',
                            fontWeight: '600'
                        }}>
                            Your Reports
                        </h4>

                        {/* Search Input */}
                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                            <input
                                type="text"
                                placeholder="Search reports..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    padding: '0.6rem 0.75rem 0.6rem 2.5rem',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.background = 'rgba(255,255,255,0.08)';
                                    e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.background = 'rgba(255,255,255,0.05)';
                                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                                }}
                            />
                        </div>

                        {history.length === 0 ? (
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                                No reports yet
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {history
                                    .filter(item => item.topic.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .slice(0, 20)
                                    .map((item, index) => (
                                        <div key={item.id || index}>
                                            <div
                                                onClick={() => {
                                                    // Load report data and show preview
                                                    if (item.reportData) {
                                                        // Navigate to show preview with this report
                                                        window.dispatchEvent(new CustomEvent('loadReport', { detail: item }));
                                                        if (isMobile && onClose) onClose(); // Close sidebar on mobile
                                                    }
                                                }}
                                                style={{
                                                    padding: '0.75rem',
                                                    background: index === 0 ? 'rgba(255,255,255,0.1)' : 'transparent',
                                                    borderRadius: '8px',
                                                    fontSize: '1.1rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                                }}
                                                onMouseOut={(e) => {
                                                    if (index !== 0) e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                <FileText size={16} style={{ flexShrink: 0, color: 'rgba(255,255,255,0.6)' }} />
                                                <div style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    flex: 1
                                                }}>
                                                    <div style={{ color: 'rgba(255,255,255,0.9)' }}>{item.topic}</div>
                                                    <div style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                                        {new Date(item.date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Render edited versions */}
                                            {item.editedVersions && item.editedVersions.length > 0 && (
                                                <div style={{ marginLeft: '1.5rem', borderLeft: '2px solid rgba(37, 99, 235, 0.3)', paddingLeft: '0.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                                                    {item.editedVersions.map((editedItem, editIdx) => (
                                                        <div
                                                            key={editedItem.id || `edit-${index}-${editIdx}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (editedItem.reportData) {
                                                                    window.dispatchEvent(new CustomEvent('loadReport', { detail: editedItem }));
                                                                    if (isMobile && onClose) onClose();
                                                                }
                                                            }}
                                                            style={{
                                                                padding: '0.6rem',
                                                                background: 'rgba(255,255,255,0.03)',
                                                                borderRadius: '6px',
                                                                fontSize: '0.9rem',
                                                                cursor: 'pointer',
                                                                transition: 'background 0.2s',
                                                                marginBottom: '0.25rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem'
                                                            }}
                                                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)'}
                                                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                                        >
                                                            <Edit size={14} style={{ color: '#2563eb', flexShrink: 0 }} />
                                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {editedItem.editPrompt || 'Edited version'}
                                                                </div>
                                                                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.1rem' }}>
                                                                    {new Date(editedItem.date).toLocaleTimeString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                )}

                {/* User Profile at Bottom */}
                <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    padding: '1rem'
                }}>
                    {(!isCollapsed || isMobile) ? (
                        <>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.75rem'
                            }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    flexShrink: 0
                                }}>
                                    {user?.picture ? (
                                        <img
                                            src={user.picture}
                                            alt="Profile"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => {
                                                console.error('Failed to load profile image:', user.picture);
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <User size={20} color="rgba(255,255,255,0.7)" />
                                    )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {user?.name || 'Guest'}
                                    </div>
                                    <div style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {user?.email || ''}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.7)',
                                    padding: '0.6rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    fontSize: '1.1rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                                }}
                            >
                                <LogOut size={16} /> Log Out
                            </button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255, 255, 255, 0.05)'
                            }}>
                                {user?.picture ? (
                                    <img
                                        src={user.picture}
                                        alt="Profile"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => {
                                            console.error('Failed to load profile image (collapsed):', user.picture);
                                            e.target.onerror = null;
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <User size={20} color="rgba(255,255,255,0.7)" />
                                )}
                            </div>
                            <button
                                onClick={handleLogout}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.7)',
                                    padding: '0.5rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'color 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                                }}
                                title="Log Out"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div >
        </>
    );
};

export default Sidebar;
