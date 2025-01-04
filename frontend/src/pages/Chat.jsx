import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import backendlink from '../backendlink.js';
import Search from '../components/Search';
import ChatBox from '../components/ChatBox';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import MobileSearchSheet from '../components/MobileSearchSheet';
import UserHistory from '@/components/UserHistory.jsx';

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
  const [sheetOpen, setSheetOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/');

    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(`${backendlink}/user/${localStorage.getItem('userId')}`);
        setCurrentUser(res.data);
      } catch (err) {
        console.error('Error fetching current user:', err.message);
      }
    };

    fetchCurrentUser();
  }, [navigate]);

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
    setSheetOpen(false);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/');
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
    <div className="h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MobileSearchSheet 
            open={sheetOpen} 
            onOpenChange={setSheetOpen} 
            onSelectUser={handleSelectUser} 
          />
          <h1 className="font-semibold">Chat App</h1>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout} 
            className="group relative p-2 overflow-hidden flex items-center gap-2 transition-all duration-700 hover:w-32 hover:bg-red-500 hover:text-white"
          >
            <span className="absolute left-2 opacity-0 group-hover:opacity-100">Logout</span>
            <LogOut className="h-5 w-5 ml-auto" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="h-[calc(100vh-3.5rem)] flex">
        <div className="hidden md:block w-[300px] border-r p-4">
          <Search onSelectUser={handleSelectUser} />
        </div>

        <div className="flex-1">
          {selectedUser ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between border-b p-2">
                <h2 className="font-semibold">{selectedUser.username}</h2>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="flex" 
                  onClick={()=>setSelectedUser(null)}
                  >
                    <ArrowLeft/>
                </Button>
              </div>
              <div className="flex-1">
                <ChatBox
                  socket={socket}
                  selectedUser={selectedUser}
                  messages={messages}
                  setMessages={setMessages}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex ">
              

            {/*THIS IS WHERE ALL THE PEOPLE YOU HAVE DMD DISPLAY*/}
            <UserHistory currentUser={currentUser} onSelectUser={handleSelectUser} />


            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
