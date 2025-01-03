import React, { useState, useEffect } from 'react';
import axios from 'axios';
import backendlink from '../backendlink.js';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

function ChatBox({ socket, selectedUser, messages, setMessages }) {
  const [newMessage, setNewMessage] = useState('');

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

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await axios.delete(
        `${backendlink}/user/message/${messageId}`,
        { params: { userId: userId } }
      );
      
      if (response.status === 200) {
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg._id !== messageId)
        );
      }
    } catch (err) {
      let errorMessage = err.response?.data?.error || 'Unknown error';
      alert('Failed to delete message: ' + errorMessage);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isSender = msg.sender === localStorage.getItem('userId');
            return (
              <div
                key={msg._id}
                className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-[80%] ${
                  isSender ? 'bg-primary text-primary-foreground' : 'bg-muted'
                } p-3 flex items-start gap-2`}>
                  <p className="flex-1">{msg.message}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className={`h-5 w-5 ${isSender ? 'text-primary-foreground' : ''}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleCopyText(msg.message)}>
                        Copy Text
                      </DropdownMenuItem>
                      {isSender && (
                        <DropdownMenuItem 
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="text-destructive"
                        >
                          Delete Message
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Card>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
            className="flex-1"
          />
          <Button type="submit">Send</Button>
        </form>
      </div>
    </div>
  );
}

export default ChatBox; 