import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-eyebrow">Horus Planner</div>
        <h1>Entrar</h1>
        <p>Continue para acessar sua rotina assistida por IA.</p>
        <form className="auth-form">
          <label>
            E-mail
            <input type="email" placeholder="voce@exemplo.com" />
          </label>
          <label>
            Senha
            <input type="password" placeholder="••••••••" />
          </label>
          <button type="submit">Entrar</button>
        </form>
        <Link href="/register">Nao tem conta? Criar conta</Link>
      </section>
    </main>
  );
}

