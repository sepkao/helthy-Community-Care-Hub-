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
    photo: string | null;
    age: number | null;
    national_id: string | null;
    date_of_birth: string | null;
    created_at: string;
}

/**
 * คำนวณอายุปัจจุบันจากวันเกิด (YYYY-MM-DD) — คิดวันเกิดที่ยังไม่ถึงในปีนี้ด้วย
 */
function calculateAge(dob: string): number | null {
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

/**
 * เติม/แทนที่ฟิลด์ age ด้วยค่าที่คำนวณจาก date_of_birth (ถ้ามี) —
 * ใช้กับทั้ง list และ detail เพื่อให้อายุอัปเดตตามวันปัจจุบันเสมอ
 */
function withComputedAge<T extends { age: number | null; date_of_birth?: string | null }>(row: T): T {
    if (row.date_of_birth) {
        const computed = calculateAge(row.date_of_birth);
        if (computed !== null) row.age = computed;
    }
    return row;
}

/**
 * GET /elderly
 * ดึงรายชื่อผู้สูงอายุทั้งหมด (รองรับค้นหาด้วย query)
 */
elderly.get('/', async (c) => {
    try {
        const user = c.get('user');
        const search = c.req.query('search') || '';
        const diseaseFilter = c.req.query('disease') || '';

        let query = `
            SELECT e.id, e.full_name, e.photo, e.age, e.national_id, e.date_of_birth, e.created_at
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

        // ค้นหาได้ทั้งชื่อ-นามสกุล และชื่อโรค
        if (search) {
            conditions.push('(e.full_name LIKE ? OR EXISTS (SELECT 1 FROM elderly_diseases d WHERE d.elderly_id = e.id AND d.name LIKE ?))');
            params.push(`%${search}%`, `%${search}%`);
        }

        // กรองตามหมวดโรค (ชื่อโรค)
        if (diseaseFilter) {
            conditions.push('EXISTS (SELECT 1 FROM elderly_diseases d WHERE d.elderly_id = e.id AND d.name = ?)');
            params.push(diseaseFilter);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY e.created_at DESC';

        const stmt = c.env.carehub_db.prepare(query);
        const result = params.length > 0
            ? await stmt.bind(...params).all()
            : await stmt.all();

        const list = (result.results as any[]).map(withComputedAge);

        // แนบรายการโรคของแต่ละคน
        if (list.length > 0) {
            const ids = list.map((e) => e.id);
            const placeholders = ids.map(() => '?').join(',');
            const dRes = await c.env.carehub_db
                .prepare(`SELECT id, elderly_id, name, note FROM elderly_diseases WHERE elderly_id IN (${placeholders}) ORDER BY created_at ASC`)
                .bind(...ids)
                .all();
            const byId: Record<number, any[]> = {};
            for (const d of dRes.results as any[]) {
                (byId[d.elderly_id] ||= []).push(d);
            }
            for (const e of list) e.diseases = byId[e.id] || [];
        }

        return c.json({
            success: true,
            data: list,
            total: list.length,
        });
    } catch (error) {
        console.error('Get elderly list error:', error);
        return c.json({ success: false, message: 'เกิดข้อผิดพลาด' }, 500);
    }
});

/**
 * GET /elderly/categories
 * ดึงรายชื่อหมวดโรคทั้งหมด (distinct) พร้อมจำนวนคนต่อโรค สำหรับทำ filter (แสดงตัวเลขในแท็ก)
 * ต้องมาก่อน /:id ไม่งั้นจะถูกจับเป็น id
 */
elderly.get('/categories', async (c) => {
    try {
        const user = c.get('user');
        const isGuardian = user.role === 'guardian';

        // จำนวนคนต่อโรค — นับ elderly_id แบบ distinct กันคนซ้ำถ้ามีโรคซ้ำชื่อ
        let catQuery = 'SELECT d.name, COUNT(DISTINCT d.elderly_id) as count FROM elderly_diseases d';
        const catParams: string[] = [];
        if (isGuardian) {
            catQuery += ' JOIN guardians g ON d.elderly_id = g.elderly_id WHERE g.user_id = ?';
            catParams.push(String(user.userId));
        }
        catQuery += ' GROUP BY d.name ORDER BY d.name ASC';

        const catStmt = c.env.carehub_db.prepare(catQuery);
        const catRes = catParams.length > 0 ? await catStmt.bind(...catParams).all() : await catStmt.all();

        // จำนวนคนทั้งหมด — สำหรับแท็ก "All"
        let totalQuery = 'SELECT COUNT(*) as count FROM elderly e';
        const totalParams: string[] = [];
        if (isGuardian) {
            totalQuery += ' JOIN guardians g ON e.id = g.elderly_id WHERE g.user_id = ?';
            totalParams.push(String(user.userId));
        }
        const totalStmt = c.env.carehub_db.prepare(totalQuery);
        const totalRow = totalParams.length > 0
            ? await totalStmt.bind(...totalParams).first<{ count: number }>()
            : await totalStmt.first<{ count: number }>();

        return c.json({
            success: true,
            data: (catRes.results as any[]).map((r) => ({ name: r.name, count: r.count })),
            total: totalRow?.count ?? 0,
        });
    } catch (error) {
        console.error('Get disease categories error:', error);
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
        const elderlyDataRaw = await c.env.carehub_db
            .prepare('SELECT id, full_name, photo, age, national_id, date_of_birth, created_at FROM elderly WHERE id = ?')
            .bind(id)
            .first<Elderly>();

        if (!elderlyDataRaw) {
            return c.json({ success: false, message: 'ไม่พบข้อมูล' }, 404);
        }

        const elderlyData = withComputedAge(elderlyDataRaw);

        // ดึงรายการโรคประจำตัวทั้งหมด
        const diseases = await c.env.carehub_db
            .prepare('SELECT id, name, note, created_at FROM elderly_diseases WHERE elderly_id = ? ORDER BY created_at ASC')
            .bind(id)
            .all();

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
                diseases: diseases.results,
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
        const { full_name, risk_level, symptoms, guardian_id, photo, diseases, date_of_birth, national_id } = await c.req.json();

        if (!full_name || full_name.trim().length === 0) {
            return c.json({ success: false, message: 'กรุณากรอกชื่อ-นามสกุล' }, 400);
        }
        // ชื่อ-นามสกุล — รับได้แค่ตัวอักษร (ไทย/อังกฤษ) กับเว้นวรรค ห้ามตัวเลข/อักขระพิเศษ
        if (!/^[\p{L}\p{M}\s]+$/u.test(full_name.trim())) {
            return c.json({ success: false, message: 'ชื่อ-นามสกุลใส่ได้เฉพาะตัวอักษรเท่านั้น ห้ามมีตัวเลขหรืออักขระพิเศษ' }, 400);
        }

        // วันเกิด — บังคับกรอก และต้องเป็นวันที่ที่สมเหตุสมผล (ไม่ใช่อนาคต, อายุ 0-120 ปี)
        const dob = String(date_of_birth ?? '').trim();
        if (!dob) {
            return c.json({ success: false, message: 'กรุณากรอกวันเกิด' }, 400);
        }
        const dobDate = new Date(dob);
        if (Number.isNaN(dobDate.getTime()) || dobDate > new Date()) {
            return c.json({ success: false, message: 'วันเกิดไม่ถูกต้อง' }, 400);
        }
        const ageNum = calculateAge(dob);
        if (ageNum === null || ageNum < 0 || ageNum > 120) {
            return c.json({ success: false, message: 'วันเกิดไม่ถูกต้อง (อายุต้องอยู่ระหว่าง 0-120 ปี)' }, 400);
        }

        // เลขบัตรประชาชน — บังคับกรอก 13 หลัก
        const nid = String(national_id ?? '').replace(/\D/g, '');
        if (!nid) {
            return c.json({ success: false, message: 'กรุณากรอกเลขบัตรประชาชน' }, 400);
        }
        if (nid.length !== 13) {
            return c.json({ success: false, message: 'เลขบัตรประชาชนต้องมี 13 หลัก' }, 400);
        }

        // กันเลขบัตรซ้ำ
        const dup = await c.env.carehub_db
            .prepare('SELECT id FROM elderly WHERE national_id = ?')
            .bind(nid)
            .first();
        if (dup) {
            return c.json({ success: false, message: 'เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว' }, 400);
        }

        // ตรวจขนาดรูป (base64 data URI) — กันแถวใน D1 ใหญ่เกินไป (~1.5MB)
        if (photo && typeof photo === 'string' && photo.length > 2_000_000) {
            return c.json({ success: false, message: 'รูปภาพมีขนาดใหญ่เกินไป (จำกัดประมาณ 1.5MB)' }, 400);
        }

        // 1. Insert Elderly (พร้อมรูปถ้ามี) — เก็บทั้ง date_of_birth (แหล่งข้อมูลจริง) และ age (คำนวณตอนบันทึก เผื่อความเข้ากันได้ย้อนหลัง)
        const result = await c.env.carehub_db
            .prepare('INSERT INTO elderly (full_name, photo, age, national_id, date_of_birth) VALUES (?, ?, ?, ?, ?)')
            .bind(full_name.trim(), photo || null, ageNum, nid, dob)
            .run();

        if (!result.success) {
            return c.json({ success: false, message: 'ไม่สามารถเพิ่มข้อมูลได้' }, 500);
        }

        const elderlyId = result.meta.last_row_id;

        // 2. Insert Risk Record (เฉพาะเมื่อส่ง risk_level มา — ตอนนี้ไม่บังคับแล้ว)
        if (risk_level) {
            await c.env.carehub_db
                .prepare(`
        INSERT INTO risk_records (elderly_id, caregiver_id, risk_level, symptoms)
        VALUES (?, ?, ?, ?)
      `)
                .bind(elderlyId, user.userId, risk_level, symptoms || '')
                .run();
        }

        // 2.5 Insert Diseases (โรคประจำตัว) — รับได้ทั้ง string หรือ { name, note }
        if (Array.isArray(diseases)) {
            for (const d of diseases) {
                const name = typeof d === 'string' ? d : d?.name;
                const note = typeof d === 'string' ? null : (d?.note ?? null);
                if (name && String(name).trim().length > 0) {
                    await c.env.carehub_db
                        .prepare('INSERT INTO elderly_diseases (elderly_id, name, note) VALUES (?, ?, ?)')
                        .bind(elderlyId, String(name).trim(), note)
                        .run();
                }
            }
        }

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
            .prepare('SELECT id, full_name, photo, age, national_id, date_of_birth, created_at FROM elderly WHERE rowid = ?')
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
            .prepare('DELETE FROM elderly_diseases WHERE elderly_id = ?')
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
