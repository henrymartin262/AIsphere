#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# AIsphere — One-Click Deploy Script
# Usage:  ./scripts/deploy.sh [--local|--public]
#   --local   Start backend + frontend on localhost only (default)
#   --public  Also establish SSH tunnel to 43.140.200.198 for public access
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

# ─── Config ───────────────────────────────────────────────────────
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/packages/backend"
FRONTEND_DIR="$ROOT_DIR/packages/frontend"
BACKEND_LOG="/tmp/aisphere-backend.log"
FRONTEND_LOG="/tmp/aisphere-frontend.log"
TUNNEL_LOG="/tmp/aisphere-tunnel.log"
REMOTE_HOST="root@43.140.200.198"
MODE="${1:---local}"

# ─── Colors ───────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[AIsphere]${NC} $1"; }
ok()   { echo -e "${GREEN}  ✅ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠️  $1${NC}"; }
fail() { echo -e "${RED}  ❌ $1${NC}"; exit 1; }

# ─── Cleanup old processes ────────────────────────────────────────
cleanup() {
    log "Stopping existing services..."
    # Kill old backend/frontend
    pkill -f "tsx.*src/index" 2>/dev/null || true
    pkill -f "next-server" 2>/dev/null || true
    # Kill old tunnel (but not the autossh 2222 tunnel)
    ps aux | grep "ssh.*-R.*3000.*43.140" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true
    # Free ports
    lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
    lsof -ti:4000 2>/dev/null | xargs kill -9 2>/dev/null || true
    sleep 2
    ok "Old processes cleaned"
}

# ─── Install dependencies ─────────────────────────────────────────
install_deps() {
    log "Checking dependencies..."
    cd "$ROOT_DIR"
    if [ ! -d "node_modules" ] || [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        log "Installing dependencies (pnpm install)..."
        pnpm install 2>&1 | tail -3
        ok "Dependencies installed"
    else
        ok "Dependencies already installed"
    fi
}

# ─── Build frontend ──────────────────────────────────────────────
build_frontend() {
    log "Building frontend..."
    cd "$FRONTEND_DIR"
    if [ ! -d ".next" ] || [ "$ROOT_DIR/packages/frontend/app" -nt ".next" ]; then
        NEXT_PUBLIC_API_URL=/api npx next build 2>&1 | tail -5
        ok "Frontend built"
    else
        ok "Frontend already built (skip)"
    fi
}

# ─── Start backend ────────────────────────────────────────────────
start_backend() {
    log "Starting backend (port 4000)..."
    cd "$BACKEND_DIR"
    nohup npx tsx src/index.ts > "$BACKEND_LOG" 2>&1 &
    echo $! > /tmp/aisphere-backend.pid
    ok "Backend starting (PID: $!, log: $BACKEND_LOG)"
}

# ─── Start frontend ──────────────────────────────────────────────
start_frontend() {
    log "Starting frontend (port 3000)..."
    cd "$FRONTEND_DIR"
    nohup npx next start > "$FRONTEND_LOG" 2>&1 &
    echo $! > /tmp/aisphere-frontend.pid
    ok "Frontend starting (PID: $!, log: $FRONTEND_LOG)"
}

# ─── SSH tunnel ──────────────────────────────────────────────────
start_tunnel() {
    if [ "$MODE" != "--public" ]; then
        return
    fi
    log "Establishing SSH tunnel to $REMOTE_HOST..."
    nohup ssh -o StrictHostKeyChecking=no \
        -o ServerAliveInterval=30 \
        -o ServerAliveCountMax=3 \
        -R 0.0.0.0:3000:localhost:3000 \
        -R 0.0.0.0:4000:localhost:4000 \
        "$REMOTE_HOST" -N > "$TUNNEL_LOG" 2>&1 &
    echo $! > /tmp/aisphere-tunnel.pid
    ok "SSH tunnel starting (PID: $!, log: $TUNNEL_LOG)"
}

# ─── Health check ─────────────────────────────────────────────────
health_check() {
    log "Waiting for services to start (25s)..."
    sleep 25

    # Backend
    local backend_code
    backend_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/health 2>/dev/null || echo "000")
    if [ "$backend_code" = "200" ]; then
        ok "Backend: 200 OK"
    else
        warn "Backend: $backend_code (may still be starting, check $BACKEND_LOG)"
    fi

    # Frontend
    local frontend_code
    frontend_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
    if [ "$frontend_code" = "200" ]; then
        ok "Frontend: 200 OK"
    else
        warn "Frontend: $frontend_code (check $FRONTEND_LOG)"
    fi

    # Remote (if public mode)
    if [ "$MODE" = "--public" ]; then
        local remote_code
        remote_code=$(ssh -o ConnectTimeout=5 "$REMOTE_HOST" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000" 2>/dev/null || echo "000")
        if [ "$remote_code" = "200" ]; then
            ok "Remote (43.140.200.198:3000): 200 OK"
        else
            warn "Remote: $remote_code (check $TUNNEL_LOG)"
        fi
    fi
}

# ─── Summary ──────────────────────────────────────────────────────
summary() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  AIsphere deployed successfully!${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  Local:   ${GREEN}http://localhost:3000${NC}"
    echo -e "  API:     ${GREEN}http://localhost:4000/api/health${NC}"
    if [ "$MODE" = "--public" ]; then
        echo -e "  Public:  ${GREEN}http://43.140.200.198:3000${NC}"
    fi
    echo ""
    echo -e "  Logs:"
    echo -e "    Backend:  $BACKEND_LOG"
    echo -e "    Frontend: $FRONTEND_LOG"
    if [ "$MODE" = "--public" ]; then
        echo -e "    Tunnel:   $TUNNEL_LOG"
    fi
    echo ""
    echo -e "  Stop:  ${YELLOW}./scripts/deploy.sh stop${NC}"
    echo ""
}

# ─── Stop command ─────────────────────────────────────────────────
stop_all() {
    log "Stopping all AIsphere services..."
    pkill -f "tsx.*src/index" 2>/dev/null || true
    pkill -f "next-server" 2>/dev/null || true
    ps aux | grep "ssh.*-R.*3000.*43.140" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
    lsof -ti:4000 2>/dev/null | xargs kill -9 2>/dev/null || true
    rm -f /tmp/aisphere-*.pid
    ok "All services stopped"
    exit 0
}

# ─── Main ─────────────────────────────────────────────────────────
if [ "${1:-}" = "stop" ]; then
    stop_all
fi

echo ""
echo -e "${CYAN}🌐 AIsphere One-Click Deploy${NC}"
echo -e "${CYAN}   Mode: $([ "$MODE" = "--public" ] && echo "Public (SSH tunnel)" || echo "Local only")${NC}"
echo ""

cleanup
install_deps
build_frontend
start_backend
start_frontend
start_tunnel
health_check
summary
