import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDb } from './init.js';
import { query } from './db.js';
import crypto from 'node:crypto';

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

const timingSafeEqual = (a, b) => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

const requireAuth = (req, res, next) => {
  if (!API_KEY) {
    return res.status(500).json({ error: 'API-nyckel saknas i serverkonfigurationen.' });
  }

  const headerKey = req.headers['x-api-key'];
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const providedKey = headerKey || bearer || '';

  if (!providedKey || !timingSafeEqual(providedKey, API_KEY)) {
    return res.status(401).json({ error: 'Obehörig.' });
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

app.patch('/api/tickets/:id', requireAuth, async (req, res) => {
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
    ]);

    const fields = Object.keys(updates).filter((key) => allowedFields.has(key));
    if (fields.length === 0) {
      return res.status(400).json({ error: 'Inga giltiga fält att uppdatera.' });
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
