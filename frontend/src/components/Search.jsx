import React, { useState } from 'react';
import axios from 'axios';
import backendlink from '../backendlink.js';

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
    <div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search users"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-4 py-2 rounded whitespace-nowrap"
        >
          Search
        </button>
      </div>
      <ul>
        {users.map((user) => (
          <li
            key={user._id}
            onClick={() => onSelectUser(user)}
            className="p-2 border rounded my-2 cursor-pointer hover:bg-gray-200"
          >
            {user.username}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Search; 