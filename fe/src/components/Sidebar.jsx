// src/components/Sidebar.jsx

import React, { useState, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from "../contexts/AuthContext.jsx";
import axios from 'axios';

// Define the breakpoint for mobile view
const MOBILE_BREAKPOINT = 768;

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
    // 1. STATE TO TRACK MOBILE VIEW
    const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

    // 2. EFFECT TO HANDLE RESIZING (Native Hook for Mobile Detection)
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };

        window.addEventListener('resize', checkIsMobile);
        // Initial check on mount
        checkIsMobile();

        // Cleanup function
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // --- Contexts and State ---
    const {
        activeChatId,
        chatList,
        setActiveChatId,
        deleteChat,
        fetchChatList,
        createNewChat,
    } = useChat();

    const [isRenaming, setIsRenaming] = useState(null);
    const [tempTitle, setTempTitle] = useState('');

    const { logout } = useAuth();
    // -------------------------

    // --- Handlers ---
    const handleManualRename = async (chatId) => {
        if (!tempTitle.trim()) return;
        try {
            await axios.post(`/chats/${chatId}/title`, { newTitle: tempTitle });
            fetchChatList();
            setIsRenaming(null);
        } catch (err) {
            console.error('Manual rename failed:', err);
            // Error handling here
        }
    };

    const handleDeleteChat = async (chatId) => {
        if (window.confirm("Are you sure you want to delete this chat?")) {
            await deleteChat(chatId);
            fetchChatList();
        }
    };

    // New handler: Sets active chat AND closes sidebar on mobile
    const handleSetActiveChat = (chatId) => {
        setActiveChatId(chatId);
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    };
    // ------------------


    // --- STYLING ---

    // Define the style for the content wrapper (opacity/minWidth)
    const contentStyle = {
        opacity: isSidebarOpen ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        pointerEvents: isSidebarOpen ? 'auto' : 'none',
        minWidth: '300px'
    };

    // CONDITIONAL STYLING FOR MOBILE OVERLAY (APPLIED TO MAIN DIV)
    const sidebarContainerStyle = {
        // --- Shared Styles for Collapse Effect ---
        // Width: 300px open. Closed state is 60px (desktop) or 0px (mobile)
        width: isSidebarOpen ? '300px' : '60px',
        minWidth: isSidebarOpen ? '300px' : '60px',
        transition: 'width 0.3s ease-in-out, min-width 0.3s ease-in-out, left 0.3s ease-in-out',
        overflow: 'hidden',

        // 🌟 CRITICAL FIX: Only use fixed/absolute positioning when open AND mobile 🌟
        position: isMobile && isSidebarOpen ? 'fixed' : 'relative',
        top: 0,
        bottom: 0,

        // This makes the closed mobile sidebar take up 0 space beside the chat
        left: isMobile && isSidebarOpen ? 0 : undefined,

        height: isMobile ? '100vh' : 'auto',
        zIndex: isMobile && isSidebarOpen ? 1051 : 1, // Only high z-index when floating
        boxShadow: isMobile && isSidebarOpen ? '5px 0 10px rgba(0,0,0,0.2)' : 'none',
    };
    // -----------------

    return (
        <div
            className={`bg-light border-end d-flex flex-column`}
            style={sidebarContainerStyle} // Apply combined styles
        >
            {/* 🌟 1. COLLAPSE BUTTON HEADER 🌟 */}
            <div className="p-3 d-flex justify-content-between align-items-center border-bottom bg-white flex-shrink-0">

                {/* Collapse/Expand Button */}
                <button
                    onClick={() => setIsSidebarOpen(prev => !prev)}
                    className="btn btn-sm btn-outline-secondary"
                    title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
                >
                    {isSidebarOpen ?
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                             className="bi bi-chevron-bar-left" viewBox="0 0 16 16">
                            <path fill-rule="evenodd"
                                  d="M11.854 3.646a.5.5 0 0 1 0 .708L8.207 8l3.647 3.646a.5.5 0 0 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 0 1 .708 0M4.5 1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 1 0v-13a.5.5 0 0 0-.5-.5"/>
                        </svg>
                        :
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                             className="bi bi-chevron-bar-right" viewBox="0 0 16 16">
                            <path fill-rule="evenodd"
                                  d="M4.146 3.646a.5.5 0 0 0 0 .708L7.793 8l-3.647 3.646a.5.5 0 0 0 .708.708l4-4a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708 0M11.5 1a.5.5 0 0 1 .5.5v13a.5.5 0 0 1-1 0v-13a.5.5 0 0 1 .5-.5"/>
                        </svg>
                    }
                </button>

                {/* Logout Button */}
                {isSidebarOpen && (
                    <button onClick={logout} className="btn btn-sm btn-outline-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                             fill="currentColor" className="bi bi-box-arrow-right me-2"
                             viewBox="0 0 16 16">
                            <path fill-rule="evenodd"
                                  d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
                            <path fill-rule="evenodd"
                                  d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
                        </svg>
                        Logout
                    </button>
                )}
            </div>


            {/* 🌟 2. WRAPPER FOR SCROLLABLE/FADING CONTENT 🌟 */}
            <div
                className="flex-grow-1 d-flex flex-column"
                style={contentStyle}
            >
                {/* --- New Chat Button --- */}
                <div className="p-3 border-bottom flex-shrink-0">
                    <button
                        onClick={() => createNewChat()}
                        className="btn btn-success w-100 shadow-sm"
                    >
                        + New Chat
                    </button>
                </div>

                {/* --- Chat List Mapping --- */}
                <div className="list-group list-group-flush flex-grow-1 overflow-auto">
                    {chatList.map((chat) => (
                        <div
                            key={chat._id}
                            // ❗ Use the new handler here ❗
                            onClick={() => handleSetActiveChat(chat._id)}
                            className={`list-group-item list-group-item-action ${chat._id === activeChatId ? 'active' : ''} d-flex justify-content-between align-items-center mb-0 border-0`}
                            style={{cursor: 'pointer', padding: '0.75rem 1rem'}}
                        >
                            {isRenaming === chat._id ? (
                                // RENAME INPUT VIEW
                                <div className="d-flex align-items-center w-100" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm me-1"
                                        value={tempTitle}
                                        onChange={(e) => setTempTitle(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleManualRename(chat._id)}
                                    />
                                    <button className={`btn btn-sm ${chat._id === activeChatId ? 'btn-outline-light' : 'btn-success'} py-0 px-1 me-1`} onClick={() => handleManualRename(chat._id)}>✔</button>
                                    <button className={`btn btn-sm ${chat._id === activeChatId ? 'btn-outline-light' : 'btn-light'} py-0 px-1`} onClick={() => setIsRenaming(null)}>✖</button>
                                </div>
                            ) : (
                                // DISPLAY VIEW (Title + Buttons)
                                <>
                                    <span
                                        className="text-truncate flex-grow-1 me-2"
                                        style={{ maxWidth: '60%' }}
                                    >
                                        {chat.title}
                                    </span>

                                    <div className="btn-group btn-group-sm" onClick={(e) => e.stopPropagation()}>
                                        {/* RENAME Button */}
                                        <button
                                            className={`btn btn-sm py-0 px-1 me-1 ${chat._id === activeChatId ? 'btn-outline-light' : 'btn-outline-secondary'}`}
                                            title="Rename"
                                            onClick={() => {
                                                setIsRenaming(chat._id);
                                                setTempTitle(chat.title);
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                 fill="currentColor" className="bi bi-pencil-fill" viewBox="0 0 16 16">
                                                <path
                                                    d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                            </svg>
                                        </button>

                                        {/* DELETE Button */}
                                        <button
                                            className={`btn btn-sm py-0 px-1 ${chat._id === activeChatId ? 'btn-outline-light' : 'btn-outline-secondary'}`}
                                            title="Delete"
                                            onClick={() => handleDeleteChat(chat._id)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                                            </svg>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>


            {/*{isMobile && isSidebarOpen && (*/}
            {/*    <div*/}
            {/*        onClick={() => setIsSidebarOpen(false)}*/}
            {/*        style={{*/}
            {/*            position: 'fixed',*/}
            {/*            top: 0,*/}
            {/*            left: 0,*/}
            {/*            right: 0,*/}
            {/*            bottom: 0,*/}
            {/*            backgroundColor: 'rgba(0, 0, 0, 0.3)',*/}
            {/*            zIndex: -1050, // Below the sidebar but above all content*/}
            {/*        }}*/}
            {/*    />*/}
            {/*)}*/}
        </div>
    );
};

export default Sidebar;