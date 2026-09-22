"""Small dependency-free Python API for SB.ai.

Run with:
    GEMINI_API_KEY=... python3 python-api/main.py

The API mirrors the workspace OpenAPI contract:
    POST /api/chat
    GET  /api/healthz
"""

from __future__ import annotations

import json
import os
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


MODEL = os.environ.get("GEMINI_MODEL", "gemini-3-flash-preview")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8001"))


def json_response(handler: BaseHTTPRequestHandler, status: int, payload: dict) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.end_headers()
    handler.wfile.write(body)


def ask_gemini(messages: list[dict[str, str]]) -> str:
    contents = [
        {
            "role": "model" if message["role"] == "assistant" else "user",
            "parts": [{"text": message["content"]}],
        }
        for message in messages
    ]
    payload = {
        "contents": contents,
        "systemInstruction": {
            "parts": [
                {
                    "text": "You are SB.ai, a helpful, concise, and thoughtful open-source AI assistant. Answer clearly and be honest when you are uncertain."
                }
            ]
        },
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 8192},
    }
    request = Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={GEMINI_API_KEY}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=90) as response:
        result = json.loads(response.read().decode("utf-8"))

    parts = result.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    answer = "".join(part.get("text", "") for part in parts).strip()
    if not answer:
        raise RuntimeError("Gemini returned an empty response")
    return answer


class SBHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        print(f"[sb.ai] {format % args}")

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_GET(self) -> None:
        if self.path.rstrip("/") in {"/api/healthz", "/python-api/healthz"}:
            json_response(self, HTTPStatus.OK, {"status": "ok"})
            return
        json_response(self, HTTPStatus.NOT_FOUND, {"error": "Not found"})

    def do_POST(self) -> None:
        if self.path.rstrip("/") not in {"/api/chat", "/python-api/chat"}:
            json_response(self, HTTPStatus.NOT_FOUND, {"error": "Not found"})
            return
        if not GEMINI_API_KEY:
            json_response(self, HTTPStatus.SERVICE_UNAVAILABLE, {"error": "Gemini is not configured yet."})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            messages = body["messages"]
            if not isinstance(messages, list) or not 1 <= len(messages) <= 30:
                raise ValueError("messages must contain between 1 and 30 items")
            for message in messages:
                if message.get("role") not in {"user", "assistant"} or not message.get("content"):
                    raise ValueError("invalid message")
            answer = ask_gemini(messages)
            json_response(
                self,
                HTTPStatus.OK,
                {"message": {"role": "assistant", "content": answer}, "model": MODEL},
            )
        except (KeyError, TypeError, ValueError, json.JSONDecodeError):
            json_response(self, HTTPStatus.BAD_REQUEST, {"error": "Please provide a valid conversation."})
        except (HTTPError, URLError, TimeoutError, RuntimeError):
            json_response(self, HTTPStatus.BAD_GATEWAY, {"error": "The model could not answer right now."})


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), SBHandler)
    print(f"SB.ai Python API listening on http://{HOST}:{PORT}")
    server.serve_forever()"""Small dependency-free Python API for SB.ai.

Run with:
    GEMINI_API_KEY=... python3 python-api/main.py

The API mirrors the workspace OpenAPI contract:
    POST /api/chat
    GET  /api/healthz
"""

from __future__ import annotations

import json
import os
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


MODEL = os.environ.get("GEMINI_MODEL", "gemini-3-flash-preview")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8001"))


def json_response(handler: BaseHTTPRequestHandler, status: int, payload: dict) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.end_headers()
    handler.wfile.write(body)


def ask_gemini(messages: list[dict[str, str]]) -> str:
    contents = [
        {
            "role": "model" if message["role"] == "assistant" else "user",
            "parts": [{"text": message["content"]}],
        }
        for message in messages
    ]
    payload = {
        "contents": contents,
        "systemInstruction": {
            "parts": [
                {
                    "text": "You are SB.ai, a helpful, concise, and thoughtful open-source AI assistant. Answer clearly and be honest when you are uncertain."
                }
            ]
        },
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 8192},
    }
    request = Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={GEMINI_API_KEY}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=90) as response:
        result = json.loads(response.read().decode("utf-8"))

    parts = result.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    answer = "".join(part.get("text", "") for part in parts).strip()
    if not answer:
        raise RuntimeError("Gemini returned an empty response")
    return answer


class SBHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        print(f"[sb.ai] {format % args}")

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_GET(self) -> None:
        if self.path.rstrip("/") in {"/api/healthz", "/python-api/healthz"}:
            json_response(self, HTTPStatus.OK, {"status": "ok"})
            return
        json_response(self, HTTPStatus.NOT_FOUND, {"error": "Not found"})

    def do_POST(self) -> None:
        if self.path.rstrip("/") not in {"/api/chat", "/python-api/chat"}:
            json_response(self, HTTPStatus.NOT_FOUND, {"error": "Not found"})
            return
        if not GEMINI_API_KEY:
            json_response(self, HTTPStatus.SERVICE_UNAVAILABLE, {"error": "Gemini is not configured yet."})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            messages = body["messages"]
            if not isinstance(messages, list) or not 1 <= len(messages) <= 30:
                raise ValueError("messages must contain between 1 and 30 items")
            for message in messages:
                if message.get("role") not in {"user", "assistant"} or not message.get("content"):
                    raise ValueError("invalid message")
            answer = ask_gemini(messages)
            json_response(
                self,
                HTTPStatus.OK,
                {"message": {"role": "assistant", "content": answer}, "model": MODEL},
            )
        except (KeyError, TypeError, ValueError, json.JSONDecodeError):
            json_response(self, HTTPStatus.BAD_REQUEST, {"error": "Please provide a valid conversation."})
        except (HTTPError, URLError, TimeoutError, RuntimeError):
            json_response(self, HTTPStatus.BAD_GATEWAY, {"error": "The model could not answer right now."})


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), SBHandler)
    print(f"SB.ai Python API listening on http://{HOST}:{PORT}")
    server.serve_forever()