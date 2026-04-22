"use client";

import { startTransition, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  activatePlan,
  archivePlan,
  createPlan,
  fetchPlans,
  type PlanSummary,
} from "../services/horus-api";

const planStatusLabel: Record<PlanSummary["status"], string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativo",
  PAUSED: "Pausado",
  ARCHIVED: "Arquivado",
};

type PlanFormState = {
  title: string;
  description: string;
  planningHorizon: string;
};

const initialPlanForm: PlanFormState = {
  title: "",
  description: "",
  planningHorizon: "Semanal",
};

export function PlansOperationsPanel() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [form, setForm] = useState<PlanFormState>(initialPlanForm);
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visiblePlans = useMemo(
    () => [...plans].filter((plan) => plan.status !== "ARCHIVED").sort((a, b) => b.version - a.version),
    [plans],
  );

  const summary = useMemo(() => {
    const active = plans.filter((plan) => plan.status === "ACTIVE").length;
    const drafts = plans.filter((plan) => plan.status === "DRAFT").length;
    const totalTasks = plans.reduce((sum, plan) => sum + plan.tasksCount, 0);

    return { active, drafts, totalTasks };
  }, [plans]);

  async function refreshPlans() {
    setIsBusy(true);
    const data = await fetchPlans();
    startTransition(() => {
      setPlans(data);
    });
    setIsBusy(false);
  }

  useEffect(() => {
    refreshPlans()
      .then(() => setError(null))
      .catch(() => {
        setError("Nao foi possivel carregar os planos agora.");
        setIsBusy(false);
      });
  }, []);

  function updateForm<K extends keyof PlanFormState>(key: K, value: PlanFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleCreatePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setError(null);
    setFeedback(null);

    createPlan({
      title: form.title.trim(),
      description: form.description.trim(),
      status: "DRAFT",
      planningHorizon: form.planningHorizon.trim(),
      source: "manual_web",
      createdByAgent: false,
    })
      .then(async () => {
        setFeedback("Plano criado e pronto para ativacao.");
        setForm(initialPlanForm);
        await refreshPlans();
        router.refresh();
      })
      .catch(() => {
        setError("Nao foi possivel criar o plano.");
        setIsBusy(false);
      });
  }

  function handlePlanAction(plan: PlanSummary, action: "activate" | "archive") {
    setIsBusy(true);
    setError(null);
    setFeedback(null);

    const request = action === "activate" ? activatePlan(plan.id) : archivePlan(plan.id);

    request
      .then(async () => {
        setFeedback(
          action === "activate"
            ? `Plano "${plan.title}" ativado.`
            : `Plano "${plan.title}" arquivado.`,
        );
        await refreshPlans();
        router.refresh();
      })
      .catch(() => {
        setError("Nao foi possivel atualizar esse plano.");
        setIsBusy(false);
      });
  }

  return (
    <section className="surface-card">
      <div className="surface-card-head">
        <div>
          <div className="surface-eyebrow">Plans Ops</div>
          <h2>Central de planos</h2>
        </div>
        <span className="surface-action">Versao, ativacao e distribuicao</span>
      </div>

      <div className="surface-card-body">
        <div className="operations-panel">
          <div className="operations-summary-grid">
            <article className="operations-summary-card">
              <span>Ativos</span>
              <strong>{summary.active}</strong>
            </article>
            <article className="operations-summary-card">
              <span>Rascunhos</span>
              <strong>{summary.drafts}</strong>
            </article>
            <article className="operations-summary-card">
              <span>Tarefas ligadas</span>
              <strong>{summary.totalTasks}</strong>
            </article>
          </div>

          <div className="operations-grid">
            <form className="task-quick-form" onSubmit={handleCreatePlan}>
              <div className="task-quick-form-head">
                <strong>Novo plano</strong>
                <span>Estruture uma versao operacional com rapidez</span>
              </div>

              <label>
                <span>Titulo</span>
                <input
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  placeholder="Ex: Plano semanal de alto foco"
                  required
                />
              </label>

              <label>
                <span>Descricao</span>
                <textarea
                  value={form.description}
                  onChange={(event) => updateForm("description", event.target.value)}
                  placeholder="Escopo, horizonte e logica do plano"
                  rows={4}
                  required
                />
              </label>

              <label>
                <span>Horizonte</span>
                <input
                  value={form.planningHorizon}
                  onChange={(event) => updateForm("planningHorizon", event.target.value)}
                  placeholder="Semanal, quinzenal, mensal"
                  required
                />
              </label>

              <button className="task-submit-button" type="submit" disabled={isBusy}>
                {isBusy ? "Salvando..." : "Criar plano"}
              </button>
            </form>

            <div className="operations-task-stack">
              {visiblePlans.map((plan) => (
                <article key={plan.id} className="operations-task-card">
                  <div className="operations-task-head">
                    <div>
                      <strong>{plan.title}</strong>
                      <span>Versao {plan.version}</span>
                    </div>
                    <div className={`task-status-pill plan-status-${plan.status.toLowerCase()}`}>
                      {planStatusLabel[plan.status]}
                    </div>
                  </div>

                  <div className="operations-task-meta">
                    <span>{plan.routinesCount} rotinas</span>
                    <span>{plan.tasksCount} tarefas</span>
                  </div>

                  <div className="operations-task-actions">
                    {plan.status !== "ACTIVE" ? (
                      <button type="button" onClick={() => handlePlanAction(plan, "activate")} disabled={isBusy}>
                        Ativar
                      </button>
                    ) : null}

                    {plan.status !== "ARCHIVED" ? (
                      <button type="button" onClick={() => handlePlanAction(plan, "archive")} disabled={isBusy}>
                        Arquivar
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}

              {!visiblePlans.length ? <div className="planner-empty-state">Nenhum plano encontrado.</div> : null}
            </div>
          </div>

          {feedback ? <div className="operation-feedback success">{feedback}</div> : null}
          {error ? <div className="operation-feedback error">{error}</div> : null}
        </div>
      </div>
    </section>
  );
}
