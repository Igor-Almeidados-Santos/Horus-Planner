"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DashboardIcon,
  ExecutionIcon,
  GoalsIcon,
  HelpIcon,
  HorusLogoMark,
  LogoutIcon,
  PlansIcon,
  ReviewIcon,
} from "./brand-assets";
import { AgentOperationsPanel } from "./agent-operations-panel";
import { GoalsOperationsPanel } from "./goals-operations-panel";
import { PlansOperationsPanel } from "./plans-operations-panel";
import { ReviewOperationsPanel } from "./review-operations-panel";
import { RoutinesOperationsPanel } from "./routines-operations-panel";
import { TaskOperationsPanel } from "./task-operations-panel";
import {
  clearAuthSession,
  clearDemoSession,
  getClientAccessToken,
  getStoredAuthUser,
  storeAuthUser,
  type StoredAuthUser,
} from "../lib/auth-session";
import { fetchCurrentUser } from "../services/horus-api";
import { primaryNavigation, type WorkspaceData } from "../lib/workspace-data";

type WorkspaceView = "dashboard" | "goals" | "plans" | "execution" | "review";

const navigationIcons: Record<string, React.ReactNode> = {
  "/": <DashboardIcon />,
  "/goals": <GoalsIcon />,
  "/plans": <PlansIcon />,
  "/execution": <ExecutionIcon />,
  "/review": <ReviewIcon />,
};

