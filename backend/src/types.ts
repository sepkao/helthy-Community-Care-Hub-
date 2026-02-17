/**
 * TypeScript Type Definitions สำหรับ CareHub Backend
 * 
 * ไฟล์นี้กำหนด types ที่ใช้ทั่วทั้งแอป เพื่อให้ TypeScript ช่วยตรวจ error
 * และให้ IDE ช่วย autocomplete ได้ถูกต้อง
 */

/**
 * Bindings - ค่าที่ Cloudflare Workers inject เข้ามาให้เราใช้
 * 
 * - carehub_db: D1 Database binding (ดูใน wrangler.toml)
 * - JWT_SECRET: Secret key สำหรับ sign JWT tokens
 */
export interface Bindings {
    carehub_db: D1Database
    JWT_SECRET: string
}

/**
 * User - โครงสร้างข้อมูล user ใน database
 * 
 * ตรงกับตาราง `users` ใน db/schema.sql:
 * - id: Primary key, auto-increment
 * - email: อีเมลของ user (unique)
 * - password_hash: bcrypt hash ของ password (ไม่เก็บ password จริง!)
 * - role: 'caregiver' หรือ 'guardian'
 * - created_at: timestamp ที่สร้าง account
 */
export interface User {
    id: number
    email: string
    password_hash: string
    role: 'caregiver' | 'guardian'
    created_at: string
}

/**
 * JwtPayload - ข้อมูลที่เก็บใน JWT token
 * 
 * เมื่อ user login สำเร็จ เราจะสร้าง token ที่มีข้อมูลนี้
 * client จะเก็บ token ไว้และส่งมากับทุก request
 * เราสามารถอ่าน token เพื่อรู้ว่าใครกำลังเรียก API
 */
export interface JwtPayload {
    userId: number
    email: string
    role: 'caregiver' | 'guardian'
}
