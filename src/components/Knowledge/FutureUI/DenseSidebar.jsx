import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Flame, 
  Video, 
  FileText, 
  Radio, 
  Globe, 
  Star,
  Edit3,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import { knowledgeApiService } from '../api';

const TOPIC_COLORS = {
  'Marxist Theory': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/20' },
  'Economics': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/20' },
  'History': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/20' },
  'Philosophy': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/20' },
  'Politics': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/20' },
  'Science': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  'Technology': { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  'default': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/20' },
};

const DenseSidebar = ({ activeItem = 'Feed', onNavigate, userId }) => {
  const [counts, setCounts] = useState({ hotList: 0, favorites: 0 });
  const [followedTopics, setFollowedTopics] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sidebarCounts, topics] = await Promise.all([
          knowledgeApiService.getSidebarCounts(userId),
          userId ? knowledgeApiService.getUserFollowedTopicsWithDetails(userId) : []
        ]);
        setCounts(sidebarCounts);
        setFollowedTopics(topics);
      } catch (err) {
        console.error('Error fetching sidebar data:', err);
      }
    };
    fetchData();
  }, [userId]);

  const menuItems = [
    { label: 'Feed', icon: BookOpen, key: 'feed', count: '' },
    { label: 'Hot List', icon: Flame, key: 'hot', count: counts.hotList > 0 ? counts.hotList.toString() : '' },
    { label: 'Video', icon: Video, key: 'video', count: '', disabled: true },
    { label: 'Columns', icon: FileText, key: 'columns', count: '', disabled: true },
    { label: 'Live', icon: Radio, key: 'live', count: '', live: true, disabled: true },
    { label: 'Circles', icon: Globe, key: 'circles', count: '', disabled: true },
    { label: 'Favorites', icon: Star, key: 'favorites', count: counts.favorites > 0 ? counts.favorites.toString() : '' },
  ];

  const handleItemClick = (key) => {
    if (onNavigate) {
      onNavigate(key);
    }
  };

  const getTopicColor = (topicName) => {
    return TOPIC_COLORS[topicName] || TOPIC_COLORS.default;
  };

  return (
    <>
      {/* Nav items */}
      <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-2 space-y-0.5">
        {menuItems.map((item, idx) => (
          <div
            key={idx}
            onClick={() => !item.disabled && handleItemClick(item.key)}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-medium transition-all ${
              item.disabled
                ? 'text-white/20 cursor-not-allowed'
                : 'cursor-pointer hover:bg-white/[0.05]'
            } ${
              activeItem === item.key && !item.disabled
                ? 'text-[#c81e1e] bg-[rgba(200,30,30,0.1)]'
                : item.disabled ? '' : 'text-white/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <item.icon className={`w-3.5 h-3.5 ${
                activeItem === item.key && !item.disabled ? 'text-[#c81e1e]' :
                item.live && !item.disabled ? 'text-[#c81e1e] animate-pulse' : ''
              }`} />
              <span className="font-[Hanken_Grotesk,sans-serif]">{item.label}</span>
              {item.disabled && <Lock className="w-2.5 h-2.5 text-white/15" />}
            </div>
            {item.count && (
              <span className="font-[JetBrains_Mono,monospace] text-[9px] bg-white/[0.06] px-1.5 py-0.5 rounded-full text-white/30">
                {item.count}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Shortcuts */}
      <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/[0.06]">
          <span className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.12em] text-white/30">
            My Shortcuts
          </span>
          <Edit3 className="w-3 h-3 text-white/20 cursor-pointer hover:text-white/60 transition-colors" />
        </div>
        <div className="space-y-1.5">
          {followedTopics.length > 0 ? (
            followedTopics.map(topic => {
              const colors = getTopicColor(topic.name);
              return (
                <Link
                  key={topic.id}
                  href={`/knowledge?topic=${topic.slug}`}
                  className="flex items-center gap-2 text-[11px] text-white/40 hover:text-white transition-colors group"
                >
                  <div className={`w-4 h-4 ${colors.bg} rounded flex items-center justify-center text-[8px] ${colors.text} border ${colors.border} shrink-0`}>
                    {topic.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{topic.name}</span>
                </Link>
              );
            })
          ) : (
            <div className="text-[10px] text-white/20 py-1 font-[Hanken_Grotesk,sans-serif]">
              Follow topics to add shortcuts
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DenseSidebar;
