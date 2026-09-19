"""Group Aggregation API (Central API).

Calls every group member's private product API and merges the results into
one combined dataset, served at GET /api/products in the same JSON shape
that clustering.py already expects: {"items": [...], "total": N}.

This build is for a 3-person group where everyone runs the same MySQL/Node
API (like server.js). All three members need a JWT login the same way, so
all three are already wired in below — just rename "member1"/"member2"/
"member3" to real names and fill in each teammate's URL/credentials in .env.

GET /api/products now requires its own Bearer token, obtained by POSTing
{username, password} to POST /api/auth/login on this same aggregator (see
AGGREGATOR_USERNAME/PASSWORD/JWT_SECRET below) — separate from each
member's own login used internally to fetch their private data.

Run:
    pip install -r requirements.txt
    # put real values in a .env file next to this script (see .env keys below)
    python aggregator.py
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import Any

import jwt
import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request

load_dotenv()

app = Flask(__name__)

# ---------------------------------------------------------------------------
# 0) The aggregator's OWN login, separate from each member's login.
#
#    clustering.py logs in once against whatever "--api-url" it's pointed
#    at, then calls that same API with the returned Bearer token. Since
#    clustering.py now points at this aggregator (not one member directly),
#    the aggregator needs its own POST /api/auth/login and its own JWT
#    check on GET /api/products — otherwise clustering.py's login step
#    has nothing to call and fails with a 404.
#
#    Set these in .env: JWT_SECRET, AGGREGATOR_USERNAME, AGGREGATOR_PASSWORD.
#    This is a single shared login for whoever is allowed to run
#    clustering.py against the group's combined dataset — it is NOT the
#    same as any individual member's own username/password.
# ---------------------------------------------------------------------------
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRY_MINUTES = int(os.getenv("TOKEN_EXPIRY_MINUTES", "60"))
AGGREGATOR_USERNAME = os.getenv("AGGREGATOR_USERNAME")
AGGREGATOR_PASSWORD = os.getenv("AGGREGATOR_PASSWORD")


def create_token(username: str) -> str:
    payload = {
        "sub": username,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRY_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def require_auth(view):
    """Protects a route the same way each member's own API protects theirs."""

    @wraps(view)
    def wrapped(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header."}), 401
        token = auth_header.split(" ", 1)[1]
        try:
            jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired. Log in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token."}), 401
        return view(*args, **kwargs)

    return wrapped


@app.route("/api/auth/login", methods=["POST"])
def login():
    """Issue a JWT for the aggregator itself, mirroring each member's login."""
    if not JWT_SECRET:
        return jsonify({"error": "Aggregator is missing JWT_SECRET in .env."}), 500
    if not AGGREGATOR_USERNAME or not AGGREGATOR_PASSWORD:
        return (
            jsonify({"error": "Aggregator login is not configured. Set AGGREGATOR_USERNAME/PASSWORD in .env."}),
            500,
        )

    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")
    if username != AGGREGATOR_USERNAME or password != AGGREGATOR_PASSWORD:
        return jsonify({"error": "Invalid username or password."}), 401

    return jsonify({"token": create_token(username)})

# ---------------------------------------------------------------------------
# 1) Register every group member's API here.
#
#    Everyone runs the same MySQL/Node server (server.js), so every member
#    needs "auth": "jwt" — a Bearer token obtained by POSTing
#    {username, password} to that member's "login_url".
#
#    Never hard-code real URLs/usernames/passwords here — read them from
#    .env so nothing sensitive gets committed to Git.
# ---------------------------------------------------------------------------
MEMBERS: list[dict[str, Any]] = [
    {
        "name": "member1",  # TODO: rename to this teammate's actual name
        "url": os.getenv("MEMBER1_URL"),
        "auth": "jwt",
        "login_url": os.getenv("MEMBER1_LOGIN_URL"),
        "username": os.getenv("MEMBER1_USERNAME"),
        "password": os.getenv("MEMBER1_PASSWORD"),
    },
    {
        "name": "member2",  # TODO: rename to this teammate's actual name
        "url": os.getenv("MEMBER2_URL"),
        "auth": "jwt",
        "login_url": os.getenv("MEMBER2_LOGIN_URL"),
        "username": os.getenv("MEMBER2_USERNAME"),
        "password": os.getenv("MEMBER2_PASSWORD"),
    },
    {
        "name": "member3",  # TODO: rename to this teammate's actual name
        "url": os.getenv("MEMBER3_URL"),
        "auth": "jwt",
        "login_url": os.getenv("MEMBER3_LOGIN_URL"),
        "username": os.getenv("MEMBER3_USERNAME"),
        "password": os.getenv("MEMBER3_PASSWORD"),
    },
]

# Caches one JWT per member so we don't log in again on every request.
_token_cache: dict[str, str] = {}


def get_member_token(member: dict[str, Any]) -> str:
    """Log in to a member's API once and cache the returned JWT."""
    cached = _token_cache.get(member["name"])
    if cached:
        return cached

    if not member.get("username") or not member.get("password"):
        raise ValueError(
            f"Missing credentials for '{member['name']}'. "
            f"Set {member['name'].upper()}_USERNAME / _PASSWORD in .env."
        )

    response = requests.post(
        member["login_url"],
        json={"username": member["username"], "password": member["password"]},
        timeout=15,
    )
    response.raise_for_status()
    token = response.json().get("token")
    if not token:
        raise ValueError(f"Login to '{member['name']}' did not return a token.")

    _token_cache[member["name"]] = token
    return token


def fetch_member_products(member: dict[str, Any]) -> list[dict[str, Any]]:
    """Fetch and tag one member's product list."""
    headers: dict[str, str] = {}
    if member["auth"] == "jwt":
        headers["Authorization"] = f"Bearer {get_member_token(member)}"

    response = requests.get(
        member["url"],
        params={"page": 1, "limit": 100},
        headers=headers,
        timeout=15,
    )
    response.raise_for_status()
    payload = response.json()

    # TODO: every member must return the same shape as the MySQL API does:
    # {"items": [{id, name, category, price, stock, monthly_sales, ...}], ...}
    # If a teammate's API returns a bare list instead of {"items": [...]},
    # the line below already falls back to handling that.
    items = payload.get("items", payload) if isinstance(payload, dict) else payload

    for item in items:
        item["source"] = member["name"]  # trace which member each row came from
    return items


@app.route("/api/products", methods=["GET"])
@require_auth
def aggregate_products():
    """Combine every member's products into one dataset."""
    combined: list[dict[str, Any]] = []
    errors: dict[str, str] = {}

    for member in MEMBERS:
        try:
            combined.extend(fetch_member_products(member))
        except Exception as exc:  # noqa: BLE001 - keep going, report per-member
            errors[member["name"]] = str(exc)

    # TODO: if the same product could appear from more than one member,
    # dedupe/merge here (e.g. by product id) before returning.

    return jsonify(
        {
            "items": combined,
            "total": len(combined),
            "sources": [m["name"] for m in MEMBERS],
            "errors": errors,  # empty when every member responded fine
        }
    )


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "members": [m["name"] for m in MEMBERS]})


if __name__ == "__main__":
    port = int(os.getenv("PORT", "4000"))
    app.run(host="0.0.0.0", port=port, debug=True)
    