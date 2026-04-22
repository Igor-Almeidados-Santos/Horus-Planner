"use client";

import { useDeferredValue, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  createAgentPlan,
  fetchAgentContext,
  requestAgentReplan,
  type AgentContext,
  type AgentPlanInput,
  type AgentPlanResult,
} from "../services/horus-api";

const energyPatternLabels: Record<string, string> = {
  morning_peak: "Pico pela manha",
  balanced: "Distribuido ao longo do dia",
  afternoon_peak: "Pico a tarde",
  night_peak: "Pico a noite",
};

type AgentFormState = {
  briefing: string;
  focusAreas: string;
  planningHorizon: string;
  availableHoursPerDay: string;
  energyPattern: string;
  fixedCommitments: string;
};

const initialAgentForm: AgentFormState = {
  briefing: "",
  focusAreas: "",
  planningHorizon: "weekly",
  availableHoursPerDay: "4",
  energyPattern: "morning_peak",
  fixedCommitments: "",
};

function parseFocusAreas(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function buildChatBriefing(form: AgentFormState, focusAreas: string[]) {
  const sections = [form.briefing.trim()];

  if (focusAreas.length) {
    sections.push(`Areas de foco citadas: ${focusAreas.join(", ")}.`);
  }

  sections.push(`Horizonte desejado: ${form.planningHorizon}.`);
  sections.push(`Horas disponiveis por dia: ${form.availableHoursPerDay}.`);
  sections.push(`Padrao de energia: ${form.energyPattern}.`);

  const commitments = form.fixedCommitments
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (commitments.length) {
    sections.push(`Compromissos fixos: ${commitments.join(", ")}.`);
  }

  return sections.filter(Boolean).join("\n");
}

function buildAgentError(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function AgentOperationsPanel() {
  const router = useRouter();
  const [context, setContext] = useState<AgentContext | null>(null);
  const [form, setForm] = useState<AgentFormState>(initialAgentForm);
  const [replanReason, setReplanReason] = useState("");
  const [latestPlan, setLatestPlan] = useState<AgentPlanResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deferredFocusAreas = useDeferredValue(form.focusAreas);
  const focusAreas = useMemo(() => parseFocusAreas(deferredFocusAreas), [deferredFocusAreas]);

  const summary = useMemo(() => {
    if (!context) {
      return {
        activeGoals: 0,
        routines: 0,
        tasks: 0,
        consistencyScore: 0,
      };
    }

    return {
      activeGoals: context.goals.filter((goal) => goal.status === "ACTIVE").length,
      routines: context.routines.length,
      tasks: context.tasks.length,
      consistencyScore: context.metrics.consistencyScore,
    };
  }, [context]);

  async function refreshContext() {
    setIsBusy(true);
    const data = await fetchAgentContext();
    setContext(data);
    setIsBusy(false);
  }

  useEffect(() => {
    refreshContext()
      .then(() => setError(null))
      .catch(() => {
        setError("Nao foi possivel carregar o contexto do agente agora.");
        setIsBusy(false);
      });
  }, []);

  function updateForm<K extends keyof AgentFormState>(key: K, value: AgentFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleCreateAgentPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.briefing.trim()) {
      setError("Envie um briefing no chat para o GPT montar o planejamento completo.");
      return;
    }

    setIsBusy(true);
    setFeedback(null);
    setError(null);

    const composedBriefing = buildChatBriefing(form, focusAreas);
    const payload: AgentPlanInput = {
      briefing: composedBriefing,
      constraints: {
        availableHoursPerDay: Math.max(1, Number(form.availableHoursPerDay)),
        fixedCommitments: form.fixedCommitments
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        energyPattern: form.energyPattern,
      },
      plan: {
        planningHorizon: form.planningHorizon,
      },
    };

    try {
      const result = await createAgentPlan(payload);
      setLatestPlan(result);
      const generatorLabel = result.generator === "openai" ? "com OpenAI" : "em modo local";
      const notes =
        result.assistantNotes.length > 0 ? ` Ajustes do agente: ${result.assistantNotes.join(" | ")}.` : "";
      setFeedback(
        `Planejamento completo ${generatorLabel} aplicado no workspace com ${result.routines.length} rotinas e ${result.tasksCreated} tarefas. A API, o banco e o frontend foram atualizados com a nova estrutura.${notes}`,
      );
      setForm({
        ...initialAgentForm,
        availableHoursPerDay: form.availableHoursPerDay,
        energyPattern: form.energyPattern,
      });
      await refreshContext();
      router.refresh();
    } catch (error) {
      setError(buildAgentError(error, "Nao foi possivel gerar o plano assistido agora."));
      setIsBusy(false);
    }
  }

  async function handleReplan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!replanReason.trim()) {
      setError("Explique rapidamente o motivo do replanejamento.");
      return;
    }

    setIsBusy(true);
    setFeedback(null);
    setError(null);

    try {
      const result = await requestAgentReplan({
        reason: replanReason.trim(),
        planId: context?.activePlan?.id,
      });
      const notes =
        result.assistantNotes.length > 0 ? ` Ajustes do agente: ${result.assistantNotes.join(" | ")}.` : "";
      setFeedback(
        `Versao ${result.newVersion} criada com ${result.tasksMigrated} tarefas migradas e ${result.routinesCloned} rotinas clonadas.${notes}`,
      );
      setReplanReason("");
      await refreshContext();
      router.refresh();
    } catch (error) {
      setError(buildAgentError(error, "Nao foi possivel pedir um replanejamento agora."));
      setIsBusy(false);
    }
  }

  return (
    <section className="surface-card">
      <div className="surface-card-head">
        <div>
          <div className="surface-eyebrow">Agent Planner</div>
          <h2>Planejamento assistido</h2>
        </div>
        <span className="surface-action">Transforme um briefing em objetivo, plano, rotinas e tarefas</span>
      </div>

      <div className="surface-card-body">
        <div className="operations-panel">
          <div className="operations-summary-grid">
            <article className="operations-summary-card">
              <span>Objetivos ativos</span>
              <strong>{summary.activeGoals}</strong>
            </article>
            <article className="operations-summary-card">
              <span>Rotinas mapeadas</span>
              <strong>{summary.routines}</strong>
            </article>
            <article className="operations-summary-card">
              <span>Consistencia</span>
              <strong>{summary.consistencyScore}</strong>
            </article>
          </div>

          <div className="operations-grid agent-operations-grid">
            <form className="task-quick-form" onSubmit={handleCreateAgentPlan}>
              <div className="task-quick-form-head">
                <strong>Chat de planejamento</strong>
                <span>Escreva livremente. O GPT transforma o briefing em objetivo, plano, rotinas e tarefas.</span>
              </div>

              <label>
                <span>Mensagem para o GPT</span>
                <textarea
                  value={form.briefing}
                  onChange={(event) => updateForm("briefing", event.target.value)}
                  placeholder="Ex: tenho prova de calculo em 12 dias, biologia em 18 dias e preciso conciliar estagio a tarde. Quero um planejamento completo com rotinas, tarefas diarias, revisoes e distribuicao de carga nas proximas 3 semanas."
                  rows={7}
                  required
                />
              </label>

              <label>
                <span>Areas de foco opcionais</span>
                <input
                  value={form.focusAreas}
                  onChange={(event) => updateForm("focusAreas", event.target.value)}
                  placeholder="Ex: Biologia, Calculo, Redacao"
                />
              </label>

              <div className="task-quick-form-row">
                <label>
                  <span>Horizonte desejado</span>
                  <select
                    value={form.planningHorizon}
                    onChange={(event) => updateForm("planningHorizon", event.target.value)}
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quinzenal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </label>

                <label>
                  <span>Horas disponiveis por dia</span>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    step="1"
                    value={form.availableHoursPerDay}
                    onChange={(event) => updateForm("availableHoursPerDay", event.target.value)}
                    required
                  />
                </label>

                <label>
                  <span>Padrao de energia</span>
                  <select
                    value={form.energyPattern}
                    onChange={(event) => updateForm("energyPattern", event.target.value)}
                  >
                    {Object.entries(energyPatternLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                <span>Compromissos fixos</span>
                <input
                  value={form.fixedCommitments}
                  onChange={(event) => updateForm("fixedCommitments", event.target.value)}
                  placeholder="Ex: Aula 08:00, Estagio 14:00, Academia 19:00"
                />
              </label>

              <button className="task-submit-button" type="submit" disabled={isBusy}>
                {isBusy ? "Planejando..." : "Enviar para o GPT e aplicar no workspace"}
              </button>
            </form>

            <div className="operations-task-stack">
              <article className="operations-task-card">
                <div className="operations-task-head">
                  <div>
                    <strong>Plano gerado pelo GPT</strong>
                    <span>
                      Estrutura que sera salva na API, persistida no banco e refletida no dashboard
                      {context?.assistant
                        ? ` · ${context.assistant.enabled ? `OpenAI ativa (${context.assistant.model})` : "modo local ativo"}`
                        : ""}
                    </span>
                  </div>
                </div>

                <div className="agent-routine-list">
                  {latestPlan?.planningBlueprint.plan.routines?.length ? (
                    latestPlan.planningBlueprint.plan.routines.map((routine) => (
                      <article key={routine.name} className="agent-routine-card">
                        <div className="agent-routine-head">
                          <strong>{routine.name}</strong>
                          <span>{routine.timePreference}</span>
                        </div>
                        <div className="stacked-insights">
                          {(routine.tasks ?? []).map((task) => (
                            <div key={task.title} className="insight-row">
                              <span className="sidebar-dot" />
                              <span>{task.title}</span>
                            </div>
                          ))}
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="planner-empty-state">
                      Envie um briefing no chat. O GPT vai devolver o planejamento completo e ele aparecera aqui assim que for aplicado.
                    </div>
                  )}
                </div>
              </article>

              <article className="operations-task-card">
                <div className="operations-task-head">
                  <div>
                    <strong>Historico do agente</strong>
                    <span>
                      Conversas e planejamentos recentes enviados para o workspace
                    </span>
                  </div>
                </div>

                <div className="agent-chat-log">
                  {context?.recentSessions?.length ? (
                    context.recentSessions.map((session) => (
                      <article key={session.id} className="agent-chat-entry">
                        <div className="agent-chat-bubble user">
                          <strong>Voce</strong>
                          <p>{session.inputSummary}</p>
                        </div>
                        <div className="agent-chat-bubble assistant">
                          <strong>GPT</strong>
                          <p>{session.outputSummary}</p>
                          <span>{session.createdAt.slice(0, 16).replace("T", " ")}</span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="planner-empty-state">Nenhuma conversa com o agente registrada ainda.</div>
                  )}
                </div>

                <div className="agent-context-grid">
                  <div className="secondary-row">
                    <span>Plano ativo</span>
                    <strong>{context?.activePlan?.title ?? "Nenhum agora"}</strong>
                  </div>
                  <div className="secondary-row">
                    <span>Tarefas no sistema</span>
                    <strong>{summary.tasks}</strong>
                  </div>
                  <div className="secondary-row">
                    <span>Taxa de conclusao</span>
                    <strong>{context?.metrics.completionRate ?? 0}%</strong>
                  </div>
                  <div className="secondary-row">
                    <span>Assistente</span>
                    <strong>
                      {context?.assistant?.enabled
                        ? `OpenAI · ${context.assistant.model}`
                        : "Fallback local"}
                    </strong>
                  </div>
                </div>

                <form className="agent-replan-form" onSubmit={handleReplan}>
                  <label>
                    <span>Motivo para replanejar</span>
                    <textarea
                      value={replanReason}
                      onChange={(event) => setReplanReason(event.target.value)}
                      placeholder="Ex: muitas tarefas ficaram acumuladas na noite e preciso redistribuir a carga"
                      rows={3}
                    />
                  </label>

                  <button type="submit" disabled={isBusy}>
                    Solicitar replanejamento
                  </button>
                </form>
              </article>
            </div>
          </div>

          {feedback ? <div className="operation-feedback success">{feedback}</div> : null}
          {error ? <div className="operation-feedback error">{error}</div> : null}
        </div>
      </div>
    </section>
  );
}
