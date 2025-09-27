import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();

    // State for all the user's conversation titles/metadata (for the sidebar)
    const [chatList, setChatList] = useState([]);
    // State for the currently selected chat ID
    const [activeChatId, setActiveChatId] = useState(null);
    // State for the messages of the active chat
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState(null); // For detailed error feedback
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // For sidebar collapse

    // 1. Fetch all chats when the user logs in
    useEffect(() => {
        if (isAuthenticated) {
            fetchChatList();
        } else {
            // Clear state on logout
            setChatList([]);
            setActiveChatId(null);
            setMessages([]);
        }
    }, [isAuthenticated]);

    // 2. Load messages when a new chat is selected or created
    useEffect(() => {
        if (activeChatId) {
            fetchMessages(activeChatId);
        } else if (chatList.length > 0) {
            // If no chat is active, default to the most recent one
            setActiveChatId(chatList[0]._id);
        }
    }, [activeChatId, chatList.length]);


    // API Call to get the list of chats
    const fetchChatList = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/chats/all');
            setChatList(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch chat list:', err);
            setLoading(false);
        }
    };

    // API Call to load the history of a specific chat
    const fetchMessages = async (chatId) => {
        try {
            setLoading(true);
            const res = await axios.get(`/chats/${chatId}`);
            setMessages(res.data.messages);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch messages:', err);
            setLoading(false);
        }
    };

    // API Call to create a new chat session
    const createNewChat = async (title = 'New Chat') => {
        try {
            const res = await axios.post('/chats/new', { title });
            const newChat = res.data;

            // Add new chat to the list and make it the active chat
            setChatList([newChat, ...chatList]);
            setActiveChatId(newChat._id);
            setMessages([]); // Start with an empty message array
        } catch (err) {
            console.error('Failed to create new chat:', err);
        }
    };

    // API Call to delete a chat session
    const deleteChat = async (chatId) => {
        try {
            await axios.delete(`/chats/${chatId}`);

            // Update the chat list locally
            const updatedList = chatList.filter(chat => chat._id !== chatId);
            setChatList(updatedList);

            // If the deleted chat was active, deactivate it
            if (activeChatId === chatId) {
                setActiveChatId(updatedList.length > 0 ? updatedList[0]._id : null);
                setMessages([]);
            }
        } catch (err) {
            console.error('Failed to delete chat:', err);
        }
    };


    return (
        <ChatContext.Provider
            value={{
                chatList,
                activeChatId,
                messages,
                loading,
                setActiveChatId,
                createNewChat,
                deleteChat,
                fetchChatList, // useful after a message response for title updates
                setMessages, // will be needed by the Chat component to optimistically update the history
                error,
                setError,
                isSidebarOpen,
                setIsSidebarOpen,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);