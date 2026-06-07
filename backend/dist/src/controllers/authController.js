"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.register = register;
exports.getMe = getMe;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-pharmacovigilance-platform';
/**
 * Log in a user and issue a JWT token.
 */
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { email },
            include: { role: true }
        });
        if (!user || !user.active) {
            return res.status(401).json({ error: 'Invalid credentials or inactive account' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Sign JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role.name }, JWT_SECRET, { expiresIn: '24h' });
        // Create Audit Log
        await prisma_1.default.auditLog.create({
            data: {
                userId: user.id,
                action: 'Login',
                resource: 'User',
                resourceId: user.id,
                details: `User logged in successfully: ${user.email}`,
                ipAddress: req.ip
            }
        });
        return res.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role.name
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
/**
 * Register a new user (restricted to Admin).
 */
async function register(req, res) {
    try {
        const { email, password, firstName, lastName, roleName } = req.body;
        if (!email || !password || !firstName || !lastName || !roleName) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        // Check if role exists
        const role = await prisma_1.default.role.findUnique({
            where: { name: roleName }
        });
        if (!role) {
            return res.status(400).json({ error: `Invalid role: ${roleName}` });
        }
        // Check if user exists
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const newUser = await prisma_1.default.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
                roleId: role.id
            },
            include: { role: true }
        });
        // Create Audit Log
        await prisma_1.default.auditLog.create({
            data: {
                userId: req.user?.id,
                action: 'Create User',
                resource: 'User',
                resourceId: newUser.id,
                details: `Registered user: ${newUser.email} with role ${roleName}`,
                ipAddress: req.ip
            }
        });
        return res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: newUser.role.name
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
/**
 * Get the current user profile.
 */
async function getMe(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            include: { role: true }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role.name
            }
        });
    }
    catch (error) {
        console.error('getMe error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
