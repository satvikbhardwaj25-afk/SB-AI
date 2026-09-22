# SB.ai Python API

This is a dependency-free Python implementation of the SB.ai JSON API. It uses
the Gemini REST API and keeps the provider key in the `GEMINI_API_KEY`
environment variable.

```bash
GEMINI_API_KEY=your-key python3 python-api/main.py
```

Optional configuration:

- `PORT` — defaults to `8001`
- `GEMINI_MODEL` — defaults to `gemini-3-flash-preview`

The workspace preview uses the same request and response contract through the
managed API service. `openapi.json` documents the Python implementation.