'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/store';
import { MessageCircle, Send, ChevronDown, ChevronUp } from 'lucide-react';

interface CommentSectionProps {
  nodeId: string;
  storyId: string;
}

export default function CommentSection({ nodeId, storyId }: CommentSectionProps) {
  const { comments, addComment, user } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState('');

  const nodeComments = comments.filter(c => c.nodeId === nodeId);
  const commentCount = nodeComments.length;

  const handleSubmit = () => {
    if (!newComment.trim() || !user) return;
    
    addComment({
      id: `c${Date.now()}`,
      content: newComment,
      author: user.username,
      authorAvatar: user.avatar,
      nodeId,
      storyId,
      createdAt: new Date().toISOString(),
    });
    setNewComment('');
  };

  return (
    <div className="mt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        {commentCount} {commentCount === 1 ? 'comentário' : 'comentários'}
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-3"
          >
            {/* Comment input */}
            {user && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs flex-shrink-0">
                  {user.avatar}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="Escreva um comentário..."
                    className="flex-1 px-3 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!newComment.trim()}
                    className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 disabled:opacity-30 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Comments list */}
            {nodeComments.map((comment, i) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] flex-shrink-0">
                  {comment.authorAvatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-300">{comment.author}</span>
                    <span className="text-[10px] text-zinc-600">
                      {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">{comment.content}</p>
                </div>
              </motion.div>
            ))}

            {nodeComments.length === 0 && (
              <p className="text-xs text-zinc-600 text-center py-2">
                Nenhum comentário ainda. Seja o primeiro!
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
