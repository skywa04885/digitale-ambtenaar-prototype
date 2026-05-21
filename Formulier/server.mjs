import express from 'express';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateAssessment, buildDerivedProfile } from './src/scoring.js';
import { getSuggestions } from './src/options.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || '127.0.0.1';
const dataDir = resolve(__dirname, 'data');
const dataFile = resolve(dataDir, 'profiles.json');

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  if (!existsSync(dataFile)) {
    await fs.writeFile(dataFile, '[]\n', 'utf-8');
  }
}

async function readProfiles() {
  await ensureStore();
  const raw = await fs.readFile(dataFile, 'utf-8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeProfiles(records) {
  await ensureStore();
  const tempFile = `${dataFile}.tmp`;
  await fs.writeFile(tempFile, `${JSON.stringify(records, null, 2)}\n`, 'utf-8');
  await fs.rename(tempFile, dataFile);
}

function publicRecord(record) {
  return {
    id: record.id,
    createdAt: record.createdAt,
    profile: record.profile,
    derivedProfile: record.derivedProfile,
    assessment: record.assessment
  };
}

function escapeScriptJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

async function createServer() {
  await ensureStore();
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/suggestions', (req, res) => {
    const field = String(req.query.field || '');
    const query = String(req.query.q || '');
    res.json({ suggestions: getSuggestions(field, query) });
  });

  app.get('/api/profiles', async (_req, res, next) => {
    try {
      const records = await readProfiles();
      res.json({ profiles: records.slice(0, 20).map(publicRecord) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/profiles', async (req, res, next) => {
    try {
      const profile = req.body?.profile;
      if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
        res.status(400).json({ error: 'Profiel ontbreekt of is ongeldig.' });
        return;
      }

      const assessment = calculateAssessment(profile);
      const derivedProfile = buildDerivedProfile(profile, assessment);
      const record = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        profile,
        derivedProfile,
        assessment
      };

      const records = await readProfiles();
      records.unshift(record);
      await writeProfiles(records.slice(0, 100));
      res.status(201).json(publicRecord(record));
    } catch (error) {
      next(error);
    }
  });

  let vite;
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'custom'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(resolve(__dirname, 'dist/client'), { index: false }));
  }

  app.use(async (req, res, next) => {
    try {
      const url = req.originalUrl;
      let template;
      let render;

      if (!isProduction) {
        template = await fs.readFile(resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule('/src/entry-server.jsx')).render;
      } else {
        template = await fs.readFile(resolve(__dirname, 'dist/client/index.html'), 'utf-8');
        render = (await import('./dist/server/entry-server.js')).render;
      }

      const records = await readProfiles();
      const initialData = {
        profiles: records.slice(0, 8).map(publicRecord)
      };
      const { html } = render(url, initialData);
      const page = template
        .replace('<!--app-html-->', html)
        .replace('<!--initial-data-->', `<script>window.__INITIAL_DATA__=${escapeScriptJson(initialData)}</script>`);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(page);
    } catch (error) {
      if (vite) {
        vite.ssrFixStacktrace(error);
      }
      next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: 'Er ging iets mis op de server.' });
  });

  const httpServer = app.listen(port, host, () => {
    console.log(`HaaS intake draait op http://${host}:${port}`);
  });

  httpServer.on('error', (error) => {
    console.error(`Server kon niet starten op ${host}:${port}`);
    console.error(error);
    process.exitCode = 1;
  });
}

createServer();
