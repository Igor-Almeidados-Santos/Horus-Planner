"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { persistOnboardingStatus, storeAuthUser } from "../lib/auth-session";
import { fetchCurrentUser, updateCurrentProfile, type AuthUser } from "../services/horus-api";

type OnboardingFormState = {
  timezone: string;
  language: string;
  energyPattern: string;
  workStyle: string;
  studyStyle: string;
  sleepSchedule: string;
};

const initialFormState: OnboardingFormState = {
  timezone: "America/Sao_Paulo",
  language: "pt-BR",
  energyPattern: "morning_peak",
  workStyle: "deep_work",
  studyStyle: "active_recall",
  sleepSchedule: "23:00-07:00",
};

function buildStateFromUser(user: AuthUser): OnboardingFormState {
  return {
    timezone: user.profile?.timezone ?? initialFormState.timezone,
    language: user.profile?.language ?? initialFormState.language,
    energyPattern: user.profile?.energyPattern ?? initialFormState.energyPattern,
    workStyle: user.profile?.workStyle ?? initialFormState.workStyle,
    studyStyle: user.profile?.studyStyle ?? initialFormState.studyStyle,
    sleepSchedule: user.profile?.sleepSchedule ?? initialFormState.sleepSchedule,
  };
}

export function OnboardingFormPanel({ nextRoute = "/" }: { nextRoute?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<OnboardingFormState>(initialFormState);
  const [isBusy, setIsBusy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser()
      .then((user) => {
        setForm(buildStateFromUser(user));
        storeAuthUser({
          id: user.id,
          email: user.email,
          name: user.name,
          avatarLabel: user.avatarLabel,
        });
      })
      .catch(() => {
        setError("Nao foi possivel carregar seu perfil inicial.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  function updateField<K extends keyof OnboardingFormState>(key: K, value: OnboardingFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setError(null);

    try {
      await updateCurrentProfile({
        ...form,
        onboardingCompleted: true,
      });
      persistOnboardingStatus(true);
      router.push(nextRoute || "/");
      router.refresh();
    } catch {
      setError("Nao foi possivel salvar seu onboarding agora.");
      setIsBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card onboarding-card">
        <div className="auth-eyebrow">Horus Planner</div>
        <h1>Configurar seu workspace</h1>
        <p>Defina sua base operacional para o sistema organizar melhor plano, execucao e revisao.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Fuso horario
            <input
              value={form.timezone}
              onChange={(event) => updateField("timezone", event.target.value)}
              placeholder="America/Sao_Paulo"
              required
            />
          </label>

          <label>
            Idioma
            <input
              value={form.language}
              onChange={(event) => updateField("language", event.target.value)}
              placeholder="pt-BR"
              required
            />
          </label>

          <label>
            Pico de energia
            <select
              value={form.energyPattern}
              onChange={(event) => updateField("energyPattern", event.target.value)}
            >
              <option value="morning_peak">Manha forte</option>
              <option value="afternoon_peak">Tarde forte</option>
              <option value="night_peak">Noite forte</option>
              <option value="balanced">Distribuido</option>
            </select>
          </label>

          <label>
            Estilo de trabalho
            <select
              value={form.workStyle}
              onChange={(event) => updateField("workStyle", event.target.value)}
            >
              <option value="deep_work">Deep work</option>
              <option value="sprint_mode">Sprints curtos</option>
              <option value="mixed_mode">Modo misto</option>
            </select>
          </label>

          <label>
            Estilo de estudo
            <select
              value={form.studyStyle}
              onChange={(event) => updateField("studyStyle", event.target.value)}
            >
              <option value="active_recall">Active recall</option>
              <option value="spaced_repetition">Spaced repetition</option>
              <option value="project_based">Aprendizado por projetos</option>
              <option value="reading_notes">Leitura + notas</option>
            </select>
          </label>

          <label>
            Janela de sono
            <input
              value={form.sleepSchedule}
              onChange={(event) => updateField("sleepSchedule", event.target.value)}
              placeholder="23:00-07:00"
              required
            />
          </label>

          <button type="submit" disabled={isBusy || isLoading}>
            {isLoading ? "Carregando..." : isBusy ? "Salvando..." : "Concluir configuracao"}
          </button>
        </form>

        {error ? <div className="auth-feedback error">{error}</div> : null}
      </section>
    </main>
  );
}
