import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import { notifications } from '../lib/api';

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notifications.list(),
    staleTime: 30_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notifications.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notifications.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items: any[] = data?.notifications || [];

  const TYPE_ICON: Record<string, string> = {
    Signal: '🔴',
    CAPA: '🟠',
    Import: '🟢',
    System: '🔵',
  };

  return (
    <div className="page">
      <div className="page-toolbar">
        <div />
        <button className="btn-secondary" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
          <CheckCheck size={15} /> Mark All Read
        </button>
      </div>

      <div className="panel">
        <div className="panel-header row">
          <div>
            <h3>Notification Center</h3>
            <span>{items.filter((n) => !n.isRead).length} unread</span>
          </div>
          <Bell size={20} />
        </div>

        {isLoading ? (
          <div className="table-empty"><span className="spinner-sm" /> Loading…</div>
        ) : items.length === 0 ? (
          <div className="table-empty">
            <Bell size={36} />
            <p>No notifications yet.</p>
          </div>
        ) : (
          <div className="notification-list">
            {items.map((n: any) => (
              <motion.div
                key={n.id}
                className={`notification-item ${n.isRead ? 'read' : 'unread'}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ backgroundColor: '#f8fafc' }}
              >
                <span className="notif-icon">{TYPE_ICON[n.type] || '📌'}</span>
                <div className="notif-body">
                  <strong>{n.title}</strong>
                  <p>{n.message}</p>
                  <span className="notif-time">
                    <Clock size={11} /> {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                {!n.isRead && (
                  <button
                    className="btn-secondary"
                    onClick={() => markReadMutation.mutate(n.id)}
                    disabled={markReadMutation.isPending}
                  >
                    Mark Read
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
