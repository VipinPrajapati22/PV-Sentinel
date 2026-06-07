import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

/**
 * Retrieves all notifications for the authenticated user, ordered by creation date.
 */
export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(notifications);
  } catch (error: any) {
    console.error('getNotifications error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/**
 * Marks a notification as read.
 */
export async function markAsRead(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('markAsRead error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
