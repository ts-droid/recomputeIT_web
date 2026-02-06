import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDb } from './init.js';
import { query } from './db.js';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

const API_KEY = process.env.API_KEY || '';

const ROLE_RANK = {
  base: 1,
  service: 2,
  admin: 3,
};

const canAccess = (role, minimumRole) =>
  ROLE_RANK[role] >= ROLE_RANK[minimumRole];

const timingSafeEqual = (a, b) => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

const requireAuth = async (req, res, next) => {
  if (!API_KEY) {
    // If API_KEY not set, fall back to user tokens only.
  }

  const headerKey = req.headers['x-api-key'];
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const providedKey = headerKey || bearer || '';

  if (API_KEY && providedKey && timingSafeEqual(providedKey, API_KEY)) {
    req.user = { id: 'master-key', role: 'admin', email: 'master@local' };
    return next();
  }

  if (!providedKey) {
    return res.status(401).json({ error: 'Obehörig.' });
  }

  try {
    const { rows } = await query(
      'SELECT id, email, role, name FROM users WHERE api_token = $1',
      [providedKey]
    );

    if (!rows[0]) {
      return res.status(401).json({ error: 'Obehörig.' });
    }

    req.user = rows[0];
    return next();
  } catch (error) {
    console.error('Auth lookup error:', error);
    return res.status(500).json({ error: 'Auth error.' });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.user || !canAccess(req.user.role, role)) {
    return res.status(403).json({ error: 'Otillräcklig behörighet.' });
  }
  return next();
};

app.get('/api/tickets', requireAuth, async (_req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM service_tickets ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('GET /api/tickets error:', error);
    res.status(500).json({ error: 'Kunde inte hämta ärenden.' });
  }
});

app.post('/api/tickets', requireAuth, async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      device_type,
      device_model,
      issue_description,
      additional_notes,
      disclaimer_language,
      status,
      user_id,
    } = req.body || {};

    if (!customer_name || !customer_phone || !device_type || !issue_description) {
      return res.status(400).json({ error: 'Saknar obligatoriska fält.' });
    }

    const { rows } = await query(
      `
        INSERT INTO service_tickets (
          customer_name,
          customer_email,
          customer_phone,
          device_type,
          device_model,
          issue_description,
          additional_notes,
          disclaimer_language,
          status,
          user_id
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING *
      `,
      [
        customer_name,
        customer_email || null,
        customer_phone,
        device_type,
        device_model || null,
        issue_description,
        additional_notes || null,
        disclaimer_language || 'sv',
        status || 'Nytt',
        user_id || null,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('POST /api/tickets error:', error);
    res.status(500).json({ error: 'Kunde inte skapa ärende.' });
  }
});

app.patch('/api/tickets/:id', requireAuth, requireRole('service'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const allowedFields = new Set([
      'status',
      'cost_proposal_approved',
      'internal_notes',
      'work_done_summary',
      'final_cost',
      'diagnosis',
      'is_hidden',
      'disclaimer_language',
      'additional_notes',
      'device_model',
      'completed_at',
      'customer_notified_at',
      'picked_up_at',
      'closed_at',
    ]);

    const fields = Object.keys(updates).filter((key) => allowedFields.has(key));
    if (fields.length === 0) {
      return res.status(400).json({ error: 'Inga giltiga fält att uppdatera.' });
    }

    if (updates.status) {
      if (updates.status === 'Färdig') {
        if (!updates.completed_at) {
          updates.completed_at = new Date().toISOString();
        }
        if (!updates.customer_notified_at) {
          updates.customer_notified_at = new Date().toISOString();
        }
      }

      if (updates.status === 'Avslutad') {
        if (!updates.picked_up_at) {
          updates.picked_up_at = new Date().toISOString();
        }
        if (!updates.closed_at) {
          updates.closed_at = new Date().toISOString();
        }
      }
    }

    const setFragments = fields.map((field, idx) => `${field} = $${idx + 1}`);
    const values = fields.map((field) => updates[field]);
    values.push(id);

    const { rows } = await query(
      `
        UPDATE service_tickets
        SET ${setFragments.join(', ')}
        WHERE id = $${fields.length + 1}
        RETURNING *
      `,
      values
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Ärende hittades inte.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('PATCH /api/tickets/:id error:', error);
    res.status(500).json({ error: 'Kunde inte uppdatera ärende.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'E-post och lösenord krävs.' });
    }

    const { rows } = await query(
      'SELECT id, email, password_hash, role, name FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Felaktiga uppgifter.' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Felaktiga uppgifter.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await query('UPDATE users SET api_token = $1, last_login_at = NOW() WHERE id = $2', [
      token,
      user.id,
    ]);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    res.status(500).json({ error: 'Kunde inte logga in.' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/admin/users', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { email, password, role, name } = req.body || {};
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, lösenord och roll krävs.' });
    }

    if (!ROLE_RANK[role]) {
      return res.status(400).json({ error: 'Ogiltig roll.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      'INSERT INTO users (email, password_hash, role, name) VALUES ($1,$2,$3,$4) RETURNING id, email, role, name',
      [email.toLowerCase(), hash, role, name || null]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('POST /api/admin/users error:', error);
    res.status(500).json({ error: 'Kunde inte skapa användare.' });
  }
});

app.get('/api/admin/users', requireAuth, requireRole('admin'), async (_req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, email, role, name, created_at, last_login_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    res.status(500).json({ error: 'Kunde inte hämta användare.' });
  }
});

app.get('/api/admin/stats', requireAuth, requireRole('admin'), async (_req, res) => {
  try {
    const { rows } = await query(`
      SELECT
        COUNT(*)::int AS total_tickets,
        COUNT(*) FILTER (WHERE status = 'Avslutad')::int AS closed_tickets,
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) AS avg_repair_seconds,
        AVG(EXTRACT(EPOCH FROM (customer_notified_at - completed_at))) AS avg_notify_seconds,
        AVG(EXTRACT(EPOCH FROM (picked_up_at - customer_notified_at))) AS avg_pickup_seconds
      FROM service_tickets
    `);

    res.json(rows[0]);
  } catch (error) {
    console.error('GET /api/admin/stats error:', error);
    res.status(500).json({ error: 'Kunde inte hämta statistik.' });
  }
});

app.use(express.static(DIST_DIR));
app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
