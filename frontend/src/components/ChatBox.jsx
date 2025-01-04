import React, { useState, useEffect, useRef } from 'react';
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
import { MoreVertical, X } from "lucide-react";

function ChatBox({ socket, selectedUser, messages, setMessages }) {
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (replyingTo) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 180);
    }
  }, [replyingTo]);

  useEffect(() => {
    if (!socket) return;

    socket.on('receive_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('message_deleted', (messageId) => {
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    });

    return () => {
      socket.off('receive_message');
      socket.off('message_deleted');
    };
  }, [socket, setMessages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const messageData = {
      senderId: localStorage.getItem('userId'),
      receiverId: selectedUser._id,
      text: newMessage.trim(),
      replyTo: replyingTo ? {
        messageId: replyingTo._id,
        message: replyingTo.message,
        sender: replyingTo.sender
      } : null
    };

    socket.emit('send_message', messageData);
    setNewMessage('');
    setReplyingTo(null);
  };

  const handleReply = (message) => {
    setReplyingTo(message);
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const userId = localStorage.getItem('userId');
      await axios.delete(
        `${backendlink}/user/message/${messageId}`,
        { params: { userId: userId } }
      );
      
      socket.emit('delete_message', {
        messageId,
        userId,
        receiverId: selectedUser._id
      });
      
    } catch (err) {
      let errorMessage = err.response?.data?.error || 'Unknown error';
      alert('Failed to delete message: ' + errorMessage);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <ScrollArea className="flex-1 p-4 h-full overflow-y-auto">
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
                } p-3 flex flex-col gap-2`}>
                  {msg.replyTo && (
                    <div className={`text-sm p-2 rounded-lg ${
                      isSender ? 'bg-primary-foreground/10' : 'bg-background'
                    }  border-primary`}>
                      <p className="text-xs opacity-70">
                        Replying to {msg.replyTo.sender === localStorage.getItem('userId') ? 'yourself' : selectedUser.username}
                      </p>
                      <p className="line-clamp-2">{msg.replyTo.message}</p>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
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
                        <DropdownMenuItem onClick={() => handleReply(msg)}>
                          Reply
                        </DropdownMenuItem>
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
                  </div>
                </Card>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t mt-auto">
        {replyingTo && (
          <div className="mb-2 p-2 rounded-lg bg-muted flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Replying to message</p>
              <p className="text-sm line-clamp-1">{replyingTo.message}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setReplyingTo(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
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