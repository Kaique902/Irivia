'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Flame, GitBranch, Award, Check, BookOpen } from 'lucide-react';
import { useNotificationStore, Notification } from '@/store/notifications';
import { useStore } from '@/store/store';

const typeIcons: Record<string, any> = {
  vote: Flame,
  branch: GitBranch,
  achievement: Award,
  welcome: Check,
  challenge: Flame,
  story_update: BookOpen,
  story_vote: Flame,
};

const typeColors: Record<string, string> = {
  vote: 'text-orange-400',
  branch: 'text-cyan-400',
  achievement: 'text-yellow-400',
  welcome: 'text-green-400',
  challenge: 'text-purple-400',
  story_update: 'text-blue-400',
  story_vote: 'text-orange-400',
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useStore();
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotificationStore();

  // Filter notifications: show global ones or ones targeted at current user
  const myNotifications = useMemo(() => {
    return notifications.filter(n =>
      !n.targetUsers || (user && n.targetUsers.includes(user.id))
    );
  }, [notifications, user]);

  const count = useMemo(() => myNotifications.filter(n => !n.read).length, [myNotifications]);

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-zinc-800 transition-all"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5 text-zinc-400" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 card z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="font-bold text-sm">Notificações</h3>
                {count > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-orange-400 hover:text-orange-300"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {myNotifications.length === 0 ? (
                  <div className="p-6 text-center text-zinc-500 text-sm">
                    Nenhuma notificação ainda
                  </div>
                ) : (
                  myNotifications.map((notif) => (
                    <NotificationItem
                      key={notif.id}
                      notification={notif}
                      onRead={() => markAsRead(notif.id)}
                      formatTime={formatTime}
                    />
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationItem({ notification, onRead, formatTime }: {
  notification: Notification;
  onRead: () => void;
  formatTime: (date: string) => string;
}) {
  const Icon = typeIcons[notification.type] || Bell;
  const color = typeColors[notification.type] || 'text-zinc-400';

  return (
    <div
      onClick={onRead}
      className={`p-3 hover:bg-zinc-800/50 cursor-pointer transition-colors flex items-start gap-3 ${
        !notification.read ? 'bg-orange-500/5' : ''
      }`}
    >
      <div className={`mt-0.5 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300 leading-relaxed">{notification.message}</p>
        <p className="text-xs text-zinc-600 mt-1">{formatTime(notification.createdAt)}</p>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
      )}
    </div>
  );
}
