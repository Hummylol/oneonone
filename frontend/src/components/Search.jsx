import { useState } from 'react';
import axios from 'axios';
import backendlink from '../backendlink.js';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Search as SearchIcon } from "lucide-react"

function Search({ onSelectUser }) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);

  const handleSearch = async () => {
    try {
      const currentUserId = localStorage.getItem('userId');
      const res = await axios.get(`${backendlink}/user/search/${search}?currentUserId=${currentUserId}`);
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search users"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleSearch} variant="secondary">
          <SearchIcon className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-200px)]">
        {users.map((user) => (
          <Card
            key={user._id}
            onClick={() => onSelectUser(user)}
            className="p-3 mb-2 cursor-pointer hover:bg-accent transition-colors"
          >
            {user.username}
          </Card>
        ))}
      </ScrollArea>
    </div>
  );
}

export default Search; 