function SidebarSection({
  title,
  items,
}: {
  title: string;
  items: Array<string | { name: string; date: string; status: string } | { title: string; progress: string; percent: number }>;
}) {
  return (
    <section className="sidebar-section">
      <div className="sidebar-section-title">{title}</div>
      <div className="sidebar-list">
        {items.map((item) => {
          if (typeof item === "string") {
            return (
              <div key={item} className="sidebar-list-row">
                <span className="sidebar-dot" />
                <span>{item}</span>
              </div>
            );
          }

          if ("name" in item) {
            return (
              <article key={item.name} className="sidebar-event-card">
                <strong>{item.name}</strong>
                <span>{item.date}</span>
                <em>{item.status}</em>
              </article>
            );
          }

          return (
            <article key={item.title} className="sidebar-reading-card">
              <strong>{item.title}</strong>
              <span>{item.progress}</span>
              <div className="reading-progress-bar">
                <span style={{ width: `${item.percent}%` }} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SectionBlock({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card">
      <div className="surface-card-head">
        <div>
          {eyebrow ? <div className="surface-eyebrow">{eyebrow}</div> : null}
          <h2>{title}</h2>
        </div>
        {action ? <span className="surface-action">{action}</span> : null}
      </div>
      <div className="surface-card-body">{children}</div>
    </section>
  );
}

function CalendarBoard({ data }: { data: WorkspaceData }) {
  return (
    <SectionBlock
      eyebrow="Agenda GPT"
      title="Calendario operacional"
      action="Tarefas e blocos distribuidos automaticamente"
    >
      <div className="planner-grid">
        {data.calendarDays.map((day) => (
          <article key={`${day.label}-${day.date}`} className="planner-day-card">
            <div className="planner-day-head">
              <div>
                <strong>{day.label}</strong>
                <span>{day.date}</span>
              </div>
              <em>{day.focus}</em>
            </div>
            <div className="planner-day-items">
              {day.items.length ? (
                day.items.map((item) => (
                  <div key={item.id} className={`planner-task planner-task-${item.tone}`}>
                    <span className="planner-time">{item.time}</span>
                    <div className="planner-task-copy">
                      <strong>{item.title}</strong>
                      <span>{item.track}</span>
                    </div>
                    <small>{item.status}</small>
                  </div>
                ))
              ) : (
                <div className="planner-empty-state">Sem blocos agendados</div>
              )}
            </div>
          </article>
        ))}
      </div>
    </SectionBlock>
  );
}

function DashboardContent({ data }: { data: WorkspaceData }) {
  return (
    <>
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="surface-eyebrow">Workspace overview</div>
          <h1>Ultimate Student OS reimaginado para web</h1>
          <p>
            A mesma base do template anterior, agora distribuida como um sistema web mais claro,
            com foco em leitura rapida, operacao diaria e calendario central.
          </p>
          <div className="quick-action-row">
            {data.quickActions.slice(0, 4).map((item) => (
              <button key={item} className="ghost-chip" type="button">
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="hero-stats">
          <article className="metric-panel">
            <span>Objetivos ativos</span>
            <strong>{data.goalCards.length}</strong>
          </article>
          <article className="metric-panel">
            <span>Blocos no calendario</span>
            <strong>{data.calendarDays.reduce((sum, day) => sum + day.items.length, 0)}</strong>
          </article>
          <article className="metric-panel">
            <span>Sugestoes do agente</span>
            <strong>{data.calendarInbox.length}</strong>
          </article>
          <article className="metric-panel">
            <span>Materias monitoradas</span>
            <strong>{data.classStats.length}</strong>
          </article>
        </div>
      </section>

      <AgentOperationsPanel />

      <CalendarBoard data={data} />

      <div className="content-grid-two">
        <SectionBlock eyebrow="Performance" title="Classes e progresso" action="Acompanhamento atual">
          <div className="class-card-grid">
            {data.classStats.map((item) => (
              <article key={item.name} className="mini-stat-card">
                <strong>{item.name}</strong>
                <span>{item.assignments} entregas em aberto</span>
                <div className="metric-line">
                  <em>{item.progress}%</em>
                  <small>{item.tasksLeft} tarefas restantes</small>
                </div>
              </article>
            ))}
          </div>
        </SectionBlock>

        <SectionBlock eyebrow="Prioridades" title="Avaliacoes e prazos" action="Leitura rapida da semana">
          <div className="deadline-grid">
            {data.assessments.map((item) => (
              <article key={`${item.title}-${item.subject}`} className="deadline-card">
                <strong>{item.title}</strong>
                <span>{item.subject}</span>
                <small>{item.dueDate}</small>
                <em>{item.daysLeft}</em>
              </article>
            ))}
          </div>
        </SectionBlock>
      </div>

      <div className="content-grid-two">
        <SectionBlock eyebrow="Planejamento" title="Objetivos e direcao" action="Resumo visivel">
          <div className="goal-card-grid">
            {data.goalCards.map((goal) => (
              <article key={goal.title} className="goal-spotlight-card">
                <div className="goal-spotlight-head">
                  <strong>{goal.title}</strong>
                  <span>{goal.status}</span>
                </div>
                <p>{goal.detail}</p>
                <div className="goal-progress-row">
                  <small>Prioridade {goal.priority}</small>
                  <strong>{goal.progress}%</strong>
                </div>
                <div className="reading-progress-bar">
                  <span style={{ width: `${goal.progress}%` }} />
                </div>
              </article>
            ))}
          </div>
        </SectionBlock>

        <SectionBlock eyebrow="Base de apoio" title="Recursos e notas" action="Conhecimento acessivel">
          <div className="knowledge-stack">
            <div className="resource-card-list">
              {data.resourceItems.slice(0, 3).map((item) => (
                <article key={item.title} className="resource-modern-card">
                  <strong>{item.title}</strong>
                  <span>{item.source}</span>
                  <div className="tag-row">
                    <small>{item.tag}</small>
                    <em>{item.status}</em>
                  </div>
                </article>
              ))}
            </div>
            <div className="note-modern-grid">
              {data.notes.slice(0, 2).map((note) => (
                <article key={note.title} className="note-modern-card">
                  <strong>{note.title}</strong>
                  <p>{note.excerpt}</p>
                </article>
              ))}
            </div>
          </div>
        </SectionBlock>
      </div>
    </>
  );
}

function GoalsContent({ data }: { data: WorkspaceData }) {
  return (
    <>
      <GoalsOperationsPanel />
      <SectionBlock eyebrow="Goals hub" title="Objetivos em destaque" action="Panorama de execucao">
        <div className="goal-card-grid">
          {data.goalCards.map((goal) => (
            <article key={goal.title} className="goal-spotlight-card">
              <div className="goal-spotlight-head">
                <strong>{goal.title}</strong>
                <span>{goal.status}</span>
              </div>
              <p>{goal.detail}</p>
              <div className="goal-progress-row">
                <small>Prioridade {goal.priority}</small>
                <strong>{goal.progress}%</strong>
              </div>
              <div className="reading-progress-bar">
                <span style={{ width: `${goal.progress}%` }} />
              </div>
            </article>
          ))}
        </div>
      </SectionBlock>

      <div className="content-grid-two">
        <CalendarBoard data={data} />
        <SectionBlock eyebrow="Guidance" title="Recomendacoes atuais" action="Leitura clara">
          <div className="stacked-insights">
            {data.recommendations.map((item) => (
              <div key={item} className="insight-row">
                <span className="sidebar-dot" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </SectionBlock>
      </div>
    </>
  );
}

function PlansContent({ data }: { data: WorkspaceData }) {
  return (
    <>
      <PlansOperationsPanel />
      <RoutinesOperationsPanel />
      <CalendarBoard data={data} />
      <div className="content-grid-two">
        <SectionBlock eyebrow="Plan map" title="Estrutura do plano" action="Versoes e rotinas">
          <div className="plan-flow">
            {data.planOverview.map((plan) => (
              <article key={plan.title} className="plan-flow-card">
                <strong>{plan.title}</strong>
                <span>{plan.meta}</span>
                <div className="stacked-insights">
                  {plan.items.map((item) => (
                    <div key={item} className="insight-row">
                      <span className="sidebar-dot" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </SectionBlock>

        <SectionBlock eyebrow="Task list" title="Itens distribuidos" action="Base para o calendario">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Tarefa</th>
                  <th>Data</th>
                  <th>Esforco</th>
                  <th>Impacto</th>
                  <th>Curso</th>
                </tr>
              </thead>
              <tbody>
                {data.taskTable.map((item, index) => (
                  <tr key={`${item.name}-${index}`}>
                    <td>{item.name}</td>
                    <td>{item.date}</td>
                    <td>{item.effort}</td>
                    <td>{item.impact}</td>
                    <td>{item.course}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionBlock>
      </div>
    </>
  );
}

function ExecutionContent({ data }: { data: WorkspaceData }) {
  return (
    <>
      <TaskOperationsPanel />
      <CalendarBoard data={data} />
      <div className="content-grid-two">
        <SectionBlock eyebrow="Execution" title="Estado operacional atual" action="Bloco do momento">
          <div className="execution-card-grid">
            {data.executionSteps.map((item) => (
              <article key={item.label} className="mini-stat-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
          <div className="quick-action-row">
            <button className="ghost-chip" type="button">Iniciar</button>
            <button className="ghost-chip" type="button">Pausar</button>
            <button className="ghost-chip" type="button">Concluir</button>
            <button className="ghost-chip" type="button">Bloqueada</button>
          </div>
        </SectionBlock>

        <SectionBlock eyebrow="Week flow" title="Fila de trabalho" action="Tarefas organizadas">
          <div className="task-list-modern">
            {data.taskTable.map((item, index) => (
              <article key={`${item.name}-${index}`} className="task-list-card">
                <strong>{item.name}</strong>
                <span>{item.course}</span>
                <div className="tag-row">
                  <small>{item.effort}</small>
                  <em>{item.date}</em>
                </div>
              </article>
            ))}
          </div>
        </SectionBlock>
      </div>
    </>
  );
}

function ReviewContent({ data }: { data: WorkspaceData }) {
  return (
    <>
      <ReviewOperationsPanel />

      <SectionBlock eyebrow="Review" title="Indicadores da semana" action="Leitura imediata">
        <div className="hero-stats">
          {data.reviewMetrics.map((metric) => (
            <article key={metric.label} className="metric-panel">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </div>
      </SectionBlock>

      <div className="content-grid-two">
        <SectionBlock eyebrow="Friction" title="Gargalos recorrentes" action="Pontos de atencao">
          <div className="stacked-insights">
            {data.weeklyBottlenecks.map((item) => (
              <div key={item} className="insight-row">
                <span className="sidebar-dot" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </SectionBlock>

        <SectionBlock eyebrow="Agent notes" title="Recomendacoes do agente" action="Ajustes sugeridos">
          <div className="stacked-insights">
            {data.recommendations.map((item) => (
              <div key={item} className="insight-row">
                <span className="sidebar-dot" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </SectionBlock>
      </div>
    </>
  );
}

function getViewMeta(view: WorkspaceView) {
  switch (view) {
    case "goals":
      return {
        title: "Objetivos",
        subtitle: "Metas ativas, progresso e clareza de direcao.",
      };
    case "plans":
      return {
        title: "Planos",
        subtitle: "Estrutura semanal, rotinas e blocos distribuidos.",
      };
    case "execution":
      return {
        title: "Execucao",
        subtitle: "Controle do dia, foco atual e fila operacional.",
      };
    case "review":
      return {
        title: "Revisao",
        subtitle: "Metricas, gargalos e recomendacoes para a proxima semana.",
      };
    default:
      return {
        title: "Dashboard",
        subtitle: "Visao central da rotina, calendario e contexto do agente.",
      };
  }
}

function renderView(view: WorkspaceView, data: WorkspaceData) {
  switch (view) {
    case "goals":
      return <GoalsContent data={data} />;
    case "plans":
      return <PlansContent data={data} />;
    case "execution":
      return <ExecutionContent data={data} />;
    case "review":
      return <ReviewContent data={data} />;
    default:
      return <DashboardContent data={data} />;
  }
}

export function WorkspaceShell({ view, data }: { view: WorkspaceView; data: WorkspaceData }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<StoredAuthUser | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const meta = getViewMeta(view);

  useEffect(() => {
    const storedUser = getStoredAuthUser();
    const token = getClientAccessToken();

    if (storedUser) {
      setCurrentUser(storedUser);
    }

    if (!token) {
      setCurrentUser(null);
      setAuthResolved(true);
      return;
    }

    fetchCurrentUser()
      .then((user) => {
        const stored = {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarLabel: user.avatarLabel,
        };
        setCurrentUser(stored);
        storeAuthUser(stored);
      })
      .catch(() => {
        clearAuthSession();
        setCurrentUser(null);
      })
      .finally(() => {
        setAuthResolved(true);
      });
  }, []);

  function handleLogout() {
    clearAuthSession();
    clearDemoSession();
    setCurrentUser(null);
    setAuthResolved(true);
    router.push("/login");
    router.refresh();
  }

  const isAuthenticated = authResolved && Boolean(currentUser);
  const sessionLabel = !authResolved
    ? "Verificando sessao"
    : isAuthenticated
      ? "Conta conectada"
      : "Modo demonstracao";
  const sessionCopy = !authResolved
    ? "Validando acesso salvo neste navegador"
    : isAuthenticated && currentUser
      ? `${currentUser.name} · ${currentUser.email}`
      : "Entre para salvar seu workspace pessoal";

  return (
    <main className="page-shell">
      <div className={`dashboard-shell ${sidebarOpen ? "sidebar-visible" : "sidebar-hidden"}`}>
        <aside className={`dashboard-sidebar ${sidebarOpen ? "is-expanded" : "is-collapsed"}`}>
          <div className="sidebar-brand">
            <div className="sidebar-brand-header">
              <div className="sidebar-brand-identity">
                <div className="sidebar-brand-mark">
                  <HorusLogoMark />
                </div>
                <div className={`sidebar-brand-copy ${sidebarOpen ? "is-visible" : "is-hidden"}`}>
                  <strong>Horus Planner</strong>
                  <span>Eye on focus, plans and execution</span>
                </div>
              </div>
              <button
                type="button"
                className="sidebar-chevron"
                onClick={() => setSidebarOpen((current) => !current)}
                aria-label={sidebarOpen ? "Ocultar menu lateral" : "Mostrar menu lateral"}
                aria-expanded={sidebarOpen}
              >
                {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </button>
            </div>
          </div>

          <nav className="sidebar-navigation">
            {primaryNavigation.map((item) => {
              const isActive =
                (view === "dashboard" && item.href === "/") ||
                (view !== "dashboard" && item.href === `/${view}`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive ? "active" : ""}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <span className="sidebar-nav-icon">{navigationIcons[item.href] ?? <DashboardIcon />}</span>
                  <span className={`sidebar-nav-label ${sidebarOpen ? "is-visible" : "is-hidden"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className={`sidebar-scroll ${sidebarOpen ? "is-visible" : "is-hidden"}`}>
            <SidebarSection title="Quick Actions" items={data.quickActions} />
            <SidebarSection title="Management" items={data.managementLinks} />
            <SidebarSection title="Agenda" items={data.agendaEvents} />
            <SidebarSection title="Currently Reading" items={data.readingList} />
          </div>

          <div className={`sidebar-footer ${sidebarOpen ? "is-visible" : "is-hidden"}`}>
            <button type="button" className="sidebar-footer-action">
              <HelpIcon />
              <span>Help</span>
            </button>
            {isAuthenticated ? (
              <button type="button" className="sidebar-footer-action" onClick={handleLogout}>
                <LogoutIcon />
                <span>Log out</span>
              </button>
            ) : authResolved ? (
              <button type="button" className="sidebar-footer-action" onClick={() => router.push("/login")}>
                <LogoutIcon />
                <span>Entrar</span>
              </button>
            ) : (
              <button type="button" className="sidebar-footer-action" disabled aria-disabled="true">
                <LogoutIcon />
                <span>Carregando</span>
              </button>
            )}
          </div>
        </aside>

        <div className="dashboard-main">
          <header className="topbar-surface">
            <div className="topbar-copy">
              <div className="surface-eyebrow">Workspace</div>
              <h1>{meta.title}</h1>
              <p>{meta.subtitle}</p>
              <div className="topbar-session">
                <span className="status-chip">{sessionLabel}</span>
                <span className="topbar-session-copy">{sessionCopy}</span>
                <div className="topbar-session-actions">
                  {isAuthenticated ? (
                    <button type="button" className="ghost-chip" onClick={handleLogout}>
                      Sair
                    </button>
                  ) : authResolved ? (
                    <>
                      <Link href="/login" className="ghost-chip">
                        Entrar
                      </Link>
                      <Link href="/register" className="ghost-chip">
                        Criar conta
                      </Link>
                    </>
                  ) : (
                    <button type="button" className="ghost-chip" disabled aria-disabled="true">
                      Carregando
                    </button>
                  )}
                </div>
              </div>
            </div>
          </header>

          <div className="dashboard-layout">
            <section className="dashboard-primary">{renderView(view, data)}</section>

            <aside className="dashboard-secondary">
              <SectionBlock eyebrow="Agora" title="Foco do momento" action="Estado atual">
                <div className="secondary-stack">
                  {data.executionSteps.map((item) => (
                    <div key={item.label} className="secondary-row">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </SectionBlock>

              <SectionBlock eyebrow="Agent queue" title="Inbox operacional" action="Entradas priorizadas">
                <div className="secondary-stack">
                  {data.calendarInbox.map((item) => (
                    <article key={item.id} className="secondary-note-card">
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                      <span>{item.source}</span>
                    </article>
                  ))}
                </div>
              </SectionBlock>

              <SectionBlock eyebrow="Habitos" title="Checklist diario" action="Consistencia">
                <div className="secondary-stack">
                  {data.habits.slice(0, 6).map((item) => (
                    <div key={item} className="insight-row">
                      <span className="sidebar-dot" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </SectionBlock>

              <SectionBlock eyebrow="Pomodoro" title="Timer de foco" action="Ciclo atual">
                <div className="focus-timer-card">
                  <strong>25:00</strong>
                  <span>Start · Short Break · Long Break</span>
                </div>
              </SectionBlock>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
