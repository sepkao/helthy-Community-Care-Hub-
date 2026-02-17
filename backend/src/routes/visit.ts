import { Hono } from 'hono';
import { verifyToken } from '../utils/auth';
import type { Bindings, JwtPayload } from '../types';

const visit = new Hono<{ Bindings: Bindings, Variables: { user: JwtPayload } }>();

// Auth Middleware
visit.use('/*', async (c, next) => {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token) return c.json({ success: false, message: 'Unauthorized' }, 401);

    const payload = verifyToken(token, c.env.JWT_SECRET);
    if (!payload) return c.json({ success: false, message: 'Invalid token' }, 401);

    c.set('user', payload);
    await next();
});

/**
 * GET /visit
 * ดึงรายการเยี่ยมทั้งหมด (หรือกรองตาม guardian)
 */
visit.get('/', async (c) => {
    try {
        const user = c.get('user');
        const search = c.req.query('search') || '';
        const elderlyId = c.req.query('elderly_id');

        let query = `
            SELECT v.id, v.visited_at, v.note, e.full_name as patient_name, u.email as caregiver_name
            FROM visit_logs v
            JOIN elderly e ON v.elderly_id = e.id
            JOIN users u ON v.caregiver_id = u.id
        `;

        const params: any[] = [];
        const conditions: string[] = [];

        // Guardian filtering
        if (user.role === 'guardian') {
            query += ` JOIN guardians g ON e.id = g.elderly_id `;
            conditions.push(`g.user_id = ?`);
            params.push(user.userId);
        }

        if (elderlyId) {
            conditions.push(`v.elderly_id = ?`);
            params.push(elderlyId);
        }

        if (search) {
            conditions.push(`e.full_name LIKE ?`);
            params.push(`%${search}%`);
        }

        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(' AND ');
        }

        query += ` ORDER BY v.visited_at DESC`;

        const stmt = c.env.carehub_db.prepare(query);
        const result = await stmt.bind(...params).all();

        return c.json({
            success: true,
            data: result.results
        });
    } catch (error) {
        console.error('Get visits error:', error);
        return c.json({ success: false, message: 'เกิดข้อผิดพลาด' }, 500);
    }
});

/**
 * POST /visit
 * บันทึกการเยี่ยม
 */
visit.post('/', async (c) => {
    try {
        const user = c.get('user');
        const { elderly_id, note, urgency } = await c.req.json();

        if (!elderly_id) {
            return c.json({ success: false, message: 'กรุณาระบุผู้รับการดูแล' }, 400);
        }

        // Combine urgency into note if provided
        let finalNote = note || '';
        if (urgency) {
            const urgencyText = {
                'green': '[ปกติ]',
                'yellow': '[เฝ้าระวัง]',
                'red': '[เร่งด่วน]'
            }[urgency as string] || `[${urgency}]`;
            finalNote = `${urgencyText} ${finalNote}`;
        }

        // Check permission if guardian
        if (user.role === 'guardian') {
            const permission = await c.env.carehub_db
                .prepare('SELECT 1 FROM guardians WHERE user_id = ? AND elderly_id = ?')
                .bind(user.userId, elderly_id)
                .first();

            if (!permission) {
                return c.json({ success: false, message: 'ไม่มีสิทธิ์บันทึกข้อมูลนี้' }, 403);
            }
        }

        // Insert
        const result = await c.env.carehub_db
            .prepare(`
                INSERT INTO visit_logs (elderly_id, caregiver_id, note, visited_at)
                VALUES (?, ?, ?, datetime('now'))
            `)
            .bind(elderly_id, user.userId, finalNote)
            .run();

        if (!result.success) {
            return c.json({ success: false, message: 'บันทึกข้อมูลไม่สำเร็จ' }, 500);
        }

        return c.json({
            success: true,
            message: 'บันทึกการเยี่ยมสำเร็จ'
        }, 201);

    } catch (error) {
        console.error('Create visit log error:', error);
        return c.json({ success: false, message: 'เกิดข้อผิดพลาด' }, 500);
    }
});

export default visit;
