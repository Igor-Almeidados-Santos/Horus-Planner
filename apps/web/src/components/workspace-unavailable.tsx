import Link from "next/link";

export function WorkspaceUnavailable({
  message,
  isAuthenticated,
}: {
  message: string;
  isAuthenticated: boolean;
}) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-eyebrow">Horus Planner</div>
        <h1>Workspace indisponivel</h1>
        <p>{message}</p>
        <div className="operation-feedback error">
          {isAuthenticated
            ? "A sessao foi carregada, mas nao conseguimos buscar seus dados reais agora."
            : "O modo demonstracao nao foi ativado e nao ha dados locais para exibir com seguranca."}
        </div>
        <div className="workspace-unavailable-actions">
          <Link href="/">Tentar novamente</Link>
          {isAuthenticated ? <Link href="/login">Voltar para o login</Link> : <Link href="/login">Entrar</Link>}
        </div>
      </section>
    </main>
  );
}
