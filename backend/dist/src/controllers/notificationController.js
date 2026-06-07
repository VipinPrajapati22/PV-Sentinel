"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.markAsRead = markAsRead;
const prisma_1 = __importDefault(require("../utils/prisma"));
/**
 * Retrieves all notifications for the authenticated user, ordered by creation date.
 */
async function getNotifications(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const notifications = await prisma_1.default.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json(notifications);
    }
    catch (error) {
        console.error('getNotifications error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
/**
 * Marks a notification as read.
 */
async function markAsRead(req, res) {
    try {
        const id = String(req.params.id);
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const notification = await prisma_1.default.notification.findFirst({
            where: { id, userId }
        });
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        const updated = await prisma_1.default.notification.update({
            where: { id },
            data: { read: true }
        });
        return res.status(200).json(updated);
    }
    catch (error) {
        console.error('markAsRead error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
