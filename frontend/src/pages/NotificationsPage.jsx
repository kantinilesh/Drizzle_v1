import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiGetNotifications, apiMarkNotificationRead } from '../services/api';
import './Notifications.css';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetNotifications().then(setNotifications).finally(() => setLoading(false));
  }, []);

  const handleRead = async (id) => {
    const updated = await apiMarkNotificationRead(id);
    setNotifications(updated);
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="page">
          <h1 className="page-title">Notifications</h1>
          <div className="loading-screen"><div className="spinner" /></div>
        </div>
      </div>
    );
  }

  const unread = notifications.filter(n => !n.is_read);
  const read = notifications.filter(n => n.is_read);

  return (
    <div className="app-container">
      <div className="page">
        <h1 className="page-title">Notifications</h1>

        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <p>No notifications</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          >
            {unread.length > 0 && (
              <>
                <div className="section-header">
                  <span className="section-title">New</span>
                  <span className="notif-count">{unread.length}</span>
                </div>
                {unread.map((notif) => (
                  <motion.div
                    key={notif.id}
                    className="glass-card notif-card notif-unread"
                    variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                    onClick={() => handleRead(notif.id)}
                    id={`notif-${notif.id}`}
                  >
                    <span className="notif-icon">{notif.icon}</span>
                    <div className="notif-content">
                      <p className="notif-title">{notif.title}</p>
                      <p className="notif-message">{notif.message}</p>
                    </div>
                    <span className="notif-dot" />
                  </motion.div>
                ))}
              </>
            )}

            {read.length > 0 && (
              <>
                <div className="section-header" style={{ marginTop: unread.length ? 'var(--space-lg)' : 0 }}>
                  <span className="section-title">Earlier</span>
                </div>
                {read.map((notif) => (
                  <motion.div
                    key={notif.id}
                    className="glass-card notif-card"
                    variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                    id={`notif-${notif.id}`}
                  >
                    <span className="notif-icon">{notif.icon}</span>
                    <div className="notif-content">
                      <p className="notif-title">{notif.title}</p>
                      <p className="notif-message">{notif.message}</p>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
