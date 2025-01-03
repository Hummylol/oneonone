import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import backendlink from '../backendlink.js';
import Search from '../components/Search';
import ChatBox from '../components/ChatBox';

const socket = io(backendlink, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  query: { userId: localStorage.getItem('userId') },
});

function Chat() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showUserList, setShowUserList] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) window.location.href = '/';
    
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(`${backendlink}/user/${localStorage.getItem('userId')}`);
        setCurrentUser(res.data);
      } catch (err) {
        console.error('Error fetching current user:', err.message);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
      if (selectedUser) {
        socket.emit('join_room', localStorage.getItem('userId'));
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [selectedUser]);

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setShowUserList(false);
    socket.emit('join_room', localStorage.getItem('userId'));

    try {
      const res = await axios.get(
        `${backendlink}/user/chats/${localStorage.getItem('userId')}/${user._id}`
      );
      setMessages(res.data);
    } catch (err) {
      console.error('Error fetching chat history:', err.message);
    }
  };

  useEffect(() => {
    const handleReceiveMessage = (message) => {
      setMessages((prevMessages) => {
        const isRelevantChat = 
          (message.sender === selectedUser?._id && message.receiver === localStorage.getItem('userId')) ||
          (message.sender === localStorage.getItem('userId') && message.receiver === selectedUser?._id);
        
        if (!isRelevantChat) return prevMessages;
        
        const isDuplicate = prevMessages.some(msg => msg._id === message._id);
        if (isDuplicate) return prevMessages;

        return [...prevMessages, {
          _id: message._id,
          sender: message.sender,
          message: message.text,
          createdAt: message.createdAt
        }];
      });
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [selectedUser]);

  return (
    <div className="h-screen bg-gray-100 flex flex-col md:flex-row">
      <div className={`${
        selectedUser && !showUserList ? 'hidden md:block' : 'block'
      } w-full md:w-1/3 p-4 border-r`}>
        <Search onSelectUser={handleSelectUser} />
      </div>

      <div className={`${
        !selectedUser || showUserList ? 'hidden' : 'block'
      } w-full md:block md:w-2/3 p-4 flex flex-col h-screen`}>
        {selectedUser ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setShowUserList(true)}
                className="md:hidden bg-gray-200 p-2 rounded"
              >
                ←
              </button>
              <h2 className="text-lg font-bold">{selectedUser.username}</h2>
            </div>
            <ChatBox 
              socket={socket}
              selectedUser={selectedUser}
              messages={messages}
              setMessages={setMessages}
            />
          </>
        ) : (
          <p className="text-gray-500 text-center">Select a user to start chatting</p>
        )}
      </div>
    </div>
  );
}

export default Chat;
