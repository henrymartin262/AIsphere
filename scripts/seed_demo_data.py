#!/usr/bin/env python3
"""
SealMind Demo Data Seeder
用途：在后端启动后，通过 API 预置演示数据，方便 Demo Day 展示。
用法：uv run python scripts/seed_demo_data.py
"""

import httpx
import time
import sys

API_BASE = "http://localhost:4000/api"
DEMO_WALLET = "0xDemo1111111111111111111111111111111111111"


def create_agent(name: str, model: str, description: str, personality: str) -> dict:
    """创建演示 Agent"""
    resp = httpx.post(
        f"{API_BASE}/agents",
        json={
            "name": name,
            "model": model,
            "description": description,
            "personality": personality,
            "ownerAddress": DEMO_WALLET,
        },
        headers={"x-wallet-address": DEMO_WALLET},
    )
    data = resp.json()
    agent_id = data.get("data", {}).get("agentId")
    print(f"  ✅ Agent '{name}' 创建成功: ID={agent_id}")
    return data.get("data", {})


def chat_with_agent(agent_id: int, message: str, importance: int = 3) -> dict:
    """与 Agent 对话"""
    resp = httpx.post(
        f"{API_BASE}/chat/{agent_id}",
        json={"message": message, "importance": importance},
        headers={"x-wallet-address": DEMO_WALLET},
        timeout=30,
    )
    data = resp.json()
    if data.get("data", {}).get("response"):
        proof_hash = data["data"].get("proof", {}).get("proofHash", "")
        preview = proof_hash[:20] if proof_hash else "(no hash)"
        print(f"  💬 对话成功，proofHash: {preview}...")
    return data.get("data", {})


def main():
    print("🌱 SealMind Demo Data Seeder")
    print("=" * 50)

    # 检查后端是否运行
    try:
        health = httpx.get(f"{API_BASE}/health", timeout=5)
        print(f"✅ 后端运行中: {health.json().get('status')}")
    except Exception as e:
        print(f"❌ 后端未运行: {e}")
        print("请先启动后端: cd packages/backend && pnpm dev")
        sys.exit(1)

    print()

    # ── 创建演示 Agent ──
    print("📦 创建演示 Agent...")

    agents = [
        {
            "name": "Aria — Research Analyst",
            "model": "deepseek-chat",
            "description": "专注于区块链和 DeFi 领域的研究分析助手，能够深入分析项目、市场趋势和技术架构。",
            "personality": (
                "你是 Aria，一位专业的区块链研究分析师。"
                "你擅长深度分析 DeFi 协议、NFT 市场和 Web3 基础设施。"
                "你的回答总是有条理、数据驱动，并包含实用的见解。"
            ),
        },
        {
            "name": "Kira — Code Wizard",
            "model": "deepseek-chat",
            "description": "全栈智能编程助手，精通 Solidity、TypeScript 和 Rust，专注于 Web3 开发。",
            "personality": (
                "你是 Kira，一位精通 Web3 的全栈开发者。"
                "你擅长 Solidity 合约、TypeScript/React 前端、Rust 性能优化。"
                "你总是给出可运行的代码示例，并解释最佳实践。"
            ),
        },
        {
            "name": "Orion — Creative Strategist",
            "model": "deepseek-chat",
            "description": "创意策略师，帮助 Web3 项目设计品牌叙事、社区运营和营销策略。",
            "personality": (
                "你是 Orion，一位 Web3 领域的创意策略师。"
                "你擅长品牌定位、社区建设、内容创作和 GTM 策略。"
                "你的建议总是新颖、有创意，并且考虑到 Web3 用户的特点。"
            ),
        },
    ]

    created_agents = []
    for agent_data in agents:
        result = create_agent(**agent_data)
        created_agents.append(result)
        time.sleep(0.5)

    print()

    # ── 演示对话 ──
    print("💬 预置演示对话...")

    if created_agents and created_agents[0].get("agentId"):
        agent_id = created_agents[0]["agentId"]
        conversations = [
            ("What is 0G Network and why is it important for AI agents?", 4),
            ("Explain the concept of TEE-verified inference and its benefits.", 3),
            ("How does SealMind's Memory Vault protect agent privacy?", 5),
        ]
        for msg, importance in conversations:
            chat_with_agent(agent_id, msg, importance)
            time.sleep(1)

    print()
    print("=" * 50)
    print("✅ Demo 数据预置完成！")
    print()
    print("📋 已创建:")
    for i, a in enumerate(created_agents):
        if a.get("agentId"):
            print(f"  Agent #{a['agentId']}: {agents[i]['name']}")
    print()
    print("🚀 现在可以启动前端演示了！")


if __name__ == "__main__":
    main()
