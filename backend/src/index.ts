import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.text('CareHub API is running')
})

/* ✅ READ: ทั้งหมด */
app.get('/patients', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT * FROM patients ORDER BY id DESC')
    .all()

  return c.json(results)
})

/* ✅ CREATE: เพิ่มผู้ป่วย */
app.post('/patients', async (c) => {
  const body = await c.req.json()

  const { name, age, phone, address } = body

  if (!name) {
    return c.json({ error: 'name is required' }, 400)
  }

  const result = await c.env.DB
    .prepare(
      `INSERT INTO patients (name, age, phone, address)
       VALUES (?, ?, ?, ?)`
    )
    .bind(name, age ?? null, phone ?? null, address ?? null)
    .run()

  return c.json({
    success: true,
    id: result.meta.last_row_id
  })
})

export default app
