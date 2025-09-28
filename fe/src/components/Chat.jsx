// src/components/Chat.jsx

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useChat } from '../contexts/ChatContext';
import axios from 'axios';
import Sidebar from './Sidebar'; // Ensure Sidebar is imported
import './Chat.css'


const Chat = () => {
    // --- CONTEXT HOOKS ---
    const {
        activeChatId,
        messages,
        loading, // Assume 'loading' state still exists for fetching initial messages
        setMessages,
        chatList,
        fetchChatList,
        isSidebarOpen,
        setIsSidebarOpen,
        setError, // Used for detailed error feedback
        error,
    } = useChat();

    // --- LOCAL STATE ---
    const [isSending, setIsSending] = useState(false);
    const [input, setInput] = useState('');
    const [file, setFile] = useState(null);
    const messagesEndRef = useRef(null); // For auto-scrolling

    const sidebarProps = { isSidebarOpen, setIsSidebarOpen };


    // --- EFFECT for Auto-Scrolling ---
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // --- AUTO-RENAME LOGIC ---
    // Function to trigger AI auto-rename (sends request without a newTitle)
    const triggerAutoRename = async (chatId) => {
        try {
            await axios.post(`/chats/${chatId}/title`);
            // Refresh the chat list to display the new title immediately
            fetchChatList();
        } catch (err) {
            console.error('Auto rename failed:', err);
            // Non-critical error, so we just log it
        }
    };

    // --- SEND MESSAGE HANDLER ---
    const sendMessage = async (e) => {
        e.preventDefault();
        // Only proceed if there's text OR a file, and an active chat
        if ((!input.trim() && !file) || !activeChatId) return;

        // Create a new FormData object to handle both text and file
        const formData = new FormData();
        formData.append('message', input.trim());
        formData.append('chatId', activeChatId);
        if (file) {
            formData.append('file', file); // Append the file object
        }

        // 1. (Omitted optimistic update for file to simplify)
        setInput('');
        setIsSending(true);

        try {
            // 2. API Call: MUST use axios.post with FormData
            const res = await axios.post(`/chats/${activeChatId}/message`, formData, {
                // Crucial for file uploads
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setMessages(res.data);
            setFile(null);

            // --- AUTO-RENAME CHECK ---
            // Trigger rename if this was the first user/model exchange (total length is 2)
            if (res.data.length === 2) {
                triggerAutoRename(activeChatId);
            }
            // --- END AUTO-RENAME CHECK ---

        } catch (error) {
            console.error('Chat error:', error);
            setError('Error sending message. Please check the console for details.');
        } finally {
            setIsSending(false);
        }
    };

    // Safely determine the active chat title
    const activeChatTitle = activeChatId ?
        (chatList.find(chat => chat._id === activeChatId)?.title || '...loading')
        : 'No Chat Selected';

    // --- RENDER ---
    return (
        // Main container: full viewport height (vh-100) and width (vw-100)
        <div className="d-flex vh-100 vw-100 overflow-hidden">

            {/* 1. Sidebar Container (Uses Custom CSS for Transition) */}
            <div
                className={`sidebar-container bg-light border-end ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}
            >
                {/* Render the Sidebar component inside */}
                <Sidebar {...sidebarProps} />
            </div>

            {/* 2. Main Chat Area */}
            <div className="chat-main d-flex flex-column bg-white flex-grow-1">

                {/* HEADER */}
                <div className="d-flex justify-content-between align-items-center bg-primary text-white p-3 shadow-sm flex-shrink-0">
                    <h5 className="mb-0 text-truncate">
                        {activeChatTitle}
                    </h5>


                </div>



                {/* 3. MESSAGE DISPLAY AREA */}
                <div className="card-body p-3 overflow-auto flex-grow-1">
                    {loading && <div className="text-center text-muted">Loading messages...</div>}
                    {!activeChatId && !loading && (
                        <div className="text-center text-muted">Click "+ New Chat" to begin a conversation.</div>
                    )}
                    {activeChatId && messages.map((msg, index) => (
                        <div key={index} className={`mb-2 text-${msg.role === 'user' ? 'end' : 'start'}`}>
                            <span
                                className={`p-2  d-inline-block text-wrap ${
                                    msg.role === 'user' ? 'bg-primary text-white rounded-start' : 'bg-light text-dark ai-response-text rounded-end'
                                }`}

                            >
                               <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                            </span>
                        </div>
                    ))}
                    {(isSending && activeChatId) && <div className="text-muted">Gemini is typing...</div>}
                    <div ref={messagesEndRef} /> {/* Scroll target */}
                </div>

                {/* 4. INPUT FORM */}
                <div className="card-footer">
                    {error && <div className="alert alert-danger p-2">{error}</div>}
                    <form onSubmit={sendMessage} className="input-group gap-1 p-1">

                        {/* NEW FILE INPUT */}
                        <div className="input-group-prepend">
                            <label className="btn btn-outline-secondary disabled rounded-5" title="Upload File">
                                {file ? file.name : '+ Attach'}
                                <input
                                    type="file"
                                    hidden
                                    onChange={(e) => setFile(e.target.files[0])}
                                    //disabled={isSending || !activeChatId}
                                    disabled={true}
                                />
                            </label>
                            {/* Button to remove the file if one is selected */}
                            {file && (
                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={() => setFile(null)}
                                >
                                    ✖
                                </button>
                            )}
                        </div>
                        {/* END FILE INPUT */}

                        <input
                            type="text"
                            className="form-control rounded-5"
                            placeholder="Ask Gemini anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isSending || !activeChatId}
                        />
                        <button type="submit" className="btn btn-success rounded-5" disabled={isSending || !activeChatId}>
                            {isSending ? (
                                // State 1: When sending
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                         className="bi bi-arrow-clockwise rotate-clockwise me-2" viewBox="0 0 16 16">
                                        <path fill-rule="evenodd"
                                              d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
                                        <path
                                            d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
                                    </svg>
                                    <span>Sending..</span>
                                </>
                            ) : (
                                // State 2: When ready to send (SVG icon + the word "Send")
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                         className="bi bi-send me-2" viewBox="0 0 16 16">
                                        <path
                                            d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/>
                                    </svg>
                                    <span>Send</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Chat;