import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5000', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  query: { userId: localStorage.getItem('userId') },
});

function Chat() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, messageId: null, isSender: false });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) window.location.href = '/';
    
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/user/${localStorage.getItem('userId')}`);
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

  const handleSearch = async () => {
    try {
      const currentUserId = localStorage.getItem('userId');
      const res = await axios.get(`http://localhost:5000/user/search/${search}?currentUserId=${currentUserId}`);
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err.message);
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    socket.emit('join_room', localStorage.getItem('userId'));

    try {
      const res = await axios.get(
        `http://localhost:5000/user/chats/${localStorage.getItem('userId')}/${user._id}`
      );
      setMessages(res.data);
    } catch (err) {
      console.error('Error fetching chat history:', err.message);
    }
  };

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
        `http://localhost:5000/user/message/${contextMenu.messageId}`,
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
    <div className="h-screen bg-gray-100 flex">
      <div className="w-1/3 p-4 border-r">
        <input
          type="text"
          placeholder="Search users"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white w-full p-2 rounded"
        >
          Search
        </button>
        <ul>
          {users.map((user) => (
            <li
              key={user._id}
              onClick={() => handleSelectUser(user)}
              className="p-2 border rounded my-2 cursor-pointer hover:bg-gray-200"
            >
              {user.username}
            </li>
          ))}
        </ul>
      </div>

      <div className="w-2/3 p-4 flex flex-col">
        {selectedUser ? (
          <>
            <h2 className="text-lg font-bold mb-4">{selectedUser.username}</h2>
            <div className="h-64 overflow-y-scroll border p-4 flex flex-col space-y-2">
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
              
              {/* Context Menu */}
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
            <div className="mt-auto">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full p-2 border rounded mb-2"
                placeholder="Type a message"
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-500 text-white w-full p-2 rounded"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center">Select a user to start chatting</p>
        )}
      </div>
      <div className="absolute bottom-4 left-4 text-gray-600 border-2 p-4 border-black">
        {currentUser ? currentUser.username : 'Loading...'}
      </div>
    </div>
  );
}

export default Chat;
