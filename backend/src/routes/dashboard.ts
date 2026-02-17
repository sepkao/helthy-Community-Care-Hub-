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

        // 2. Urgent Cases (latest risk = high/critical)
        let urgentQuery = `
            SELECT COUNT(*) as count 
            FROM elderly e
            JOIN risk_records r1 ON e.id = r1.elderly_id
            WHERE r1.recorded_at = (
                SELECT MAX(recorded_at) 
                FROM risk_records r2 
                WHERE r2.elderly_id = e.id
            )
            AND r1.risk_level IN ('high', 'critical')
        `;

        if (isGuardian) {
            urgentQuery += ' AND e.id IN (SELECT elderly_id FROM guardians WHERE user_id = ?)';
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
        const urgentParams = isGuardian ? [userId] : [];
        const visitParams = isGuardian ? [userId] : [];

        const [totalResult, urgentResult, visitResult] = await Promise.all([
            c.env.carehub_db.prepare(totalElderlyQuery).bind(...totalParams).first<{ count: number }>(),
            c.env.carehub_db.prepare(urgentQuery).bind(...urgentParams).first<{ count: number }>(),
            c.env.carehub_db.prepare(visitQuery).bind(...visitParams).first<{ count: number }>()
        ]);

        return c.json({
            success: true,
            data: {
                total_elderly: totalResult?.count || 0,
                urgent_elderly: urgentResult?.count || 0,
                today_visits: visitResult?.count || 0
            }
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        return c.json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Dashboard' }, 500);
    }
});

export default dashboard;
