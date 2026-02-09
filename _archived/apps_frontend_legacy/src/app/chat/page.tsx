'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  user_id: string;
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_online?: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  content: string;
  timestamp: string;
  is_read: boolean;
  file_url?: string;
}

/**
 * Real-time Chat Page
 * WebSocket-based in-app messaging system for land transaction communication
 */
export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatUser, setNewChatUser] = useState('');
  const websocketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

  // Scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    if (selectedConversation) {
      connectWebSocket();
      loadMessages();
    }

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [selectedConversation]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE}/api/v1/messages/conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      const convData = Array.isArray(response.data) ? response.data : response.data.conversations || [];
      setConversations(convData);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE}/api/v1/messages/conversation/${selectedConversation.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      const msgsData = Array.isArray(response.data) ? response.data : response.data.messages || [];
      setMessages(msgsData);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const connectWebSocket = () => {
    if (!selectedConversation) return;

    const token = localStorage.getItem('token');
    const wsUrl = `${WS_BASE}/api/v1/ws/chat/${selectedConversation.id}?token=${token}`;

    try {
      websocketRef.current = new WebSocket(wsUrl);

      websocketRef.current.onopen = () => {
        console.log('WebSocket connected');
        toast.success('Connected to chat');
      };

      websocketRef.current.onmessage = (event) => {
        const newMessage = JSON.parse(event.data);
        setMessages(prev => [...prev, newMessage]);
      };

      websocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error('Chat connection error');
      };

      websocketRef.current.onclose = () => {
        console.log('WebSocket disconnected');
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      toast.error('Failed to connect to chat');
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const token = localStorage.getItem('token');

      // Send via HTTP (backup/initial send)
      await axios.post(
        `${API_BASE}/api/v1/messages/send`,
        {
          receiver_id: selectedConversation.other_user_id,
          content: messageText,
          conversation_id: selectedConversation.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      // Also send via WebSocket if connected
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'message',
          content: messageText,
          receiver_id: selectedConversation.other_user_id,
        }));
      }

      setMessageText('');
      toast.success('Message sent');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const startNewChat = async () => {
    if (!newChatUser.trim()) {
      toast.error('Please enter a user ID or name');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE}/api/v1/messages/conversations/new`,
        { user_id: newChatUser },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      const newConversation = response.data;
      setConversations(prev => [...prev, newConversation]);
      setSelectedConversation(newConversation);
      setNewChatUser('');
      setShowNewChat(false);
      toast.success('Conversation started');
    } catch (error: any) {
      toast.error('Failed to start conversation');
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">💬 Messages</h1>
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            ✉️ New Chat
          </button>
        </div>

        {/* New Chat Form */}
        {showNewChat && (
          <div className="p-4 border-b border-gray-200 bg-blue-50">
            <input
              type="text"
              placeholder="User ID or name..."
              value={newChatUser}
              onChange={(e) => setNewChatUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded mb-2 focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={startNewChat}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
              >
                Start
              </button>
              <button
                onClick={() => setShowNewChat(false)}
                className="flex-1 px-3 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No conversations yet</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-l-4 ${
                    selectedConversation?.id === conv.id
                      ? 'bg-blue-50 border-l-blue-600'
                      : 'border-l-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {conv.other_user_name}
                      {conv.is_online && <span className="ml-2 text-xs text-green-600">🟢</span>}
                    </h3>
                    {conv.unread_count > 0 && (
                      <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{conv.last_message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedConversation.other_user_name}</h2>
                  <p className="text-sm text-gray-600">
                    {selectedConversation.is_online ? '🟢 Online' : '⚫ Offline'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    toast.info('Call/Video features coming soon');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  📞 Call
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-lg">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === localStorage.getItem('user_id') ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.sender_id === localStorage.getItem('user_id')
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-100 text-gray-900 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm font-semibold mb-1">{msg.sender_name}</p>
                        <p className="break-words">{msg.content}</p>
                        {msg.file_url && (
                          <a
                            href={msg.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm mt-2 underline block"
                          >
                            📎 Download
                          </a>
                        )}
                        <p className={`text-xs mt-1 ${
                          msg.sender_id === localStorage.getItem('user_id')
                            ? 'text-blue-100'
                            : 'text-gray-500'
                        }`}>
                          {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    toast.info('File upload coming soon');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  📎
                </button>
                <button
                  onClick={sendMessage}
                  disabled={sending || !messageText.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                >
                  {sending ? '⏳' : '📤'} Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500 text-lg">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
