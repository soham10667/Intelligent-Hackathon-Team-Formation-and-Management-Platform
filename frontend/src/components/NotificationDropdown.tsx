import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, UserPlus, Users, Award, ShieldAlert } from 'lucide-react';
import { NotificationItem } from '../types';
import { api } from '../services/api';
import { wsService } from '../services/websocket';

interface Props {
  onClose: () => void;
  setUnreadCount: (count: number) => void;
}

export const NotificationDropdown: React.FC<Props> = ({ onClose, setUnreadCount }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
      const unread = data.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.warn('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Listen to real-time incoming notifications
    const unsub = wsService.on('new_notification', (msg: any) => {
      setNotifications((prev) => [msg.data, ...prev]);
      setUnreadCount(notifications.filter((n) => !n.is_read).length + 1);
    });

    return () => unsub();
  }, []);

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_join_request':
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case 'join_request_accepted':
        return <Award className="w-4 h-4 text-emerald-600" />;
      case 'join_request_rejected':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      default:
        return <Users className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-sm text-slate-800">Notifications</span>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No new notifications</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3.5 flex gap-3 items-start transition-colors ${
                !n.is_read ? 'bg-blue-50/40' : 'hover:bg-slate-50'
              }`}
            >
              <div className="p-2 rounded-xl bg-white shadow-sm border border-slate-100 mt-0.5">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{n.title}</p>
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
