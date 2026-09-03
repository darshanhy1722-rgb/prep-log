const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (e) {
    return {};
  }
}

function saveDB(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db));
}

// Get a single value by key
app.get('/api/kv/:key', (req, res) => {
  const db = loadDB();
  const key = decodeURIComponent(req.params.key);
  if (!(key in db)) return res.status(404).json({ error: 'not found' });
  res.json({ key, value: db[key] });
});

// Set a value by key
app.post('/api/kv/:key', (req, res) => {
  const db = loadDB();
  const key = decodeURIComponent(req.params.key);
  db[key] = req.body.value;
  saveDB(db);
  res.json({ key, value: db[key] });
});

// Delete a value by key
app.delete('/api/kv/:key', (req, res) => {
  const db = loadDB();
  const key = decodeURIComponent(req.params.key);
  delete db[key];
  saveDB(db);
  res.json({ deleted: true });
});

// List keys matching a prefix
app.get('/api/kv-list', (req, res) => {
  const db = loadDB();
  const prefix = req.query.prefix || '';
  const keys = Object.keys(db).filter(k => k.startsWith(prefix));
  res.json({ keys });
});

// Get the entire database (for the data viewer page)
app.get('/api/all', (req, res) => {
  const db = loadDB();
  res.json(db);
});

// Simple health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Prep Log server running on port', PORT));
