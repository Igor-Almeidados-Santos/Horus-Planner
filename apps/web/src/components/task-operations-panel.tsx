"use client";

import { startTransition, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createTask,
  fetchExecutionsToday,
  fetchPlans,
  fetchTasks,
  startExecution,
  stopExecution,
  updateTaskStatus,
  type CreateTaskInput,
  type ExecutionLog,
  type PlanSummary,
  type TaskRecord,
  type TaskStatus,
} from "../services/horus-api";

const todayDate = new Date().toISOString().slice(0, 10);

const priorityOptions: Array<CreateTaskInput["priority"]> = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const statusLabel: Record<TaskStatus, string> = {
  TODO: "A fazer",
  IN_PROGRESS: "Em progresso",
  PAUSED: "Pausada",
  BLOCKED: "Bloqueada",
  DONE: "Concluida",
  CANCELED: "Cancelada",
  ARCHIVED: "Arquivada",
};

type QuickFormState = {
  title: string;
  subject: string;
  estimatedMinutes: string;
  scheduledDate: string;
  dueDate: string;
  priority: CreateTaskInput["priority"];
};

const initialFormState: QuickFormState = {
  title: "",
  subject: "",
  estimatedMinutes: "50",
  scheduledDate: todayDate,
  dueDate: todayDate,
  priority: "HIGH",
};

