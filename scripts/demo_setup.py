#!/usr/bin/env python3
"""
SealMind Demo Setup Script
===========================
Seeds demo data for Demo Day presentation:
- Aria (DeFi Analysis Agent) with pre-loaded experiences
- OpenClaw Bot with Hive Mind contributions
- Sample bounties in various states
- MCP auto-onboard simulation

Usage:
  cd SealMind && python scripts/demo_setup.py [--api http://localhost:4000]
"""

import json
import sys
import time
import requests
from datetime import datetime, timedelta

API_BASE = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].startswith("http") else "http://localhost:4000"

def api(method, path, body=None):
    url = f"{API_BASE}{path}"
    headers = {"Content-Type": "application/json"}
    try:
        if method == "GET":
            r = requests.get(url, headers=headers, timeout=10)
        else:
            r = requests.post(url, headers=headers, json=body, timeout=15)
        return r.json()
    except Exception as e:
        print(f"  ⚠ {method} {path} failed: {e}")
        return None

def main():
    print("=" * 60)
    print("🎬 SealMind Demo Setup Script")
    print("=" * 60)
    print(f"API: {API_BASE}")
    print()

    # ── Health check ──
    health = api("GET", "/api/health")
    if not health:
        print("❌ Backend not reachable. Start backend first.")
        return
    print("✅ Backend is healthy")
    print()

    # ── Step 1: Seed Aria (DeFi Analysis Agent) ──
    print("📌 Step 1: Creating Aria (DeFi Analysis Agent)")
    aria = api("POST", "/api/agents", {
        "name": "Aria",
        "model": "GLM-4.7",
        "walletAddress": "0xc2a5548C420917244DA018A956DD33C551d42A93",
        "personality": "Expert DeFi analyst specializing in on-chain metrics and yield strategies"
    })
    aria_id = aria.get("data", {}).get("agentId", aria.get("agentId", 100)) if aria else 100
    print(f"  → Aria created: Agent #{aria_id}")

    # Certify Aria with Passport
    print("  → Certifying Aria with Passport...")
    api("POST", "/api/passport/register", {"agentId": str(aria_id)})
    print("  ✅ Aria certified")

    # Seed Aria's experiences
    print("  → Seeding Aria's soul experiences...")
    experiences = [
        {"type": "inference", "category": "defi_analysis", "content": "Analyzed ETH/USDT 30-day trend using MA crossover + RSI divergence", "outcome": "success", "importance": 0.85, "learnings": ["MA crossover effective in trending markets"]},
        {"type": "bounty", "category": "bounty_completion", "content": "Completed DeFi yield comparison task for 0.5 A0GI bounty", "outcome": "success", "importance": 0.9, "learnings": ["Yield farming APY > 100% unsustainable beyond 30 days"]},
        {"type": "inference", "category": "defi_analysis", "content": "On-chain whale tracking: wallets >1% supply correlate with price moves", "outcome": "success", "importance": 0.88, "learnings": ["Whale movement predicts 5%+ price change 60% of time"]},
        {"type": "knowledge", "category": "knowledge_acquisition", "content": "Learned 0G Network TPS patterns: peak during UTC 2-8 off-peak hours", "outcome": "success", "importance": 0.7, "learnings": ["Schedule heavy ops during off-peak for lower gas"]},
        {"type": "interaction", "category": "agent_collaboration", "content": "Collaborated with Code Review Agent on smart contract audit", "outcome": "success", "importance": 0.75, "learnings": ["Cross-agent collaboration improves audit quality"]},
    ]
    for exp in experiences:
        api("POST", f"/api/soul/{aria_id}/experience", exp)
    print(f"  ✅ {len(experiences)} experiences seeded")
    print()

    # ── Step 2: Seed OpenClaw Bot ──
    print("📌 Step 2: Creating OpenClaw Bot")
    bot = api("POST", "/api/agents", {
        "name": "OpenClaw Bot",
        "model": "GPT-4o",
        "walletAddress": "0x0000000000000000000000000000000000000001",
        "personality": "General-purpose task processor, discovers and executes via MCP"
    })
    bot_id = bot.get("data", {}).get("agentId", bot.get("agentId", 101)) if bot else 101
    print(f"  → OpenClaw Bot created: Agent #{bot_id}")

    # Certify
    api("POST", "/api/passport/register", {"agentId": str(bot_id)})
    print("  ✅ OpenClaw Bot certified")

    # Connect to Hive Mind
    api("POST", f"/api/hivemind/connect/{bot_id}")
    print("  ✅ Connected to Hive Mind")
    print()

    # ── Step 3: Hive Mind contributions ──
    print("📌 Step 3: Contributing to Hive Mind")
    contributions = [
        {"agentId": aria_id, "experienceType": "defi_analysis", "content": "Moving average crossover most reliable on 4h-1d timeframes for trending markets", "outcome": "success", "soulHash": "0x" + "a" * 64},
        {"agentId": bot_id, "experienceType": "code_review", "content": "Smart contract CEI pattern prevents reentrancy; always update state before external calls", "outcome": "success", "soulHash": "0x" + "b" * 64},
        {"agentId": aria_id, "experienceType": "bounty_completion", "content": "Clear acceptance criteria in bounties reduce dispute rate by 70%", "outcome": "success", "soulHash": "0x" + "c" * 64},
    ]
    for c in contributions:
        api("POST", "/api/hivemind/contribute", c)
    print(f"  ✅ {len(contributions)} Hive Mind contributions added")
    print()

    # ── Step 4: Sample bounties ──
    print("📌 Step 4: Creating sample bounties")
    bounties = [
        {"title": "Analyze 0G Token 30-Day Trend", "description": "Provide comprehensive analysis of 0G token price movement, volume, and on-chain metrics for the past 30 days.", "reward": "0.5", "deadline": (datetime.now() + timedelta(days=7)).isoformat() + "Z"},
        {"title": "Smart Contract Security Audit", "description": "Review the SealMind INFT contract for potential vulnerabilities. Focus on reentrancy, access control, and integer overflow.", "reward": "1.0", "deadline": (datetime.now() + timedelta(days=14)).isoformat() + "Z"},
        {"title": "Generate DeFi Report for Hackathon", "description": "Create a comprehensive DeFi ecosystem report covering yield farming, DEX liquidity, and lending protocol metrics.", "reward": "0.3", "deadline": (datetime.now() + timedelta(days=5)).isoformat() + "Z"},
    ]
    for b in bounties:
        api("POST", "/api/bounty", b)
    print(f"  ✅ {len(bounties)} bounties created")
    print()

    # ── Step 5: MCP auto-onboard simulation ──
    print("📌 Step 5: Simulating MCP auto-onboard flow")
    print("  → Gateway discover...")
    discover = api("POST", "/api/gateway/discover")
    if discover:
        actions = discover.get("data", {}).get("actions", discover.get("actions", []))
        print(f"  ✅ Discovered {len(actions)} available actions")
    else:
        print("  ⚠ Gateway discover not available (non-critical)")
    print()

    # ── Summary ──
    print("=" * 60)
    print("🎬 Demo Setup Complete!")
    print("=" * 60)
    print(f"  Aria (Agent #{aria_id}): DeFi analyst with {len(experiences)} experiences")
    print(f"  OpenClaw Bot (Agent #{bot_id}): MCP-ready, Hive Mind connected")
    print(f"  Bounties: {len(bounties)} open tasks")
    print(f"  Hive Mind: {len(contributions)} new contributions")
    print()
    print("📋 Demo Script (3 minutes):")
    print("  0:00 - Connect wallet → Show architecture")
    print("  0:30 - Create Agent (Aria) → Passport certification → Soul signature")
    print("  1:30 - Chat with Aria → Show TEE/Real badge → View proof")
    print("  2:00 - Bounty Board → Accept task → Submit result")
    print("  2:30 - Hive Mind → Show collective intelligence → Agent connects")
    print("  3:00 - Soul page → Growth curve → Verify integrity")
    print()

if __name__ == "__main__":
    main()
