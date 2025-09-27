// src/components/Sidebar.jsx

import React, { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import {useAuth} from "../contexts/AuthContext.jsx";
import axios from 'axios';

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const {
        activeChatId,
        chatList,
        setActiveChatId,
        deleteChat, // Function to delete chat
        fetchChatList,
        createNewChat,
    } = useChat();

    const [isRenaming, setIsRenaming] = useState(null);
    const [tempTitle, setTempTitle] = useState('');

    const { logout } = useAuth();

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

    // Define the style for the content wrapper (used inside the main div)
    const contentStyle = {
        opacity: isSidebarOpen ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        pointerEvents: isSidebarOpen ? 'auto' : 'none',
        minWidth: '300px' // Ensures content doesn't wrap oddly when slightly visible
    };

    return (
        <div
            className={`bg-light border-end d-flex flex-column`}
            style={{
                // Control width and transition for collapse effect
                width: isSidebarOpen ? '300px' : '60px',
                minWidth: isSidebarOpen ? '300px' : '60px',
                transition: 'width 0.3s ease-in-out, min-width 0.3s ease-in-out',
                overflow: 'hidden', // Hides content when width is 0
            }}
        >
            {/* 🌟 1. COLLAPSE BUTTON HEADER 🌟 */}
            <div className="p-3 d-flex justify-content-between align-items-center border-bottom bg-white flex-shrink-0">


                {/* Collapse/Expand Button */}
                <button
                    onClick={() => setIsSidebarOpen(prev => !prev)}
                    className="btn btn-sm btn-outline-secondary"
                    title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
                >
                    {isSidebarOpen ? '❮' : '❯'}
                </button>

                {/* Logout Button */}
                {isSidebarOpen && (
                    <button onClick={logout} className="btn btn-sm btn-outline-primary">
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
                            className={`list-group-item list-group-item-action ${chat._id === activeChatId ? 'active' : ''} d-flex justify-content-between align-items-center mb-0 border-0`}
                            onClick={() => setActiveChatId(chat._id)}
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
                                            ✏️
                                        </button>

                                        {/* DELETE Button */}
                                        <button
                                            className={`btn btn-sm py-0 px-1 ${chat._id === activeChatId ? 'btn-outline-light' : 'btn-outline-secondary'}`}
                                            title="Delete"
                                            onClick={() => handleDeleteChat(chat._id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;