function priorityLabel(priority: CreateTaskInput["priority"]) {
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

export function TaskOperationsPanel() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [executions, setExecutions] = useState<ExecutionLog[]>([]);
  const [form, setForm] = useState<QuickFormState>(initialFormState);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const activePlan = useMemo(
    () => plans.find((plan) => plan.status === "ACTIVE") ?? plans[0] ?? null,
    [plans],
  );

  const visibleTasks = useMemo(
    () =>
      [...tasks]
        .filter((task) => task.status !== "ARCHIVED" && task.status !== "CANCELED")
        .sort((left, right) => {
          if (left.status === "IN_PROGRESS" && right.status !== "IN_PROGRESS") {
            return -1;
          }

          if (left.status !== "IN_PROGRESS" && right.status === "IN_PROGRESS") {
            return 1;
          }

          return left.dueDate.localeCompare(right.dueDate);
        })
        .slice(0, 6),
    [tasks],
  );

  const summary = useMemo(() => {
    const todo = tasks.filter((task) => task.status === "TODO").length;
    const inProgress = tasks.filter((task) => task.status === "IN_PROGRESS").length;
    const done = tasks.filter((task) => task.status === "DONE").length;

    return { todo, inProgress, done };
  }, [tasks]);

  const taskTitleById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task.title])),
    [tasks],
  );

  async function refreshBoard() {
    setIsBusy(true);
    const [tasksData, plansData, executionsData] = await Promise.all([
      fetchTasks(),
      fetchPlans(),
      fetchExecutionsToday(),
    ]);

    startTransition(() => {
      setTasks(tasksData);
      setPlans(plansData);
      setExecutions(executionsData);
    });
    setIsBusy(false);
  }

  useEffect(() => {
    refreshBoard()
      .then(() => {
        setError(null);
      })
      .catch(() => {
        setError("Nao foi possivel carregar o painel operacional agora.");
        setIsBusy(false);
      });
  }, []);

  function updateForm<K extends keyof QuickFormState>(key: K, value: QuickFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activePlan) {
      setError("Nenhum plano encontrado para vincular a nova tarefa.");
      return;
    }

    setError(null);
    setFeedback(null);
    setIsBusy(true);

    createTask({
      planId: activePlan.id,
      routineId: undefined,
      title: form.title.trim(),
      description: `${form.subject.trim()} · criado pela central operacional`,
      category: "STUDY",
      priority: form.priority,
      difficulty: "MEDIUM",
      status: "TODO",
      estimatedMinutes: Number(form.estimatedMinutes),
      scheduledDate: form.scheduledDate,
      dueDate: form.dueDate,
      subject: form.subject.trim(),
    })
      .then(async () => {
        setFeedback("Tarefa criada e adicionada ao fluxo operacional.");
        setForm(initialFormState);
        await refreshBoard();
      })
      .catch(() => {
        setError("Nao foi possivel criar a tarefa agora.");
        setIsBusy(false);
      });
  }

  function runTaskAction(task: TaskRecord, action: "start" | "pause" | "block" | "done") {
    setError(null);
    setFeedback(null);
    setIsBusy(true);

    const operation =
      action === "start"
        ? startExecution(task.id)
        : action === "done"
          ? stopExecution(task.id, task.estimatedMinutes)
          : updateTaskStatus(task.id, action === "pause" ? "PAUSED" : "BLOCKED");

    operation
      .then(async () => {
        setFeedback(
          action === "start"
            ? `Execucao iniciada para "${task.title}".`
            : action === "done"
              ? `Tarefa "${task.title}" concluida.`
              : `Status de "${task.title}" atualizado.`,
        );
        await refreshBoard();
      })
      .catch(() => {
        setError("Nao foi possivel atualizar essa tarefa agora.");
        setIsBusy(false);
      });
  }

  return (
    <section className="surface-card">
      <div className="surface-card-head">
        <div>
          <div className="surface-eyebrow">Operations</div>
          <h2>Central operacional</h2>
        </div>
        <span className="surface-action">{activePlan ? `Plano ativo: ${activePlan.title}` : "Sem plano ativo"}</span>
      </div>

      <div className="surface-card-body">
        <div className="operations-panel">
          <div className="operations-summary-grid">
            <article className="operations-summary-card">
              <span>Fila</span>
              <strong>{summary.todo}</strong>
            </article>
            <article className="operations-summary-card">
              <span>Executando</span>
              <strong>{summary.inProgress}</strong>
            </article>
            <article className="operations-summary-card">
              <span>Concluidas</span>
              <strong>{summary.done}</strong>
            </article>
          </div>

          <div className="operations-grid">
            <form className="task-quick-form" onSubmit={handleCreateTask}>
              <div className="task-quick-form-head">
                <strong>Nova tarefa rapida</strong>
                <span>Entrar com o minimo de atrito</span>
              </div>

              <label>
                <span>Titulo</span>
                <input
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  placeholder="Ex: Revisar biologia celular"
                  required
                />
              </label>

              <label>
                <span>Materia</span>
                <input
                  value={form.subject}
                  onChange={(event) => updateForm("subject", event.target.value)}
                  placeholder="Ex: Biology"
                  required
                />
              </label>

              <div className="task-quick-form-row">
                <label>
                  <span>Minutos</span>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={form.estimatedMinutes}
                    onChange={(event) => updateForm("estimatedMinutes", event.target.value)}
                    required
                  />
                </label>

                <label>
                  <span>Prioridade</span>
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      updateForm("priority", event.target.value as CreateTaskInput["priority"])
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

              <div className="task-quick-form-row">
                <label>
                  <span>Agendada</span>
                  <input
                    type="date"
                    value={form.scheduledDate}
                    onChange={(event) => updateForm("scheduledDate", event.target.value)}
                    required
                  />
                </label>

                <label>
                  <span>Entrega</span>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => updateForm("dueDate", event.target.value)}
                    required
                  />
                </label>
              </div>

              <button className="task-submit-button" type="submit" disabled={isBusy}>
                {isBusy ? "Salvando..." : "Criar tarefa"}
              </button>
            </form>

            <div className="operations-task-stack">
              {visibleTasks.map((task) => (
                <article key={task.id} className="operations-task-card">
                  <div className="operations-task-head">
                    <div>
                      <strong>{task.title}</strong>
                      <span>
                        {task.subject} · {task.estimatedMinutes} min
                      </span>
                    </div>
                    <div className={`task-status-pill status-${task.status.toLowerCase()}`}>
                      {statusLabel[task.status]}
                    </div>
                  </div>

                  <div className="operations-task-meta">
                    <span>Entrega {task.dueDate}</span>
                    <span>Prioridade {priorityLabel(task.priority)}</span>
                  </div>

                  <div className="operations-task-actions">
                    {task.status !== "IN_PROGRESS" ? (
                      <button type="button" onClick={() => runTaskAction(task, "start")} disabled={isBusy}>
                        Iniciar
                      </button>
                    ) : (
                      <button type="button" onClick={() => runTaskAction(task, "done")} disabled={isBusy}>
                        Concluir
                      </button>
                    )}

                    <button type="button" onClick={() => runTaskAction(task, "pause")} disabled={isBusy}>
                      Pausar
                    </button>
                    <button type="button" onClick={() => runTaskAction(task, "block")} disabled={isBusy}>
                      Bloquear
                    </button>
                  </div>
                </article>
              ))}

              {!visibleTasks.length ? <div className="planner-empty-state">Nenhuma tarefa operacional encontrada.</div> : null}
            </div>
          </div>

          <div className="execution-log-panel">
            <div className="task-quick-form-head">
              <strong>Logs recentes</strong>
              <span>Execucoes registradas hoje</span>
            </div>

            <div className="execution-log-list">
              {executions.map((item) => (
                <article key={item.id} className="execution-log-card">
                  <strong>{taskTitleById.get(item.taskId) ?? "Tarefa sem titulo"}</strong>
                  <span>
                    {item.actualMinutes} min · foco {item.focusScore}/10
                  </span>
                  <small>{statusLabel[item.status]}</small>
                </article>
              ))}

              {!executions.length ? <div className="planner-empty-state">Sem logs recentes para hoje.</div> : null}
            </div>
          </div>

          {feedback ? <div className="operation-feedback success">{feedback}</div> : null}
          {error ? <div className="operation-feedback error">{error}</div> : null}
        </div>
      </div>
    </section>
  );
}
