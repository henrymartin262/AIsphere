export default function AgentMemoryPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <section className="card p-8">
        <span className="badge">Memory Vault</span>
        <h1 className="mt-4 text-3xl font-semibold text-white">Agent #{params.id} 记忆浏览器</h1>
        <p className="mt-3 text-slate-300">
          后续会在这里接入分类筛选、加密状态、手动写入记忆和上下文构建可视化。
        </p>
      </section>
    </main>
  );
}
