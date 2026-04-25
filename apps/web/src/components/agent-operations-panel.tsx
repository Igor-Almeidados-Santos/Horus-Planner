"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ApiError,
  fetchAgentContext,
  sendAgentChatMessage,
  type AgentChatResult,
  type AgentContext,
} from "../services/horus-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const energyPatternLabels: Record<string, string> = {
  morning_peak: "Pico pela manha",
  balanced: "Distribuido ao longo do dia",
  afternoon_peak: "Pico a tarde",
  night_peak: "Pico a noite",
};

type AgentChatFormState = {
  message: string;
  planningHorizon: string;
  availableHoursPerDay: string;
  energyPattern: string;
  fixedCommitments: string;
  focusAreas: string;
};

type ChatEntry = {
  id: string;
  role: "user" | "assistant";
  title: string;
  body: string;
  meta?: string;
  questions?: string[];
  blueprintSummary?: string[];
};

const initialChatForm: AgentChatFormState = {
  message: "",
  planningHorizon: "weekly",
  availableHoursPerDay: "4",
  energyPattern: "balanced",
  fixedCommitments: "",
  focusAreas: "",
};

const suggestedPrompts = [
  "Monte um plano semanal de estudos com 3 horas por dia e prioridade para matematica e biologia.",
  "Crie uma tarefa para revisar biologia amanha as 09:00 com 45 minutos.",
  "Reorganize meu plano atual porque acumulei tarefas e estou com pouca energia esta semana.",
];

