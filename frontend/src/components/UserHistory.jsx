import React, { useState, useEffect } from 'react';
import axios from 'axios';
import backendlink from '../backendlink.js';
import ServerStatus from './ServerStatus.jsx';

function UserHistory({ currentUser, onSelectUser }) {
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get(
          `${backendlink}/user/chat-history/${localStorage.getItem('userId')}`
        );
        setChatHistory(response.data);
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    };

    if (currentUser) {
      fetchChatHistory();
    }
  }, [currentUser]);

  return (
    <div className="w-full p-4">
      <ServerStatus/>
      <div className="space-y-2">
        {chatHistory.map((user) => (
          <div
            key={user._id}
            className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
            onClick={() => onSelectUser(user)} // Trigger the chatbox open
          >
            {user.username}
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserHistory;
