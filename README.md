# Codex

**A multi-language static code analyzer for Java, JavaScript, and Python.** Upload source files to get project metrics, complexity counts, naming/style warnings, Java WMC summaries, and a downloadable report.

## Quick start

Requires Node.js 18 or newer.

```bash
npm install
npm start
```

Open [http://localhost:4000](http://localhost:4000).

## Project layout

```text
codex/
├── backend/
│   ├── analyzer/   # Language analyzers and report aggregation
│   ├── uploads/    # Temporary uploads (ignored by Git)
│   └── server.js
├── frontend/       # Browser UI
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```

## Usage

Choose or drag `.java`, `.js`, and `.py` files into the upload area, then select **Run Analysis**. Each file is limited to 5 MB; up to 50 files can be analyzed per request. Temporary uploads are removed after two minutes.

## API

`POST /api/analyze` accepts multipart form data with one or more files under the `files` field and returns a JSON project report.

## License

MIT. See [LICENSE](LICENSE).
