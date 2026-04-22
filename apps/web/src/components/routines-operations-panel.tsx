"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createRoutine,
  deleteRoutine,
  fetchPlans,
  fetchRoutines,
  updateRoutine,
  type CreateRoutineInput,
  type PlanSummary,
  type RoutineRecord,
} from "../services/horus-api";

const frequencyOptions = ["daily", "weekly", "flexible"];
const timePreferenceOptions = ["morning", "afternoon", "night"];

type RoutineFormState = {
  name: string;
  description: string;
  frequencyType: string;
  timePreference: string;
};

const initialRoutineForm: RoutineFormState = {
  name: "",
  description: "",
  frequencyType: "daily",
  timePreference: "morning",
};

function frequencyLabel(value: string) {
  switch (value) {
    case "daily":
      return "Diaria";
    case "weekly":
      return "Semanal";
    default:
      return "Flexivel";
  }
}

function timePreferenceLabel(value: string) {
  switch (value) {
    case "morning":
      return "Manha";
    case "afternoon":
      return "Tarde";
    default:
      return "Noite";
  }
}

export function RoutinesOperationsPanel() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [routines, setRoutines] = useState<RoutineRecord[]>([]);
  const [form, setForm] = useState<RoutineFormState>(initialRoutineForm);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activePlan = useMemo(
    () => plans.find((plan) => plan.status === "ACTIVE") ?? plans[0] ?? null,
    [plans],
  );

  const visibleRoutines = useMemo(() => {
    if (!activePlan) {
      return [];
    }

    return routines
      .filter((routine) => routine.planId === activePlan.id)
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [activePlan, routines]);

  const summary = useMemo(
    () => ({
      total: visibleRoutines.length,
      morning: visibleRoutines.filter((routine) => routine.timePreference === "morning").length,
      nightly: visibleRoutines.filter((routine) => routine.timePreference === "night").length,
    }),
    [visibleRoutines],
  );

  async function refreshRoutines() {
    setIsBusy(true);
    const [plansData, routinesData] = await Promise.all([fetchPlans(), fetchRoutines()]);
    setPlans(plansData);
    setRoutines(routinesData);
    setIsBusy(false);
  }

  useEffect(() => {
    refreshRoutines()
      .then(() => setError(null))
      .catch(() => {
        setError("Nao foi possivel carregar a central de rotinas agora.");
        setIsBusy(false);
      });
  }, []);

  function updateForm<K extends keyof RoutineFormState>(key: K, value: RoutineFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(initialRoutineForm);
    setEditingRoutineId(null);
  }

  function handleEdit(routine: RoutineRecord) {
    setError(null);
    setFeedback(null);
    setEditingRoutineId(routine.id);
    setForm({
      name: routine.name,
      description: routine.description,
      frequencyType: routine.frequencyType,
      timePreference: routine.timePreference,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activePlan) {
      setError("Ative ou crie um plano antes de organizar rotinas.");
      return;
    }

    setIsBusy(true);
    setError(null);
    setFeedback(null);

    const payload: CreateRoutineInput = {
      planId: activePlan.id,
      name: form.name.trim(),
      description: form.description.trim(),
      frequencyType: form.frequencyType,
      timePreference: form.timePreference,
    };

    try {
      if (editingRoutineId) {
        await updateRoutine(editingRoutineId, {
          name: payload.name,
          description: payload.description,
          frequencyType: payload.frequencyType,
          timePreference: payload.timePreference,
        });
        setFeedback(`Rotina "${payload.name}" atualizada.`);
      } else {
        await createRoutine(payload);
        setFeedback(`Rotina "${payload.name}" criada no plano atual.`);
      }

      resetForm();
      await refreshRoutines();
      router.refresh();
    } catch {
      setError(editingRoutineId ? "Nao foi possivel atualizar a rotina." : "Nao foi possivel criar a rotina.");
      setIsBusy(false);
    }
  }

  async function handleDelete(routine: RoutineRecord) {
    setIsBusy(true);
    setError(null);
    setFeedback(null);

    try {
      await deleteRoutine(routine.id);
      if (editingRoutineId === routine.id) {
        resetForm();
      }
      setFeedback(`Rotina "${routine.name}" removida.`);
      await refreshRoutines();
      router.refresh();
    } catch {
      setError("Nao foi possivel remover a rotina agora.");
      setIsBusy(false);
    }
  }

  return (
    <section className="surface-card">
      <div className="surface-card-head">
        <div>
          <div className="surface-eyebrow">Routines Ops</div>
          <h2>Central de rotinas</h2>
        </div>
        <span className="surface-action">
          {activePlan ? `Plano atual: ${activePlan.title}` : "Sem plano ativo para vincular rotinas"}
        </span>
      </div>

      <div className="surface-card-body">
        <div className="operations-panel">
          <div className="operations-summary-grid">
            <article className="operations-summary-card">
              <span>Rotinas visiveis</span>
              <strong>{summary.total}</strong>
            </article>
            <article className="operations-summary-card">
              <span>Blocos pela manha</span>
              <strong>{summary.morning}</strong>
            </article>
            <article className="operations-summary-card">
              <span>Blocos a noite</span>
              <strong>{summary.nightly}</strong>
            </article>
          </div>

          <div className="operations-grid">
            <form className="task-quick-form" onSubmit={handleSubmit}>
              <div className="task-quick-form-head">
                <strong>{editingRoutineId ? "Editar rotina" : "Nova rotina"}</strong>
                <span>Defina cadencia e faixa do dia para estruturar melhor o plano.</span>
              </div>

              <label>
                <span>Nome</span>
                <input
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="Ex: Revisao ativa"
                  required
                />
              </label>

              <label>
                <span>Descricao</span>
                <textarea
                  value={form.description}
                  onChange={(event) => updateForm("description", event.target.value)}
                  placeholder="Ex: Bloco para revisar conteudos, ajustar pendencias e consolidar memorizacao"
                  rows={4}
                  required
                />
              </label>

              <div className="task-quick-form-row">
                <label>
                  <span>Frequencia</span>
                  <select
                    value={form.frequencyType}
                    onChange={(event) => updateForm("frequencyType", event.target.value)}
                  >
                    {frequencyOptions.map((item) => (
                      <option key={item} value={item}>
                        {frequencyLabel(item)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Faixa do dia</span>
                  <select
                    value={form.timePreference}
                    onChange={(event) => updateForm("timePreference", event.target.value)}
                  >
                    {timePreferenceOptions.map((item) => (
                      <option key={item} value={item}>
                        {timePreferenceLabel(item)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="operations-task-actions">
                <button className="task-submit-button" type="submit" disabled={isBusy}>
                  {isBusy ? "Salvando..." : editingRoutineId ? "Salvar rotina" : "Criar rotina"}
                </button>
                {editingRoutineId ? (
                  <button type="button" onClick={resetForm} disabled={isBusy}>
                    Cancelar edicao
                  </button>
                ) : null}
              </div>
            </form>

            <div className="operations-task-stack">
              {visibleRoutines.length ? (
                visibleRoutines.map((routine) => (
                  <article key={routine.id} className="operations-task-card">
                    <div className="operations-task-head">
                      <div>
                        <strong>{routine.name}</strong>
                        <span>
                          {frequencyLabel(routine.frequencyType)} · {timePreferenceLabel(routine.timePreference)}
                        </span>
                      </div>
                      <div className="task-status-pill plan-status-active">Rotina</div>
                    </div>

                    <p className="operations-goal-description">{routine.description}</p>

                    <div className="operations-task-meta">
                      <span>{activePlan?.title ?? "Plano"}</span>
                      <span>Atualizada {routine.updatedAt.slice(0, 10)}</span>
                    </div>

                    <div className="operations-task-actions">
                      <button type="button" onClick={() => handleEdit(routine)} disabled={isBusy}>
                        Editar
                      </button>
                      <button type="button" onClick={() => handleDelete(routine)} disabled={isBusy}>
                        Remover
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="planner-empty-state">
                  {activePlan
                    ? "Nenhuma rotina criada para o plano atual."
                    : "Crie ou ative um plano para comecar a estruturar rotinas."}
                </div>
              )}
            </div>
          </div>

          {feedback ? <div className="operation-feedback success">{feedback}</div> : null}
          {error ? <div className="operation-feedback error">{error}</div> : null}
        </div>
      </div>
    </section>
  );
}
