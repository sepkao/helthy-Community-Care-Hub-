import { Hono } from 'hono';
import type { Bindings, User, JwtPayload } from '../types';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';

const auth = new Hono<{ Bindings: Bindings, Variables: { user: JwtPayload } }>();

/**
 * POST /auth/register
 * สมัครสมาชิกใหม่ (caregiver หรือ guardian)
 */
auth.post('/register', async (c) => {
    try {
        const { email, password } = await c.req.json();

        // Validation
        if (!email || !password) {
            return c.json({ message: 'กรุณากรอก email และ password' }, 400);
        }

        // บังคับ role เป็น guardian เท่านั้น
        const userRole = 'guardian';

        if (password.length < 6) {
            return c.json({ message: 'password ต้องมีอย่างน้อย 6 ตัวอักษร' }, 400);
        }

        // ตรวจสอบว่ามี email นี้ในระบบแล้วหรือยัง
        const existingUser = await c.env.carehub_db
            .prepare('SELECT id FROM users WHERE email = ?')
            .bind(email)
            .first<{ id: number }>();

        if (existingUser) {
            return c.json({ message: 'email นี้ถูกใช้งานแล้ว' }, 409);
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // บันทึกข้อมูลลง D1 database
        const result = await c.env.carehub_db
            .prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)')
            .bind(email, passwordHash, userRole)
            .run();

        if (!result.success) {
            return c.json({ message: 'ไม่สามารถสร้างบัญชีได้' }, 500);
        }

        // ดึงข้อมูล user ที่เพิ่งสร้าง
        const user = await c.env.carehub_db
            .prepare('SELECT id, email, role, created_at FROM users WHERE email = ?')
            .bind(email)
            .first<User>();

        if (!user) {
            return c.json({ message: 'ไม่สามารถสร้างบัญชีได้' }, 500);
        }

        // สร้าง JWT token
        const token = generateToken(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
            },
            c.env.JWT_SECRET
        );

        return c.json({
            message: 'สมัครสมาชิกสำเร็จ',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
            },
        }, 201);
    } catch (error) {
        console.error('Register error:', error);
        return c.json({ message: 'เกิดข้อผิดพลาด' }, 500);
    }
});

/**
 * POST /auth/login
 * เข้าสู่ระบบด้วย email และ password
 */
auth.post('/login', async (c) => {
    try {
        const { email, password } = await c.req.json();

        // Validation
        if (!email || !password) {
            return c.json({ message: 'กรุณากรอก email และ password' }, 400);
        }

        // ดึงข้อมูล user จาก database
        const user = await c.env.carehub_db
            .prepare('SELECT * FROM users WHERE email = ?')
            .bind(email)
            .first<User>();

        if (!user) {
            return c.json({ message: 'email หรือ password ไม่ถูกต้อง' }, 401);
        }

        // ตรวจสอบ password
        const isValidPassword = await verifyPassword(password, user.password_hash);

        if (!isValidPassword) {
            return c.json({ message: 'email หรือ password ไม่ถูกต้อง' }, 401);
        }

        // สร้าง JWT token
        const token = generateToken(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
            },
            c.env.JWT_SECRET
        );

        return c.json({
            message: 'เข้าสู่ระบบสำเร็จ',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return c.json({ message: 'เกิดข้อผิดพลาด' }, 500);
    }
});

/**
 * GET /auth/users
 * ดึงรายชื่อ users ทั้งหมด (สำหรับเลือก Guardian)
 * TODO: ควรมี middleware ตรวจสอบว่าเป็น admin/caregiver
 */
auth.get('/users', async (c) => {
    try {
        const users = await c.env.carehub_db
            .prepare('SELECT id, email, role FROM users WHERE role = ?')
            .bind('guardian')
            .all<User>();

        return c.json({
            success: true,
            data: users.results
        });
    } catch (error) {
        console.error('Get users error:', error);
        return c.json({ success: false, message: 'เกิดข้อผิดพลาด' }, 500);
    }
});

/**
 * GET /auth/me
 * ดึงข้อมูล user ปัจจุบันจาก token
 */
auth.get('/me', async (c) => {
    try {
        const user = c.get('user'); // ได้จาก jwt middleware (ต้องมี middleware ก่อน)
        if (!user) {
            return c.json({ success: false, message: 'Unauthorized' }, 401);
        }

        // ดึงข้อมูลล่าสุดจาก DB เพื่อความชัวร์
        const dbUser = await c.env.carehub_db
            .prepare('SELECT id, email, role FROM users WHERE id = ?')
            .bind(user.userId)
            .first<User>();

        if (!dbUser) {
            return c.json({ success: false, message: 'User not found' }, 404);
        }

        return c.json({
            success: true,
            user: dbUser
        });
    } catch (error) {
        console.error('Get me error:', error);
        return c.json({ success: false, message: 'เกิดข้อผิดพลาด' }, 500);
    }
});

export default auth;
