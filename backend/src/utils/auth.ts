/**
 * Authentication Utilities
 * 
 * ฟังก์ชันช่วยเหลือสำหรับ:
 * 1. Hash password ด้วย bcrypt (ปลอดภัยกว่าเก็บ plaintext)
 * 2. ตรวจสอบ password กับ hash
 * 3. สร้าง JWT token สำหรับ authentication
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from '../types'

/**
 * hashPassword - แปลง password เป็น hash ที่ปลอดภัย
 * 
 * ทำไมต้อง hash?
 * - ถ้าเก็บ password แบบ plaintext แล้ว database โดน hack จะเห็น password ทุกคน
 * - hash เป็น one-way function: รู้ hash แต่กลับไปหา password ไม่ได้
 * - bcrypt ใส่ "salt" อัตโนมัติ ทำให้ password เดียวกันได้ hash ต่างกัน
 * 
 * @param password - password ที่ user กรอก
 * @returns bcrypt hash ของ password
 * 
 * ตัวเลข 10 คือ "cost factor" - ยิ่งสูงยิ่งปลอดภัย แต่ช้าลง
 * 10 เป็นค่าที่แนะนำ (ใช้เวลาประมาณ 100ms)
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
}

/**
 * verifyPassword - ตรวจสอบว่า password ตรงกับ hash หรือไม่
 * 
 * bcrypt.compare จะ:
 * 1. ดึง salt จาก hash
 * 2. hash password ที่กรอกมาด้วย salt เดียวกัน
 * 3. เทียบผลลัพธ์
 * 
 * @param password - password ที่ user กรอกมา
 * @param hash - password_hash ที่เก็บใน database
 * @returns true ถ้าตรงกัน, false ถ้าไม่ตรง
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
}

/**
 * generateToken - สร้าง JWT token สำหรับ user
 * 
 * JWT (JSON Web Token) คืออะไร?
 * - เป็น string ที่เข้ารหัสข้อมูลของ user
 * - มี 3 ส่วน: header.payload.signature (คั่นด้วยจุด)
 * - client เก็บ token ไว้ใน localStorage
 * - ทุกครั้งที่เรียก API ก็ส่ง token มาใน header
 * - server ตรวจสอบ signature เพื่อยืนยันว่า token ไม่ถูกแก้ไข
 * 
 * @param payload - ข้อมูลที่จะเก็บใน token (userId, email, role)
 * @param secret - secret key สำหรับ sign token (อย่าให้ใครรู้!)
 * @returns JWT token string
 */
export function generateToken(payload: JwtPayload, secret: string): string {
    return jwt.sign(payload, secret, {
        expiresIn: '7d'  // token หมดอายุใน 7 วัน
    })
}

/**
 * verifyToken - ตรวจสอบและถอดรหัส JWT token
 * 
 * ใช้ใน middleware เพื่อ:
 * 1. ตรวจว่า token ยังไม่หมดอายุ
 * 2. ตรวจว่า signature ถูกต้อง (ไม่ถูกแก้ไข)
 * 3. ดึงข้อมูล user จาก token
 * 
 * @param token - JWT token ที่ได้จาก client
 * @param secret - secret key เดียวกับตอน sign
 * @returns payload ถ้า token valid, null ถ้าไม่ valid
 */
export function verifyToken(token: string, secret: string): JwtPayload | null {
    try {
        return jwt.verify(token, secret) as JwtPayload
    } catch {
        return null
    }
}
