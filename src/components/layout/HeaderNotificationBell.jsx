'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';

export function HeaderNotificationBell({ user, profile }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;

    const supabase = createClient();
    let cancelled = false;

    // Fetch notifications list
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!cancelled && !error && data) {
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.read).length);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchNotifications();

    // Unique channel per component instance to prevent duplicate subscribe error
    const instanceId = Math.random().toString(36).substring(2, 9);
    const channelName = `notifications_${user.id}_${instanceId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (!cancelled && payload.new) {
            setNotifications((prev) => [payload.new, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Click outside listener to close dropdown
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!user) return null;

  const handleMarkAllAsRead = async () => {
    try {
      const supabase = createClient();
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        const supabase = createClient();
        await supabase.from('notifications').update({ read: true }).eq('id', notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error updating notification read status:', err);
      }
    }
    setIsOpen(false);
    if (notif.action_url) {
      router.push(notif.action_url);
    }
  };

  const getPriorityBadgeStyle = (priority) => {
    switch (priority) {
      case 'URGENT':
      case 'ACTION REQUIRED':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
      case 'HIGH':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' };
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div style={{ position: 'relative' }} ref={popoverRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: isOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          border: '1px solid var(--hairline-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--ink)',
          position: 'relative',
          transition: 'all 0.2s ease',
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              backgroundColor: '#EF4444',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              borderRadius: '999px',
              minWidth: '18px',
              height: '18px',
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--canvas)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '48px',
            width: '360px',
            maxHeight: '480px',
            backgroundColor: 'var(--canvas)',
            border: '1px solid var(--hairline)',
            borderRadius: '16px',
            boxShadow: '0 16px 32px rgba(0, 0, 0, 0.2)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeInDown 0.2s ease-out',
          }}
        >
          <style>{`
            @keyframes fadeInDown {
              from { opacity: 0; transform: translateY(-8px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--hairline-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>
                Notifications
              </h4>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--brand-green)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-teal-mid)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Check size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* Feed */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-soft)', fontSize: '13px' }}>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div
                style={{
                  padding: '40px 16px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.45,
                }}
              >
                <img
                  src="/sleep.svg"
                  alt="All quiet"
                  style={{
                    width: '56px',
                    height: '56px',
                    marginBottom: '12px',
                    filter: 'grayscale(100%)',
                  }}
                />
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                  Chill ScenezZz
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const badge = getPriorityBadgeStyle(notif.priority);
                const isUnread = !notif.read;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      padding: '12px 16px',
                      cursor: notif.action_url ? 'pointer' : 'default',
                      backgroundColor: isUnread ? 'rgba(16, 185, 129, 0.07)' : 'transparent',
                      borderLeft: isUnread ? '3px solid var(--brand-green)' : '3px solid transparent',
                      borderBottom: '1px solid var(--hairline-soft)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: badge.border,
                          textTransform: 'uppercase',
                        }}
                      >
                        {notif.priority || 'INFO'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                        {formatTimeAgo(notif.created_at)}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: isUnread ? 600 : 500, color: 'var(--ink)', marginBottom: '2px' }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--ink-soft)', lineHeight: '1.4' }}>
                      {notif.message}
                    </div>
                    {notif.action_url && (
                      <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--brand-green)', fontWeight: 600 }}>
                        <span>View Details</span>
                        <ExternalLink size={12} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
