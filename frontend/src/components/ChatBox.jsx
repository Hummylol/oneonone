import React, { useState, useEffect } from 'react';
import axios from 'axios';
import backendlink from '../backendlink.js';

function ChatBox({ socket, selectedUser, messages, setMessages }) {
  const [newMessage, setNewMessage] = useState('');
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, messageId: null, isSender: false });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const messageData = {
      senderId: localStorage.getItem('userId'),
      receiverId: selectedUser._id,
      text: newMessage.trim(),
    };

    socket.emit('send_message', messageData);
    setNewMessage('');
  };

  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    const isSender = msg.sender === localStorage.getItem('userId');
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      messageId: msg._id,
      message: msg.message,
      isSender
    });
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(contextMenu.message);
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleDeleteMessage = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await axios.delete(
        `${backendlink}/user/message/${contextMenu.messageId}`,
        { params: { userId: userId } }
      );
      
      if (response.status === 200) {
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg._id !== contextMenu.messageId)
        );
        setContextMenu({ ...contextMenu, visible: false });
      }
    } catch (err) {
      let errorMessage = err.response?.data?.error || 'Unknown error';
      alert('Failed to delete message: ' + errorMessage);
    }
  };

  useEffect(() => {
    const handleClick = () => setContextMenu({ ...contextMenu, visible: false });
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      <div className="flex-1 overflow-y-scroll border p-4 flex flex-col space-y-2">
        {messages.map((msg) => (
          <p
            key={msg._id}
            onContextMenu={(e) => handleContextMenu(e, msg)}
            className={`p-2 rounded ${
              msg.sender === localStorage.getItem('userId')
                ? 'bg-blue-500 text-white self-end'
                : 'bg-gray-200 text-black self-start'
            }`}
          >
            {msg.message}
          </p>
        ))}
        
        {contextMenu.visible && (
          <div 
            className="fixed bg-white shadow-lg border rounded-lg py-2 z-50"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button 
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={handleCopyText}
            >
              Copy Text
            </button>
            {contextMenu.isSender && (
              <button 
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
                onClick={handleDeleteMessage}
              >
                Delete Message
              </button>
            )}
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 p-2 border rounded"
            placeholder="Type a message"
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded whitespace-nowrap"
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}

export default ChatBox; 