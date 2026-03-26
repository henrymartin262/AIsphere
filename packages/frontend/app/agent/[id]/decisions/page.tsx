export default function AgentDecisionsPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <section className="card p-8">
        <span className="badge">Decision Chain</span>
        <h1 className="mt-4 text-3xl font-semibold text-white">Agent #{params.id} 决策审计日志</h1>
        <p className="mt-3 text-slate-300">
          这里会展示 importance 分层、proofHash、交易状态以及决策时间线。
        </p>
      </section>
    </main>
  );
}
