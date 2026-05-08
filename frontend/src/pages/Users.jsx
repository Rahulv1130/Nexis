import { useState } from 'react';
import {useAuth} from '../context/AuthContext.jsx'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '../services/api.js';
import { FaShieldAlt } from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () => usersAPI.getAll({ search: search || undefined }).then(r => r.data)
  });

  const { mutate: updateRole } = useMutation({
    mutationFn: ({ id, role }) => usersAPI.updateRole(id, role),
    onSuccess: () => {qc.invalidateQueries({ queryKey: ['users'] }); alert("Role Updated Successfully") }
  });

  const { mutate: unban } = useMutation({
    mutationFn: (id) => usersAPI.unban(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] })
  });

  const users = data?.users?.filter(u => u.id !== user?.id) || [];

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-bold text-white">User Management</h1>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="w-full max-w-sm bg-surface-secondary border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent" />

      {isLoading ? (
        <div className="flex justify-center py-12"><ImSpinner2 size={24} className="animate-spin text-accent-light" /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs border-b border-gray-700">
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3 pr-4">Trust Score</th>
                <th className="pb-3 pr-4">Posts</th>
                <th className="pb-3 pr-4">Warnings</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {users.map(u => (
                <tr key={u.id} className="text-gray-300">
                  <td className="py-3 pr-4">
                    <div>
                      <p className="text-white font-medium">{u.username}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <select value={u.role} onChange={e => updateRole({ id: u.id, role: e.target.value })} className="bg-surface border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none">
                      <option value="USER">User</option>
                      <option value="MODERATOR">Moderator</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`text-sm font-mono ${u.trustScore > 70 ? 'text-green-400' : u.trustScore > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {u.trustScore?.toFixed(0)}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">{u._count?.posts || 0}</td>
                  <td className="py-3 pr-4">
                    {u.warningCount > 0 ? <span className="text-orange-400">{u.warningCount}</span> : <span className="text-gray-600">0</span>}
                  </td>
                  <td className="py-3 pr-4">
                    {u.isBanned ? <span className="badge-removed">Banned</span> : <span className="badge-approved">Active</span>}
                  </td>
                  <td className="py-3">
                    {u.isBanned && (
                      <button onClick={() => unban(u.id)} className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors">
                        <FaShieldAlt size={12} /> Unban
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="text-center text-gray-500 py-6">No users found.</p>}
        </div>
      )}
    </div>
  );
}