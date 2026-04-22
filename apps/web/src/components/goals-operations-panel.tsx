"use client";

import { startTransition, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createGoal,
  fetchGoals,
  updateGoal,
  type CreateGoalInput,
  type GoalRecord,
  type GoalStatus,
} from "../services/horus-api";

const priorityOptions: Array<CreateGoalInput["priority"]> = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const statusOptions: GoalStatus[] = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"];
const todayPlusThirty = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10);

type GoalFormState = {
  title: string;
  description: string;
  category: string;
  priority: CreateGoalInput["priority"];
  targetDate: string;
};

const initialGoalForm: GoalFormState = {
  title: "",
  description: "",
  category: "Study",
  priority: "HIGH",
  targetDate: todayPlusThirty,
};

function priorityLabel(priority: CreateGoalInput["priority"]) {
  switch (priority) {
    case "CRITICAL":
      return "Critica";
    case "HIGH":
      return "Alta";
    case "MEDIUM":
      return "Media";
    default:
      return "Baixa";
  }
}

function goalStatusLabel(status: GoalStatus) {
  switch (status) {
    case "DRAFT":
      return "Rascunho";
    case "ACTIVE":
      return "Ativo";
    case "PAUSED":
      return "Pausado";
    case "COMPLETED":
      return "Concluido";
    default:
      return "Arquivado";
  }
}

export function GoalsOperationsPanel() {
  const router = useRouter();
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [form, setForm] = useState<GoalFormState>(initialGoalForm);
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeGoals = useMemo(
    () => goals.filter((goal) => goal.status !== "ARCHIVED").sort((a, b) => b.progress - a.progress),
    [goals],
  );

  const summary = useMemo(() => {
    const active = goals.filter((goal) => goal.status === "ACTIVE").length;
    const completed = goals.filter((goal) => goal.status === "COMPLETED").length;
    const averageProgress =
      goals.length > 0 ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) : 0;

    return { active, completed, averageProgress };
  }, [goals]);

  async function refreshGoals() {
    setIsBusy(true);
    const data = await fetchGoals();
    startTransition(() => {
      setGoals(data);
    });
    setIsBusy(false);
  }

  useEffect(() => {
    refreshGoals()
      .then(() => {
        setError(null);
      })
      .catch(() => {
        setError("Nao foi possivel carregar os objetivos agora.");
        setIsBusy(false);
      });
  }, []);

  function updateForm<K extends keyof GoalFormState>(key: K, value: GoalFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleCreateGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setError(null);
    setFeedback(null);

    createGoal({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      priority: form.priority,
      status: "ACTIVE",
      progress: 0,
      targetDate: form.targetDate,
    })
      .then(async () => {
        setFeedback("Objetivo criado e adicionado ao radar principal.");
        setForm(initialGoalForm);
        await refreshGoals();
        router.refresh();
      })
      .catch(() => {
        setError("Nao foi possivel criar o objetivo agora.");
        setIsBusy(false);
      });
  }

  function handleGoalStatus(goal: GoalRecord, status: GoalStatus) {
    setIsBusy(true);
    setError(null);
    setFeedback(null);

    updateGoal(goal.id, { status, progress: status === "COMPLETED" ? 100 : goal.progress })
      .then(async () => {
        setFeedback(`Objetivo "${goal.title}" atualizado.`);
        await refreshGoals();
        router.refresh();
      })
      .catch(() => {
        setError("Nao foi possivel atualizar o objetivo.");
        setIsBusy(false);
      });
  }

  return (
    <section className="surface-card">
      <div className="surface-card-head">
        <div>
          <div className="surface-eyebrow">Goals Ops</div>
          <h2>Central de objetivos</h2>
        </div>
        <span className="surface-action">Criacao, status e progresso real</span>
      </div>

      <div className="surface-card-body">
        <div className="operations-panel">
          <div className="operations-summary-grid">
            <article className="operations-summary-card">
              <span>Ativos</span>
              <strong>{summary.active}</strong>
            </article>
            <article className="operations-summary-card">
              <span>Concluidos</span>
              <strong>{summary.completed}</strong>
            </article>
            <article className="operations-summary-card">
              <span>Progresso medio</span>
              <strong>{summary.averageProgress}%</strong>
            </article>
          </div>

          <div className="operations-grid">
            <form className="task-quick-form" onSubmit={handleCreateGoal}>
              <div className="task-quick-form-head">
                <strong>Novo objetivo</strong>
                <span>Defina direcao e prazo com clareza</span>
              </div>

              <label>
                <span>Titulo</span>
                <input
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  placeholder="Ex: Fechar semestre com consistencia"
                  required
                />
              </label>

              <label>
                <span>Descricao</span>
                <textarea
                  value={form.description}
                  onChange={(event) => updateForm("description", event.target.value)}
                  placeholder="Resultado desejado, contexto e criterio de sucesso"
                  rows={4}
                  required
                />
              </label>

              <div className="task-quick-form-row">
                <label>
                  <span>Categoria</span>
                  <input
                    value={form.category}
                    onChange={(event) => updateForm("category", event.target.value)}
                    required
                  />
                </label>

                <label>
                  <span>Prioridade</span>
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      updateForm("priority", event.target.value as CreateGoalInput["priority"])
                    }
                  >
                    {priorityOptions.map((item) => (
                      <option key={item} value={item}>
                        {priorityLabel(item)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                <span>Data alvo</span>
                <input
                  type="date"
                  value={form.targetDate}
                  onChange={(event) => updateForm("targetDate", event.target.value)}
                  required
                />
              </label>

              <button className="task-submit-button" type="submit" disabled={isBusy}>
                {isBusy ? "Salvando..." : "Criar objetivo"}
              </button>
            </form>

            <div className="operations-task-stack">
              {activeGoals.map((goal) => (
                <article key={goal.id} className="operations-task-card">
                  <div className="operations-task-head">
                    <div>
                      <strong>{goal.title}</strong>
                      <span>{goal.category}</span>
                    </div>
                    <div className={`task-status-pill goal-status-${goal.status.toLowerCase()}`}>
                      {goalStatusLabel(goal.status)}
                    </div>
                  </div>

                  <p className="operations-goal-description">{goal.description}</p>

                  <div className="operations-task-meta">
                    <span>Prazo {goal.targetDate}</span>
                    <span>Prioridade {priorityLabel(goal.priority)}</span>
                  </div>

                  <div className="goal-progress-track">
                    <span style={{ width: `${goal.progress}%` }} />
                  </div>

                  <div className="goal-progress-caption">
                    <span>Progresso atual</span>
                    <strong>{goal.progress}%</strong>
                  </div>

                  <div className="operations-task-actions">
                    {statusOptions
                      .filter((item) => item !== goal.status)
                      .slice(0, 3)
                      .map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleGoalStatus(goal, status)}
                          disabled={isBusy}
                        >
                          {goalStatusLabel(status)}
                        </button>
                      ))}
                  </div>
                </article>
              ))}

              {!activeGoals.length ? <div className="planner-empty-state">Nenhum objetivo encontrado.</div> : null}
            </div>
          </div>

          {feedback ? <div className="operation-feedback success">{feedback}</div> : null}
          {error ? <div className="operation-feedback error">{error}</div> : null}
        </div>
      </div>
    </section>
  );
}
