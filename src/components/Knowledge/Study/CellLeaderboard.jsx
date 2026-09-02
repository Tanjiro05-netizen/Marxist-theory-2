import React, { useState, useEffect } from 'react';
import { Users, Trophy, Crown, Plus, UserPlus } from 'lucide-react';
import { studyApiService } from '../api/study';

const CellLeaderboard = ({ userId, userCell, onCellChange }) => {
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newCellName, setNewCellName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCells();
  }, []);

  const fetchCells = async () => {
    setLoading(true);
    try {
      const data = await studyApiService.getCellLeaderboard(10);
      setCells(data);
    } catch (err) {
      console.error('Error fetching cells:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCell = async () => {
    if (!newCellName.trim() || creating) return;
    
    setCreating(true);
    try {
      await studyApiService.createCell(userId, newCellName.trim());
      setShowCreateModal(false);
      setNewCellName('');
      fetchCells();
      onCellChange?.();
    } catch (err) {
      console.error('Error creating cell:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinCell = async (cellId) => {
    try {
      await studyApiService.joinCell(userId, cellId);
      setShowJoinModal(false);
      fetchCells();
      onCellChange?.();
    } catch (err) {
      console.error('Error joining cell:', err);
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-4 h-4 text-yellow-400" />;
    if (index === 1) return <Trophy className="w-4 h-4 text-slate-300" />;
    if (index === 2) return <Trophy className="w-4 h-4 text-amber-600" />;
    return <span className="text-xs text-slate-500 w-4 text-center">{index + 1}</span>;
  };

  return (
    <div className="bg-[#10131b] border border-white/[0.06] rounded-none overflow-hidden font-[Outfit,sans-serif]">
      {/* Header */}
      <div className="border-b border-white/[0.05] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={13} className="text-white/30" />
          <span className="font-[JetBrains_Mono,monospace] text-[10px] uppercase tracking-[0.1em] text-white/40">Cell Leaderboard</span>
        </div>
        <span className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-wider text-white/15">Weekly</span>
      </div>

      {/* Leaderboard List */}
      <div className="divide-y divide-white/[0.04]">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-4 h-4 bg-white/[0.06] rounded" />
                <div className="flex-1 h-3 bg-white/[0.06] rounded" />
                <div className="w-10 h-3 bg-white/[0.06] rounded" />
              </div>
            ))}
          </div>
        ) : cells.length === 0 ? (
          <div className="p-6 text-center text-white/20 text-[12px]">
            No cells yet. Be the first to create one!
          </div>
        ) : (
          cells.map((cell, index) => {
            const isUserCell = userCell?.id === cell.id;
            const memberCount = cell.members?.length || 0;
            return (
              <div
                key={cell.id}
                className={`px-4 py-3 flex items-center gap-3 transition-colors ${
                  isUserCell ? 'bg-[rgba(179, 18, 46,0.05)]' : 'hover:bg-white/[0.02]'
                }`}
              >
                <div className="w-5 flex items-center justify-center shrink-0">
                  {getRankIcon(index)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[12px] font-medium truncate ${
                      isUserCell ? 'text-[#b3122e]' : 'text-white/70'
                    }`}>
                      {cell.name}
                    </span>
                    {isUserCell && (
                      <span className="font-[JetBrains_Mono,monospace] text-[8px] bg-[rgba(179, 18, 46,0.15)] text-[#b3122e] px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        You
                      </span>
                    )}
                  </div>
                  <div className="font-[JetBrains_Mono,monospace] text-[9px] text-white/15 flex items-center gap-1 mt-0.5">
                    <Users size={9} />{memberCount}/5
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-[JetBrains_Mono,monospace] text-[12px] font-bold text-white/60">
                    {(cell.weekly_xp || 0).toLocaleString()}
                  </div>
                  <div className="font-[JetBrains_Mono,monospace] text-[8px] text-white/15 uppercase">XP</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Actions */}
      {userId && (
        <div className="border-t border-white/[0.05] p-3 flex gap-2">
          {!userCell ? (
            <>
              <button
                onClick={() => setShowJoinModal(true)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#b3122e] hover:bg-[#d41f3d] text-white py-2 rounded-none font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-wider transition-all"
              >
                <UserPlus size={12} /> Join
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white/50 py-2 rounded-none font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-wider transition-all"
              >
                <Plus size={12} /> Create
              </button>
            </>
          ) : (
            <div className="flex-1 text-center font-[JetBrains_Mono,monospace] text-[9px] text-white/25 uppercase tracking-wider">
              Member of <span className="text-[#b3122e]">{userCell.name}</span>
            </div>
          )}
        </div>
      )}

      {/* Create Cell Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#0b0d12]/90 backdrop-blur flex items-center justify-center z-50 p-4">
          <div className="bg-[#10131b] border border-white/[0.08] rounded-none p-6 max-w-sm w-full space-y-4">
            <h3 className="font-[Cormorant_Garamond,Georgia,serif] text-[20px] font-[500] text-white">Create New Cell</h3>
            <input
              type="text"
              placeholder="Cell name..."
              value={newCellName}
              onChange={(e) => setNewCellName(e.target.value)}
              className="w-full p-3 bg-white/[0.04] border border-white/[0.08] rounded-none text-white placeholder-white/20 focus:outline-none focus:border-[rgba(179, 18, 46,0.4)] text-[13px] transition-colors"
              maxLength={30}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white/50 rounded-none font-[JetBrains_Mono,monospace] text-[10px] uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCell}
                disabled={!newCellName.trim() || creating}
                className="flex-1 py-2.5 bg-[#b3122e] hover:bg-[#d41f3d] disabled:bg-white/[0.05] disabled:text-white/20 text-white rounded-none font-[JetBrains_Mono,monospace] text-[10px] uppercase tracking-wider transition-all"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Cell Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-[#0b0d12]/90 backdrop-blur flex items-center justify-center z-50 p-4">
          <div className="bg-[#10131b] border border-white/[0.08] rounded-none p-6 max-w-sm w-full space-y-4">
            <h3 className="font-[Cormorant_Garamond,Georgia,serif] text-[20px] font-[500] text-white">Join a Cell</h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {cells.filter(c => (c.members?.length || 0) < 5).map(cell => (
                <button
                  key={cell.id}
                  onClick={() => handleJoinCell(cell.id)}
                  className="w-full p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] rounded-none text-left transition-all"
                >
                  <div className="text-white/70 text-[13px] font-medium">{cell.name}</div>
                  <div className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25 mt-0.5">
                    {cell.members?.length || 0}/5 · {cell.weekly_xp || 0} XP
                  </div>
                </button>
              ))}
              {cells.filter(c => (c.members?.length || 0) < 5).length === 0 && (
                <p className="text-white/25 text-[12px] text-center py-4">
                  All cells are full. Create a new one!
                </p>
              )}
            </div>
            <button
              onClick={() => setShowJoinModal(false)}
              className="w-full py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white/40 rounded-none font-[JetBrains_Mono,monospace] text-[10px] uppercase tracking-wider transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CellLeaderboard;
