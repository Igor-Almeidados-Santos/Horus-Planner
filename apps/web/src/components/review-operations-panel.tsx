"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  applyRecommendation,
  fetchRecommendations,
  fetchReviews,
  generateWeeklyReview,
  updateRecommendationStatus,
  type RecommendationRecord,
  type ReviewRecord,
} from "../services/horus-api";

const recommendationStatusLabel: Record<RecommendationRecord["status"], string> = {
  OPEN: "Aberta",
  APPLIED: "Aplicada",
  DISMISSED: "Descartada",
  ARCHIVED: "Arquivada",
};

type ReviewFormState = {
  periodLabel: string;
};

const initialFormState: ReviewFormState = {
  periodLabel: "",
};

export function ReviewOperationsPanel() {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationRecord[]>([]);
  const [form, setForm] = useState<ReviewFormState>(initialFormState);
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const latestReview = reviews[0] ?? null;

  const summary = useMemo(() => {
    return {
      reviews: reviews.length,
      open: recommendations.filter((item) => item.status === "OPEN").length,
      applied: recommendations.filter((item) => item.status === "APPLIED").length,
    };
  }, [recommendations, reviews]);

  async function refreshReviewData() {
    setIsBusy(true);
    const [reviewsData, recommendationsData] = await Promise.all([
      fetchReviews(),
      fetchRecommendations(),
    ]);
    setReviews(reviewsData);
    setRecommendations(recommendationsData);
    setIsBusy(false);
  }

  useEffect(() => {
    refreshReviewData()
      .then(() => setError(null))
      .catch(() => {
        setError("Nao foi possivel carregar a central de revisao agora.");
        setIsBusy(false);
      });
  }, []);

  async function handleGenerateReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setError(null);
    setFeedback(null);

    try {
      const result = await generateWeeklyReview({
        periodLabel: form.periodLabel.trim() || undefined,
      });
      setFeedback(
        `Revisao ${result.review.periodLabel} criada com ${result.recommendations.length} recomendacoes novas.`,
      );
      setForm(initialFormState);
      await refreshReviewData();
      router.refresh();
    } catch {
      setError("Nao foi possivel gerar a revisao semanal agora.");
      setIsBusy(false);
    }
  }

  async function handleRecommendationStatus(
    recommendation: RecommendationRecord,
    status: RecommendationRecord["status"],
  ) {
    setIsBusy(true);
    setError(null);
    setFeedback(null);

    try {
      await updateRecommendationStatus(recommendation.id, status);
      setFeedback(`Recomendacao "${recommendation.title}" atualizada.`);
      await refreshReviewData();
      router.refresh();
    } catch {
      setError("Nao foi possivel atualizar a recomendacao agora.");
      setIsBusy(false);
    }
  }

  async function handleApplyRecommendation(recommendation: RecommendationRecord) {
    setIsBusy(true);
    setError(null);
    setFeedback(null);

    try {
      const result = await applyRecommendation(recommendation.id);
      setFeedback(
        result.replan
          ? `${result.message} ${result.replan.tasksMigrated} tarefas foram migradas para o novo plano.`
          : result.message,
      );
      await refreshReviewData();
      router.refresh();
    } catch {
      setError("Nao foi possivel aplicar a recomendacao agora.");
      setIsBusy(false);
    }
  }

  return (
    <section className="surface-card">
      <div className="surface-card-head">
        <div>
          <div className="surface-eyebrow">Review Ops</div>
          <h2>Central de revisao semanal</h2>
        </div>
        <span className="surface-action">Consolidar aprendizados e agir sobre as recomendacoes</span>
      </div>

      <div className="surface-card-body">
        <div className="operations-panel">
          <div className="operations-summary-grid">
            <article className="operations-summary-card">
              <span>Revisoes</span>
              <strong>{summary.reviews}</strong>
            </article>
            <article className="operations-summary-card">
              <span>Recomendacoes abertas</span>
              <strong>{summary.open}</strong>
            </article>
            <article className="operations-summary-card">
              <span>Aplicadas</span>
              <strong>{summary.applied}</strong>
            </article>
          </div>

          <div className="operations-grid">
            <form className="task-quick-form" onSubmit={handleGenerateReview}>
              <div className="task-quick-form-head">
                <strong>Gerar revisao</strong>
                <span>Consolide a semana atual e alimente os proximos ajustes do workspace.</span>
              </div>

              <label>
                <span>Periodo</span>
                <input
                  value={form.periodLabel}
                  onChange={(event) => setForm({ periodLabel: event.target.value })}
                  placeholder="Ex: 22 abr - 28 abr"
                />
              </label>

              <button className="task-submit-button" type="submit" disabled={isBusy}>
                {isBusy ? "Gerando..." : "Gerar revisao semanal"}
              </button>

              <div className="agent-context-grid">
                <div className="secondary-row">
                  <span>Ultima revisao</span>
                  <strong>{latestReview?.periodLabel ?? "Nenhuma ainda"}</strong>
                </div>
                <div className="secondary-row">
                  <span>Conclusao</span>
                  <strong>{latestReview ? `${latestReview.completionRate}%` : "--"}</strong>
                </div>
                <div className="secondary-row">
                  <span>Aderencia</span>
                  <strong>{latestReview ? `${latestReview.adherenceRate}%` : "--"}</strong>
                </div>
              </div>
            </form>

            <div className="operations-task-stack">
              <article className="operations-task-card">
                <div className="operations-task-head">
                  <div>
                    <strong>Observacoes mais recentes</strong>
                    <span>O que a revisao mostrou sobre a semana</span>
                  </div>
                </div>

                <div className="stacked-insights">
                  {latestReview?.observations?.length ? (
                    latestReview.observations.map((item) => (
                      <div key={item} className="insight-row">
                        <span className="sidebar-dot" />
                        <span>{item}</span>
                      </div>
                    ))
                  ) : (
                    <div className="planner-empty-state">Gere uma revisao para consolidar gargalos e sinais da semana.</div>
                  )}
                </div>
              </article>

              <article className="operations-task-card">
                <div className="operations-task-head">
                  <div>
                    <strong>Recomendacoes</strong>
                    <span>Ajustes acionaveis para o proximo ciclo</span>
                  </div>
                </div>

                <div className="operations-task-stack">
                  {recommendations.length ? (
                    recommendations.slice(0, 6).map((recommendation) => (
                      <article key={recommendation.id} className="operations-task-card review-recommendation-card">
                        <div className="operations-task-head">
                          <div>
                            <strong>{recommendation.title}</strong>
                            <span>{recommendation.createdAt.slice(0, 10)}</span>
                          </div>
                          <div className={`task-status-pill recommendation-status-${recommendation.status.toLowerCase()}`}>
                            {recommendationStatusLabel[recommendation.status]}
                          </div>
                        </div>

                        <p className="operations-goal-description">{recommendation.description}</p>

                        <div className="operations-task-actions">
                          {recommendation.status !== "APPLIED" ? (
                            <button
                              type="button"
                              onClick={() => handleApplyRecommendation(recommendation)}
                              disabled={isBusy}
                            >
                              Aplicar
                            </button>
                          ) : null}
                          {recommendation.status !== "DISMISSED" ? (
                            <button
                              type="button"
                              onClick={() => handleRecommendationStatus(recommendation, "DISMISSED")}
                              disabled={isBusy}
                            >
                              Descartar
                            </button>
                          ) : null}
                          {recommendation.status !== "ARCHIVED" ? (
                            <button
                              type="button"
                              onClick={() => handleRecommendationStatus(recommendation, "ARCHIVED")}
                              disabled={isBusy}
                            >
                              Arquivar
                            </button>
                          ) : null}
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="planner-empty-state">Nenhuma recomendacao registrada ainda.</div>
                  )}
                </div>
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
