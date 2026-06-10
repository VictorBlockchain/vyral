'use client';

import { useEffect, useState } from 'react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (searchTerm = '') => {
    setLoading(true);
    try {
      const params = searchTerm ? `?search=${searchTerm}` : '';
      const response = await fetch(`/api/admin/users${params}`);
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(search);
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, isAdmin: !currentStatus }),
      });

      if (response.ok) {
        fetchUsers(search);
      } else {
        alert('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>;
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Manage Users</h1>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by wallet or username..."
            style={{
              padding: '10px 16px',
              border: '2px solid black',
              borderRadius: '8px',
              width: '300px',
              fontSize: '1rem',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              background: 'var(--color-primary)',
              color: 'white',
              border: '2px solid black',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>
      </div>

      <div
        style={{
          background: 'white',
          border: '3px solid black',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '4px 4px 0px black',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0', borderBottom: '2px solid black' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Username</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Wallet Address</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Challenges</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Submissions</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Admin</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '12px', fontWeight: 600 }}>
                  {user.username || 'N/A'}
                </td>
                <td style={{ padding: '12px', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                  {user.walletAddress}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {user.createdChallenges?.[0]?.count || 0}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {user.submissions?.[0]?.count || 0}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background: user.isAdmin ? 'var(--color-success)' : '#999',
                      color: 'white',
                    }}
                  >
                    {user.isAdmin ? 'Yes' : 'No'}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button
                    onClick={() => toggleAdmin(user.id, user.isAdmin)}
                    style={{
                      padding: '6px 12px',
                      background: user.isAdmin ? '#ef4444' : 'var(--color-success)',
                      color: 'white',
                      border: '2px solid black',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
