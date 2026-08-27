import { Hono } from 'hono';
import { JwtPayload } from '../types';
import { verifyToken } from '../utils/auth';
import type { Bindings } from '../types';

const dashboard = new Hono<{ Bindings: Bindings, Variables: { user: JwtPayload } }>();

// Auth Middleware
dashboard.use('/*', async (c, next) => {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token) return c.json({ success: false, message: 'Unauthorized' }, 401);

    const payload = verifyToken(token, c.env.JWT_SECRET);
    if (!payload) return c.json({ success: false, message: 'Invalid token' }, 401);

    c.set('user', payload);
    await next();
});

dashboard.get('/stats', async (c) => {
    try {
        const user = c.get('user');
        if (!user) {
            return c.json({ success: false, message: 'Unauthorized' }, 401);
        }

        const isGuardian = user.role === 'guardian';
        const userId = user.userId;

        // 1. Total Elderly
        let totalElderlyQuery = 'SELECT COUNT(*) as count FROM elderly';
        if (isGuardian) {
            totalElderlyQuery += ' JOIN guardians ON elderly.id = guardians.elderly_id WHERE guardians.user_id = ?';
        }

        // 2. Recipients with chronic diseases (มีโรคประจำตัวอย่างน้อย 1 โรค)
        let diseasedQuery = `
            SELECT COUNT(DISTINCT ed.elderly_id) as count
            FROM elderly_diseases ed
        `;

        if (isGuardian) {
            diseasedQuery += ' WHERE ed.elderly_id IN (SELECT elderly_id FROM guardians WHERE user_id = ?)';
        }

        // 3. Today's Visits
        // SQLite 'now' might be UTC. We want 'today' in local time ideally, or just matches string YYYY-MM-DD.
        // In `visit.ts`, we bind `datetime('now', 'localtime')`.
        // Let's match based on date string if possible, or use sqlite date function.
        let visitQuery = `
            SELECT COUNT(*) as count 
            FROM visit_logs v
            JOIN elderly e ON v.elderly_id = e.id
            WHERE date(v.visited_at) = date('now', 'localtime')
        `;

        if (isGuardian) {
            visitQuery += ' AND e.id IN (SELECT elderly_id FROM guardians WHERE user_id = ?)';
        }

        // Execute queries
        const totalParams = isGuardian ? [userId] : [];
        const diseasedParams = isGuardian ? [userId] : [];
        const visitParams = isGuardian ? [userId] : [];

        const [totalResult, diseasedResult, visitResult] = await Promise.all([
            c.env.carehub_db.prepare(totalElderlyQuery).bind(...totalParams).first<{ count: number }>(),
            c.env.carehub_db.prepare(diseasedQuery).bind(...diseasedParams).first<{ count: number }>(),
            c.env.carehub_db.prepare(visitQuery).bind(...visitParams).first<{ count: number }>()
        ]);

        return c.json({
            success: true,
            data: {
                total_elderly: totalResult?.count || 0,
                diseased_elderly: diseasedResult?.count || 0,
                today_visits: visitResult?.count || 0
            }
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        return c.json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Dashboard' }, 500);
    }
});

export default dashboard;