function buildAgentError(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildAssistantMeta(result: AgentChatResult) {
  const parts = [result.actionLabel, result.actionType !== "none" ? result.actionType : ""].filter(Boolean);
  return parts.join(" · ");
}

function buildBlueprintSummary(result: AgentChatResult) {
  const blueprint = result.planningBlueprint;
  if (!blueprint) {
    return [];
  }

  const routines = blueprint.plan?.routines ?? [];
  const tasks = routines.reduce((total, routine) => total + (routine.tasks?.length ?? 0), 0);

  return [
    `Objetivo: ${blueprint.goal.title}`,
    `Plano: ${blueprint.plan.title}`,
    `Horizonte: ${blueprint.plan.planningHorizon ?? "weekly"}`,
    `Estrutura: ${routines.length} rotinas e ${tasks} tarefas`,
  ];
}

export function AgentOperationsPanel() {
  const [context, setContext] = useState<AgentContext | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isChatBusy, setIsChatBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatForm, setChatForm] = useState<AgentChatFormState>(initialChatForm);
  const [chatEntries, setChatEntries] = useState<ChatEntry[]>([]);

  const actionSchemaUrl = `${API_URL}/api/gpt-actions/openapi.json`;
  const publishEndpoint = `${API_URL}/api/gpt-actions/plans`;

  const summary = useMemo(() => {
    if (!context) {
      return {
        activeGoals: 0,
        routines: 0,
        tasks: 0,
        consistencyScore: 0,
      };
    }

    const goals = context.goals ?? [];
    const routines = context.routines ?? [];
    const tasks = context.tasks ?? [];

    return {
      activeGoals: goals.filter((goal) => goal.status === "ACTIVE").length,
      routines: routines.length,
      tasks: tasks.length,
      consistencyScore: context.metrics?.consistencyScore ?? 0,
    };
  }, [context]);

  async function refreshContext() {
    setIsBusy(true);
    setError(null);

    try {
      const data = await fetchAgentContext();
      setContext(data);
    } catch (error) {
      setError(buildAgentError(error, "Nao foi possivel carregar o contexto do agente agora."));
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    void refreshContext();
  }, []);

  function updateChatForm<K extends keyof AgentChatFormState>(key: K, value: AgentChatFormState[K]) {
    setChatForm((current) => ({ ...current, [key]: value }));
  }

  async function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = chatForm.message.trim();
    if (!message) {
      setError("Escreva uma mensagem para o agente antes de enviar.");
      return;
    }

    const userEntry: ChatEntry = {
      id: `user-${Date.now()}`,
      role: "user",
      title: "Voce",
      body: message,
    };

    setChatEntries((current) => [...current, userEntry]);
    setIsChatBusy(true);
    setError(null);

    try {
      const focusAreas = splitCsv(chatForm.focusAreas);
      const fixedCommitments = splitCsv(chatForm.fixedCommitments);
      const response = await sendAgentChatMessage({
        message,
        hints: {
          planningHorizon: chatForm.planningHorizon,
          availableHoursPerDay: Number(chatForm.availableHoursPerDay) || 4,
          energyPattern: chatForm.energyPattern,
          fixedCommitments,
          focusAreas,
        },
      });

      const assistantEntry: ChatEntry = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        title: "Mestre Horus",
        body: response.assistantReply,
        meta: response.mutationSummary || buildAssistantMeta(response),
        questions: response.questions,
        blueprintSummary: buildBlueprintSummary(response),
      };

      setChatEntries((current) => [...current, assistantEntry]);
      setContext(response.context);
      setChatForm((current) => ({ ...current, message: "" }));
    } catch (error) {
      setChatEntries((current) => current.filter((entry) => entry.id !== userEntry.id));
      setError(buildAgentError(error, "Nao foi possivel conversar com o agente agora."));
    } finally {
      setIsChatBusy(false);
    }
  }

  return (
    <section className="surface-card">
      <div className="surface-card-head">
        <div>
          <div className="surface-eyebrow">GPT Actions</div>
          <h2>Integração com ChatGPT</h2>
        </div>
        <span className="surface-action">O plano nasce no GPT e entra no Horus via API</span>
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
              <span>Tarefas no sistema</span>
              <strong>{summary.tasks}</strong>
            </article>
          </div>

          <div className="operations-grid agent-operations-grid">
            <article className="task-quick-form">
              <div className="task-quick-form-head">
                <strong>Configuração no GPT Builder</strong>
                <span>
                  Crie o agente dentro do ChatGPT, adicione uma Action e importe o schema abaixo.
                </span>
              </div>

              <div className="agent-context-grid">
                <div className="secondary-row">
                  <span>OpenAPI schema</span>
                  <strong>{actionSchemaUrl}</strong>
                </div>
                <div className="secondary-row">
                  <span>Endpoint de publicação</span>
                  <strong>{publishEndpoint}</strong>
                </div>
                <div className="secondary-row">
                  <span>Autenticação</span>
                  <strong>API key no header x-horus-action-key</strong>
                </div>
              </div>

              <div className="planner-empty-state">
                No GPT Builder, use autenticação por API key com header customizado
                x-horus-action-key. A API espera a mesma chave em HORUS_GPT_ACTION_KEY.
              </div>

              <button className="task-submit-button" type="button" onClick={refreshContext} disabled={isBusy}>
                {isBusy ? "Atualizando..." : "Atualizar dados recebidos"}
              </button>
            </article>

            <div className="operations-task-stack">
              <article className="operations-task-card">
                <div className="operations-task-head">
                  <div>
                    <strong>Chat operacional</strong>
                    <span>Teste o agente dentro do app e veja mutacoes aplicadas no workspace</span>
                  </div>
                </div>

                <div className="agent-live-chat">
                  <div className="agent-chat-log agent-live-chat-log">
                    {chatEntries.length ? (
                      chatEntries.map((entry) => (
                        <article
                          key={entry.id}
                          className={`agent-chat-entry ${entry.role === "user" ? "from-user" : "from-assistant"}`}
                        >
                          <div className={`agent-chat-bubble ${entry.role}`}>
                            <strong>{entry.title}</strong>
                            <p>{entry.body}</p>
                            {entry.meta ? <em>{entry.meta}</em> : null}
                            {entry.blueprintSummary?.length ? (
                              <div className="agent-question-list">
                                {entry.blueprintSummary.map((item) => (
                                  <span key={item}>{item}</span>
                                ))}
                              </div>
                            ) : null}
                            {entry.questions?.length ? (
                              <div className="agent-question-list">
                                {entry.questions.map((question) => (
                                  <span key={question}>{question}</span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="planner-empty-state">
                        Envie um pedido como "crie uma tarefa para revisar biologia amanha as 09:00" ou
                        "monte um plano semanal de estudos com 3 horas por dia".
                      </div>
                    )}
                  </div>

                  <div className="quick-action-row">
                    {suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className="ghost-chip"
                        onClick={() => updateChatForm("message", prompt)}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  <form className="agent-chat-form" onSubmit={handleChatSubmit}>
                    <label>
                      <span>Mensagem para o agente</span>
                      <textarea
                        value={chatForm.message}
                        onChange={(event) => updateChatForm("message", event.target.value)}
                        placeholder="Descreva o que voce quer planejar, criar, atualizar ou replanejar."
                      />
                    </label>

                    <div className="task-quick-form-row">
                      <label>
                        <span>Horizonte</span>
                        <select
                          value={chatForm.planningHorizon}
                          onChange={(event) => updateChatForm("planningHorizon", event.target.value)}
                        >
                          <option value="daily">Diario</option>
                          <option value="weekly">Semanal</option>
                          <option value="biweekly">Quinzenal</option>
                          <option value="monthly">Mensal</option>
                        </select>
                      </label>

                      <label>
                        <span>Horas por dia</span>
                        <input
                          type="number"
                          min="1"
                          max="16"
                          value={chatForm.availableHoursPerDay}
                          onChange={(event) => updateChatForm("availableHoursPerDay", event.target.value)}
                        />
                      </label>

                      <label>
                        <span>Energia</span>
                        <select
                          value={chatForm.energyPattern}
                          onChange={(event) => updateChatForm("energyPattern", event.target.value)}
                        >
                          {Object.entries(energyPatternLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="task-quick-form-row">
                      <label>
                        <span>Areas de foco</span>
                        <input
                          type="text"
                          value={chatForm.focusAreas}
                          onChange={(event) => updateChatForm("focusAreas", event.target.value)}
                          placeholder="matematica, biologia, projeto final"
                        />
                      </label>

                      <label>
                        <span>Compromissos fixos</span>
                        <input
                          type="text"
                          value={chatForm.fixedCommitments}
                          onChange={(event) => updateChatForm("fixedCommitments", event.target.value)}
                          placeholder="aula 08:00, trabalho 14:00"
                        />
                      </label>
                    </div>

                    <button type="submit" disabled={isChatBusy || !context?.assistant?.enabled}>
                      {isChatBusy ? "Enviando..." : "Conversar com o agente"}
                    </button>
                  </form>

                  <div className="agent-context-grid">
                    <div className="secondary-row">
                      <span>Assistente interno</span>
                      <strong>
                        {context?.assistant?.enabled
                          ? `${context.assistant.provider} · ${context.assistant.model}`
                          : "OpenAI nao configurado"}
                      </strong>
                    </div>
                    <div className="secondary-row">
                      <span>Plano ativo</span>
                      <strong>{context?.activePlan?.title ?? "Nenhum agora"}</strong>
                    </div>
                    {!context?.assistant?.enabled ? (
                      <div className="planner-empty-state">
                        Configure `OPENAI_API_KEY` no backend para habilitar interpretacao conversacional completa.
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>

              <article className="operations-task-card">
                <div className="operations-task-head">
                  <div>
                    <strong>Fluxo esperado</strong>
                    <span>Responsabilidades separadas entre ChatGPT, API e frontend</span>
                  </div>
                </div>

                <div className="agent-routine-list">
                  <article className="agent-routine-card">
                    <div className="agent-routine-head">
                      <strong>1. ChatGPT</strong>
                      <span>conversa</span>
                    </div>
                    <div className="stacked-insights">
                      <div className="insight-row">
                        <span className="sidebar-dot" />
                        <span>Voce conversa com o GPT e ele monta objetivo, plano, rotinas e tarefas.</span>
                      </div>
                    </div>
                  </article>

                  <article className="agent-routine-card">
                    <div className="agent-routine-head">
                      <strong>2. API Horus</strong>
                      <span>persistencia</span>
                    </div>
                    <div className="stacked-insights">
                      <div className="insight-row">
                        <span className="sidebar-dot" />
                        <span>A Action envia o JSON estruturado para o endpoint e o backend salva no banco.</span>
                      </div>
                    </div>
                  </article>

                  <article className="agent-routine-card">
                    <div className="agent-routine-head">
                      <strong>3. Frontend</strong>
                      <span>visualizacao</span>
                    </div>
                    <div className="stacked-insights">
                      <div className="insight-row">
                        <span className="sidebar-dot" />
                        <span>O dashboard atualiza e apresenta metas, planos, rotinas e tarefas geradas.</span>
                      </div>
                    </div>
                  </article>
                </div>
              </article>

              <article className="operations-task-card">
                <div className="operations-task-head">
                  <div>
                    <strong>Historico recebido</strong>
                    <span>Ultimos planejamentos publicados por agente externo</span>
                  </div>
                </div>

                <div className="agent-chat-log">
                  {context?.recentSessions?.length ? (
                    context.recentSessions.map((session) => (
                      <article key={session.id} className="agent-chat-entry">
                        <div className="agent-chat-bubble assistant">
                          <strong>GPT externo</strong>
                          <p>{session.inputSummary}</p>
                          <em>{session.outputSummary}</em>
                          <span>{session.createdAt.slice(0, 16).replace("T", " ")}</span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="planner-empty-state">Nenhum planejamento recebido por Action ainda.</div>
                  )}
                </div>

                <div className="agent-context-grid">
                  <div className="secondary-row">
                    <span>Plano ativo</span>
                    <strong>{context?.activePlan?.title ?? "Nenhum agora"}</strong>
                  </div>
                  <div className="secondary-row">
                    <span>Consistencia</span>
                    <strong>{summary.consistencyScore}</strong>
                  </div>
                  <div className="secondary-row">
                    <span>Taxa de conclusao</span>
                    <strong>{context?.metrics?.completionRate ?? 0}%</strong>
                  </div>
                </div>
              </article>
            </div>
          </div>

          {error ? <div className="operation-feedback error">{error}</div> : null}
        </div>
      </div>
    </section>
  );
}
