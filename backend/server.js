'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { analyzeJava } = require('./analyzer/javaAnalyzer');
const { analyzeJS } = require('./analyzer/jsAnalyzer');
const { analyzePython } = require('./analyzer/pythonAnalyzer');
const { aggregate } = require('./analyzer/metrics');

const app = express();
const PORT = process.env.PORT || 4000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const session = req.sessionId || (req.sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    const dir = path.join(UPLOAD_DIR, session);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) { cb(null, file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')); }
});
const upload = multer({
  storage,
  fileFilter(req, file, cb) { cb(null, ['.java', '.js', '.py'].includes(path.extname(file.originalname).toLowerCase())); },
  limits: { fileSize: 5 * 1024 * 1024 }
});

function analyzeFile(filePath, fileName) {
  const source = fs.readFileSync(filePath, 'utf8');
  switch (path.extname(fileName).toLowerCase()) {
    case '.java': return analyzeJava(fileName, source);
    case '.js': return analyzeJS(fileName, source);
    case '.py': return analyzePython(fileName, source);
    default: throw new Error(`Unsupported file type: ${path.extname(fileName)}`);
  }
}

app.post('/api/analyze', upload.array('files', 50), (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No supported files uploaded. Use .java, .js, or .py files.' });
  try {
    const report = aggregate(req.files.map(file => analyzeFile(file.path, file.originalname)));
    const sessionDir = path.dirname(req.files[0].path);
    setTimeout(() => fs.rm(sessionDir, { recursive: true, force: true }, () => {}), 120_000);
    return res.json({ success: true, report });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')));
app.listen(PORT, () => console.log(`Codex is running at http://localhost:${PORT}`));
