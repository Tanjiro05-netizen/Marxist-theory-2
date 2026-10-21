import React from 'react';
import { 
  ChevronUp, 
  MessageSquare, 
  Star, 
  Eye, 
  MoreHorizontal, 
  Flame,
  CheckCircle,
  Award,
  User,
  Plus,
  Check
} from 'lucide-react';
import Link from 'next/link';

const FeedCard = ({ item, isFollowing, onToggleFollow, onVote, isFavorited, onToggleFavorite }) => {
  // Determine if it's an ad or promoted content
  const isAd = item.type === 'promoted';
  
  // Format numbers for dense display (e.g. 12543 -> 12.5k)
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <div className={`bg-[#10131b] border rounded-none p-5 transition-all group relative shadow-[0_2px_16px_rgba(0,0,0,0.25)] ${
      isAd
        ? 'border-[rgba(200,160,30,0.15)] bg-[rgba(200,160,30,0.03)]'
        : 'border-white/[0.06] hover:bg-[rgba(179, 18, 46,0.03)] hover:border-[rgba(179, 18, 46,0.16)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.35)]'
    }`}>

      {isAd && (
        <span className="absolute top-3 right-3 font-[JetBrains_Mono,monospace] text-[9px] text-white/20 border border-white/[0.06] px-1.5 py-0.5 rounded-full uppercase tracking-wider">
          Ad
        </span>
      )}

      {/* Author row */}
      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        {!isAd && (
          <div className="flex items-center gap-1.5">
            {item.author?.avatar_url ? (
              <img src={item.author.avatar_url} className="w-5 h-5 rounded-full bg-white/[0.06]" alt={item.author.username} />
            ) : (
              <div className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center">
                <User size={10} className="text-white/30" />
              </div>
            )}
            <Link href={`/profile/${item.author?.username}`}
              className="text-[11px] font-medium text-white/70 hover:text-[#b3122e] transition-colors font-[Outfit,sans-serif]"
            >
              {item.author?.username || 'Anonymous'}
            </Link>
            {item.author?.role && (
              <span className="text-[10px] text-white/25 truncate max-w-[100px] font-[Outfit,sans-serif]">{item.author.role}</span>
            )}
          </div>
        )}

        {item.author?.is_certified && (
          <span className="font-[JetBrains_Mono,monospace] text-[9px] bg-[rgba(179, 18, 46,0.1)] text-[#b3122e] px-1.5 py-0.5 rounded-full border border-[rgba(179, 18, 46,0.2)] flex items-center gap-0.5">
            <Award size={8} /> Certified
          </span>
        )}

        <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/20">
          {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* Title */}
      <Link href={`/knowledge/question/${item.id}`}>
        <h2 className="text-sm md:text-[15px] font-semibold text-white/90 leading-snug mb-2 group-hover:text-[#b3122e] transition-colors flex items-start gap-2 font-[Outfit,sans-serif]">
          <span className={`shrink-0 font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-0.5 border ${
            item.type === 'question'
              ? 'text-[#b3122e] border-[rgba(179, 18, 46,0.28)] bg-[rgba(179, 18, 46,0.08)]'
              : 'text-white/30 border-white/[0.1] bg-white/[0.04]'
          }`}>
            {item.type === 'question' ? 'Q' : isAd ? 'AD' : 'A'}
          </span>
          {item.is_answered && (
            <CheckCircle size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
          )}
          {item.title}
        </h2>
      </Link>

      {/* Excerpt */}
      <div className="flex gap-3 mb-3">
        {item.hasImage && (
          <div className="w-20 h-14 shrink-0 rounded-none overflow-hidden border border-white/[0.06] bg-white/[0.04]">
            <img src={item.imageUrl} className="w-full h-full object-cover" alt="content" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-white/35 leading-relaxed line-clamp-2 md:line-clamp-3 font-[Outfit,sans-serif] font-[300]">
            {item.content || item.excerpt}
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between mt-1 pt-2.5 border-t border-white/[0.04]">
        <div className="flex items-center gap-3">
          <button
            onClick={e => { e.preventDefault(); onVote?.(item.id); }}
            className="flex items-center gap-1 bg-[rgba(179, 18, 46,0.08)] text-[#b3122e] px-2.5 py-1 rounded-full text-[11px] font-[JetBrains_Mono,monospace] border border-[rgba(179, 18, 46,0.2)] hover:bg-[rgba(179, 18, 46,0.16)] transition-colors"
          >
            <ChevronUp className="w-3 h-3" /> {formatNumber(item.upvote_count || item.votes)}
          </button>
          <button className="flex items-center gap-1 text-white/30 hover:text-white/70 text-[11px] font-[JetBrains_Mono,monospace] transition-colors">
            <MessageSquare className="w-3 h-3" /> {formatNumber(item.answer_count || item.comments)}
          </button>
          <button
            onClick={e => { e.preventDefault(); onToggleFavorite?.(item.id); }}
            className={`hidden sm:flex items-center gap-1 text-[11px] font-[JetBrains_Mono,monospace] transition-colors ${
              isFavorited?.(item.id)
                ? 'text-amber-400 hover:text-amber-300'
                : 'text-white/30 hover:text-white/70'
            }`}
          >
            <Star className={`w-3 h-3 ${isFavorited?.(item.id) ? 'fill-amber-400' : ''}`} />
            {isFavorited?.(item.id) ? 'Saved' : 'Save'}
          </button>
          {(item.view_count || item.views) ? (
            <span className="flex items-center gap-1 font-[JetBrains_Mono,monospace] text-[9px] text-white/20">
              <Eye className="w-3 h-3" /> {formatNumber(item.view_count || item.views)}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {item.topic && onToggleFollow ? (
            <button
              onClick={(e) => { e.preventDefault(); onToggleFollow(item.topic.id); }}
              title={isFollowing?.(item.topic.id) ? 'Unfollow topic' : 'Follow topic'}
              className={`flex items-center gap-0.5 font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors ${
                isFollowing?.(item.topic.id)
                  ? 'bg-[rgba(179, 18, 46,0.1)] text-[#b3122e] border-[rgba(179, 18, 46,0.2)] hover:bg-[rgba(179, 18, 46,0.2)]'
                  : 'bg-white/[0.04] text-white/30 border-white/[0.06] hover:border-white/[0.16] hover:text-white/60'
              }`}
            >
              {isFollowing?.(item.topic.id)
                ? <><Check className="w-2 h-2" />{item.topic.name}</>
                : <><Plus className="w-2 h-2" />{item.topic.name}</>
              }
            </button>
          ) : item.topic ? (
            <span className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-wider px-2 py-0.5 bg-white/[0.04] rounded-full text-white/25 border border-white/[0.06]">
              {item.topic.name}
            </span>
          ) : null}
          <MoreHorizontal className="w-3.5 h-3.5 text-white/20 hover:text-white/50 cursor-pointer transition-colors" />
        </div>
      </div>

      {/* Hot comment */}
      {!isAd && item.hot_comment && (
        <div className="mt-3 bg-white/[0.02] border border-white/[0.06] p-2.5 rounded-none flex items-center gap-2 text-[10px]">
          <span className="text-[#b3122e] font-[JetBrains_Mono,monospace] uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Flame className="w-2.5 h-2.5" /> Hot
          </span>
          <span className="text-white/30 truncate font-[Outfit,sans-serif]">{item.hot_comment}</span>
        </div>
      )}
    </div>
  );
};

export default FeedCard;
