import { Hono } from 'hono';
import { verifyToken } from '../utils/auth';
import type { Bindings, JwtPayload } from '../types';

const elderly = new Hono<{ Bindings: Bindings, Variables: { user: JwtPayload } }>();

// Auth Middleware
elderly.use('/*', async (c, next) => {
    const token = c.req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    const payload = verifyToken(token, c.env.JWT_SECRET);
    if (!payload) {
        return c.json({ success: false, message: 'Invalid token' }, 401);
    }

    c.set('user', payload);
    await next();
});

/**
 * Interface
 */
interface Elderly {
    id: number;
    full_name: string;
    created_at: string;
}

/**
 * GET /elderly
 * ดึงรายชื่อผู้สูงอายุทั้งหมด (รองรับค้นหาด้วย query)
 */
elderly.get('/', async (c) => {
    try {
        const user = c.get('user');
        const search = c.req.query('search') || '';
        const riskFilter = c.req.query('risk_level') || '';

        let query = `
            SELECT e.id, e.full_name, e.created_at,
                (SELECT r.risk_level FROM risk_records r 
                 WHERE r.elderly_id = e.id 
                 ORDER BY r.recorded_at DESC LIMIT 1) as risk_level
            FROM elderly e
        `;
        const params: string[] = [];
        const conditions: string[] = [];

        // ถ้าเป็น guardian ให้ดูได้เฉพาะที่ตัวเองดูแล
        if (user.role === 'guardian') {
            query += ' JOIN guardians g ON e.id = g.elderly_id';
            conditions.push('g.user_id = ?');
            params.push(String(user.userId));
        }

        if (search) {
            conditions.push('e.full_name LIKE ?');
            params.push(`%${search}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY e.created_at DESC';

        const stmt = c.env.carehub_db.prepare(query);
        const result = params.length > 0
            ? await stmt.bind(...params).all()
            : await stmt.all();

        // Filter by risk_level in JS (since it's a subquery alias)
        let data = result.results;
        if (riskFilter) {
            data = data.filter((e: any) => e.risk_level === riskFilter);
        }

        return c.json({
            success: true,
            data,
            total: data.length,
        });
    } catch (error) {
        console.error('Get elderly list error:', error);
        return c.json({ success: false, message: 'เกิดข้อผิดพลาด' }, 500);
    }
});

/**
 * GET /elderly/:id
 * ดึงข้อมูลผู้สูงอายุคนเดียวพร้อม risk_records ล่าสุด
 */
elderly.get('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const user = c.get('user');

        // Check permission for guardian
        if (user.role === 'guardian') {
            const permission = await c.env.carehub_db
                .prepare('SELECT 1 FROM guardians WHERE user_id = ? AND elderly_id = ?')
                .bind(user.userId, id)
                .first();

            if (!permission) {
                return c.json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' }, 403);
            }
        }

        // ดึงข้อมูลผู้สูงอายุ
        const elderlyData = await c.env.carehub_db
            .prepare('SELECT id, full_name, created_at FROM elderly WHERE id = ?')
            .bind(id)
            .first<Elderly>();

        if (!elderlyData) {
            return c.json({ success: false, message: 'ไม่พบข้อมูล' }, 404);
        }

        // ดึง risk record ล่าสุด
        const latestRisk = await c.env.carehub_db
            .prepare(`
        SELECT risk_level, symptoms, recorded_at 
        FROM risk_records 
        WHERE elderly_id = ? 
        ORDER BY recorded_at DESC 
        LIMIT 1
      `)
            .bind(id)
            .first();

        // ดึง visit logs ล่าสุด 5 รายการ
        const recentVisits = await c.env.carehub_db
            .prepare(`
        SELECT note, visited_at 
        FROM visit_logs 
        WHERE elderly_id = ? 
        ORDER BY visited_at DESC 
        LIMIT 5
      `)
            .bind(id)
            .all();

        return c.json({
            success: true,
            data: {
                ...elderlyData,
                latest_risk: latestRisk || null,
                recent_visits: recentVisits.results,
            },
        });
    } catch (error) {
        console.error('Get elderly detail error:', error);
        return c.json({ success: false, message: 'เกิดข้อผิดพลาด' }, 500);
    }
});

/**
 * POST /elderly
 * เพิ่มผู้สูงอายุใหม่ + ประเมินความเสี่ยงเริ่มต้น
 */
elderly.post('/', async (c) => {
    try {
        const user = c.get('user');
        const { full_name, risk_level, symptoms, guardian_id } = await c.req.json();

        if (!full_name || full_name.trim().length === 0) {
            return c.json({ success: false, message: 'กรุณากรอกชื่อ-นามสกุล' }, 400);
        }

        if (!risk_level) {
            return c.json({ success: false, message: 'กรุณาระบุระดับความเสี่ยง' }, 400);
        }

        // 1. Insert Elderly
        const result = await c.env.carehub_db
            .prepare('INSERT INTO elderly (full_name) VALUES (?)')
            .bind(full_name.trim())
            .run();

        if (!result.success) {
            return c.json({ success: false, message: 'ไม่สามารถเพิ่มข้อมูลได้' }, 500);
        }

        const elderlyId = result.meta.last_row_id;

        // 2. Insert Risk Record
        await c.env.carehub_db
            .prepare(`
        INSERT INTO risk_records (elderly_id, caregiver_id, risk_level, symptoms)
        VALUES (?, ?, ?, ?)
      `)
            .bind(elderlyId, user.userId, risk_level, symptoms || '')
            .run();

        // 3. Link Guardian
        // ถ้าคนสร้างเป็น guardian ให้ผูกตัวเอง
        if (user.role === 'guardian') {
            await c.env.carehub_db
                .prepare('INSERT INTO guardians (user_id, elderly_id) VALUES (?, ?)')
                .bind(user.userId, elderlyId)
                .run();
        }
        // ถ้าส่ง guardian_id มาด้วย (กรณี admin/caregiver สร้างให้)
        else if (guardian_id) {
            await c.env.carehub_db
                .prepare('INSERT INTO guardians (user_id, elderly_id) VALUES (?, ?)')
                .bind(guardian_id, elderlyId)
                .run();
        }

        // Fetch newly created data
        const newElderly = await c.env.carehub_db
            .prepare('SELECT id, full_name, created_at FROM elderly WHERE rowid = ?')
            .bind(elderlyId)
            .first<Elderly>();

        return c.json({
            success: true,
            message: 'เพิ่มข้อมูลสำเร็จ',
            data: newElderly,
        }, 201);
    } catch (error) {
        console.error('Create elderly error:', error);
        return c.json({ success: false, message: 'เกิดข้อผิดพลาด' }, 500);
    }
});

/**
 * DELETE /elderly/:id
 * ลบผู้สูงอายุและข้อมูลที่เกี่ยวข้องทั้งหมด
 * เฉพาะ caregiver เท่านั้นที่มีสิทธิ์ลบ
 */
elderly.delete('/:id', async (c) => {
    try {
        const user = c.get('user');
        const id = c.req.param('id');

        // เฉพาะ caregiver เท่านั้นที่ลบได้
        if (user.role === 'guardian') {
            return c.json({ success: false, message: 'ไม่มีสิทธิ์ลบข้อมูล' }, 403);
        }

        // ตรวจสอบว่ามีข้อมูลอยู่จริง
        const existing = await c.env.carehub_db
            .prepare('SELECT id FROM elderly WHERE id = ?')
            .bind(id)
            .first();

        if (!existing) {
            return c.json({ success: false, message: 'ไม่พบข้อมูลผู้สูงอายุ' }, 404);
        }

        // ลบข้อมูลที่เกี่ยวข้องตามลำดับ (foreign key constraints)
        await c.env.carehub_db
            .prepare('DELETE FROM visit_logs WHERE elderly_id = ?')
            .bind(id).run();

        await c.env.carehub_db
            .prepare('DELETE FROM risk_records WHERE elderly_id = ?')
            .bind(id).run();

        await c.env.carehub_db
            .prepare('DELETE FROM guardians WHERE elderly_id = ?')
            .bind(id).run();

        await c.env.carehub_db
            .prepare('DELETE FROM elderly WHERE id = ?')
            .bind(id).run();

        return c.json({
            success: true,
            message: 'ลบข้อมูลสำเร็จ',
        });
    } catch (error) {
        console.error('Delete elderly error:', error);
        return c.json({ success: false, message: 'เกิดข้อผิดพลาด' }, 500);
    }
});

/**
 * PATCH /elderly/:id/risk
 * อัปเดตระดับความเสี่ยงของผู้สูงอายุ (เฉพาะ caregiver และ admin)
 */
elderly.patch('/:id/risk', async (c) => {
    try {
        const user = c.get('user');
        const id = c.req.param('id');

        // เฉพาะ caregiver และ admin เท่านั้น
        if (user.role === 'guardian') {
            return c.json({ success: false, message: 'ไม่มีสิทธิ์แก้ไขระดับความเสี่ยง' }, 403);
        }

        const { risk_level, symptoms } = await c.req.json();

        const validLevels = ['low', 'medium', 'high'];
        if (!risk_level || !validLevels.includes(risk_level)) {
            return c.json({ success: false, message: 'ระดับความเสี่ยงไม่ถูกต้อง (low/medium/high)' }, 400);
        }

        // ตรวจสอบว่ามีผู้สูงอายุอยู่จริง
        const existing = await c.env.carehub_db
            .prepare('SELECT id FROM elderly WHERE id = ?')
            .bind(id)
            .first();

        if (!existing) {
            return c.json({ success: false, message: 'ไม่พบข้อมูลผู้สูงอายุ' }, 404);
        }

        // Insert risk record ใหม่ (ไม่ลบอันเก่า — เก็บประวัติไว้)
        await c.env.carehub_db
            .prepare(`
        INSERT INTO risk_records (elderly_id, caregiver_id, risk_level, symptoms)
        VALUES (?, ?, ?, ?)
      `)
            .bind(id, user.userId, risk_level, symptoms || '')
            .run();

        return c.json({
            success: true,
            message: 'อัปเดตระดับความเสี่ยงสำเร็จ',
            data: { elderly_id: id, risk_level },
        });
    } catch (error) {
        console.error('Update risk level error:', error);
        return c.json({ success: false, message: 'เกิดข้อผิดพลาด' }, 500);
    }
});

export default elderly;
