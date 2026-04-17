import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-eyebrow">Horus Planner</div>
        <h1>Criar conta</h1>
        <p>Configure sua base inicial para planos, execucao e revisao.</p>
        <form className="auth-form">
          <label>
            Nome
            <input type="text" placeholder="Seu nome" />
          </label>
          <label>
            E-mail
            <input type="email" placeholder="voce@exemplo.com" />
          </label>
          <label>
            Senha
            <input type="password" placeholder="••••••••" />
          </label>
          <button type="submit">Criar conta</button>
        </form>
        <Link href="/login">Ja tem conta? Entrar</Link>
      </section>
    </main>
  );
}

