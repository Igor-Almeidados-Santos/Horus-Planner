"use client";

import Link from "next/link";
import { useState } from "react";
import { primaryNavigation, type WorkspaceData } from "../lib/workspace-data";

type WorkspaceView = "dashboard" | "goals" | "plans" | "execution" | "review";

function SidebarCard({
  title,
  items,
}: {
  title: string;
  items: Array<string | { name: string; date: string; status: string } | { title: string; progress: string; percent: number }>;
}) {
  return (
    <section className="panel">
      <div className="panel-title">{title}</div>
      <div className="stack">
        {items.map((item) => {
          if (typeof item === "string") {
            return (
              <div key={item} className="list-row">
                <span className="list-bullet" />
                <span>{item}</span>
              </div>
            );
          }

          if ("name" in item) {
            return (
              <div key={item.name} className="event-row">
                <div className="event-name">{item.name}</div>
                <div className="event-date">{item.date}</div>
                <div className="pill pill-muted">{item.status}</div>
              </div>
            );
          }

          return (
            <div key={item.title} className="reading-card">
              <div className="reading-title">{item.title}</div>
              <div className="reading-progress">{item.progress}</div>
              <div className="reading-bar">
                <span style={{ width: `${item.percent}%` }} />
              </div>
              <div className="reading-percent">{item.percent}%</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {action ? <span>{action}</span> : null}
    </div>
  );
}

function PlannerCalendar({ data }: { data: WorkspaceData }) {
  return (
    <section className="section">
      <SectionHeader title="Planner Calendar" action="Agenda organizada pelo agente e pelo workspace" />
      <div className="calendar-planner">
        <div className="planner-board">
          {data.calendarDays.map((day) => (
            <article key={`${day.label}-${day.date}`} className="planner-day">
              <div className="planner-day-head">
                <strong>{day.label}</strong>
                <span>{day.date}</span>
              </div>
              <div className="planner-day-focus">{day.focus}</div>
              <div className="planner-items">
                {day.items.length ? (
                  day.items.map((item) => (
                    <div key={item.id} className={`planner-item planner-item-${item.tone}`}>
                      <div className="planner-item-time">{item.time}</div>
                      <div className="planner-item-body">
                        <strong>{item.title}</strong>
                        <span>{item.track}</span>
                      </div>
                      <div className="planner-item-status">{item.status}</div>
                    </div>
                  ))
                ) : (
                  <div className="planner-empty">Sem blocos confirmados</div>
                )}
              </div>
            </article>
          ))}
        </div>

        <aside className="planner-inbox">
          <div className="planner-inbox-title">Agent Inbox</div>
          <div className="stack">
            {data.calendarInbox.map((item) => (
              <article key={item.id} className="planner-inbox-card">
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
                <span>{item.source}</span>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function DashboardContent({ data }: { data: WorkspaceData }) {
  return (
    <>
      <PlannerCalendar data={data} />

      <section className="section">
        <SectionHeader title="Classes" action="88 all" />
        <div className="class-grid">
          {data.classStats.map((item) => (
            <article key={item.name} className="small-card">
              <div className="small-card-title">{item.name}</div>
              <div>{item.assignments} Assignments Left</div>
              <div>{item.progress}%</div>
              <div>{item.tasksLeft} Tasks Left</div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeader title="Timetable" action="Table" />
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Mon</th>
                <th>Tue</th>
                <th>Wed</th>
                <th>Thu</th>
                <th>Fri</th>
                <th>Sat</th>
              </tr>
            </thead>
            <tbody>
              {data.timetable.map((row) => (
                <tr key={row.time}>
                  {[row.time, row.mon, row.tue, row.wed, row.thu, row.fri, row.sat].map((value, index) => (
                    <td key={`${row.time}-${index}`}>{value || "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <SectionHeader title="Upcoming Assessments" action="Exams" />
        <div className="assessment-grid">
          {data.assessments.map((item) => (
            <article key={`${item.title}-${item.subject}`} className="assessment-card">
              <div className="assessment-title">{item.title}</div>
              <div>{item.subject}</div>
              <div>{item.dueDate}</div>
              <div className="assessment-accent">{item.daysLeft}</div>
            </article>
          ))}
        </div>
        <div className="table-card compact">
          <table>
            <thead>
              <tr>
                <th>Deadline</th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Courses</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {data.assignmentsTable.map((item) => (
                <tr key={item.name}>
                  <td>{item.overdue}</td>
                  <td>{item.name}</td>
                  <td>{item.type}</td>
                  <td>
                    <span className={`pill ${item.status === "In progress" ? "pill-blue" : "pill-orange"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.course}</td>
                  <td>{item.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <SectionHeader title="Tasks" action="Today · This Week · Overdue" />
        <div className="table-card compact">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Date</th>
                <th>Effort</th>
                <th>Impact</th>
                <th>Priority</th>
                <th>Course</th>
              </tr>
            </thead>
            <tbody>
              {data.taskTable.map((item, index) => (
                <tr key={`${item.name}-${index}`}>
                  <td>{item.name}</td>
                  <td>{item.date}</td>
                  <td><span className="pill pill-muted">{item.effort}</span></td>
                  <td><span className="pill pill-muted">{item.impact}</span></td>
                  <td>{"★".repeat(item.priority)}</td>
                  <td>{item.course}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <SectionHeader title="Flashcard Repetition" action="Today · All Decks" />
        <div className="single-line-card">
          <div>Biology Chapter 1 Flashcards</div>
          <div className="single-line-meta">August 31, 2026 · Biology · Overdue</div>
        </div>
      </section>

      <section className="section">
        <SectionHeader title="Resources" action="Recent · Favourite" />
        <div className="resource-list">
          {data.resourceItems.map((item) => (
            <div key={item.title} className="resource-row">
              <div>
                <div className="resource-title">{item.title}</div>
                <div className="resource-source">{item.source}</div>
              </div>
              <div className="resource-meta">
                <span className="pill pill-muted">{item.tag}</span>
                <span className="pill">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeader title="Notes" action="Recent · Fav" />
        <div className="notes-grid">
          {data.notes.map((note) => (
            <article key={note.title} className="note-card">
              <h3>{note.title}</h3>
              <p>{note.excerpt}</p>
              <div className="note-footer">
                <span>{note.category}</span>
                <span>{note.date}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function GoalsContent({ data }: { data: WorkspaceData }) {
  return (
    <section className="section">
      <SectionHeader title="Objetivos" action="Novo objetivo" />
      <div className="goal-grid">
        {data.goalCards.map((goal) => (
          <article key={goal.title} className="focus-card">
            <div className="focus-card-head">
              <h3>{goal.title}</h3>
              <span className="pill pill-muted">{goal.status}</span>
            </div>
            <p>{goal.detail}</p>
            <div className="metrics-row">
              <span>Prioridade {goal.priority}</span>
              <span>{goal.progress}%</span>
            </div>
            <div className="progress-bar">
              <span style={{ width: `${goal.progress}%` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PlansContent({ data }: { data: WorkspaceData }) {
  return (
    <>
      <PlannerCalendar data={data} />
      <section className="section">
        <SectionHeader title="Plano" action="Versao 3 · semanal · origem agente" />
        <div className="goal-grid">
          {data.planOverview.map((plan) => (
            <article key={plan.title} className="focus-card">
              <div className="focus-card-head">
                <h3>{plan.title}</h3>
                <span className="pill pill-muted">{plan.meta}</span>
              </div>
              <div className="stack">
                {plan.items.map((item) => (
                  <div key={item} className="list-row">
                    <span className="list-bullet" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function ExecutionContent({ data }: { data: WorkspaceData }) {
  return (
    <>
      <PlannerCalendar data={data} />
      <section className="section">
        <SectionHeader title="Execucao diaria" action="Start · Pause · Complete · Blocked" />
        <div className="goal-grid">
          <article className="focus-card">
            <div className="focus-card-head">
              <h3>Controle operacional do dia</h3>
              <span className="pill pill-blue">Live</span>
            </div>
            <div className="execution-grid">
              {data.executionSteps.map((item) => (
                <div key={item.label} className="execution-item">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
            <div className="action-row">
              <button>Iniciar</button>
              <button>Pausar</button>
              <button>Concluir</button>
              <button>Bloqueada</button>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}

function ReviewContent({ data }: { data: WorkspaceData }) {
  return (
    <>
      <section className="section">
        <SectionHeader title="Revisao semanal" action="Semana 15" />
        <div className="review-grid">
          {data.reviewMetrics.map((metric) => (
            <article key={metric.label} className="metric-card">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="section dual-section">
        <article className="focus-card">
          <div className="focus-card-head">
            <h3>Gargalos</h3>
          </div>
          <div className="stack">
            {data.weeklyBottlenecks.map((item) => (
              <div key={item} className="list-row">
                <span className="list-bullet" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="focus-card">
          <div className="focus-card-head">
            <h3>Recomendacoes</h3>
          </div>
          <div className="stack">
            {data.recommendations.map((item) => (
              <div key={item} className="list-row">
                <span className="list-bullet" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}

function getTitle(view: WorkspaceView) {
  switch (view) {
    case "goals":
      return "Goals Workspace";
    case "plans":
      return "Plan Workspace";
    case "execution":
      return "Execution Workspace";
    case "review":
      return "Review Workspace";
    default:
      return "Ultimate Student OS (Brown)";
  }
}

function renderContent(view: WorkspaceView, data: WorkspaceData) {
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <main className="page-shell">
      <div className={`workspace ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
        <header className="hero" />

        <div className="workspace-grid">
          <aside className={`sidebar ${sidebarOpen ? "is-open" : "is-hidden"}`}>
            <div className="brand-mark">
              <button
                type="button"
                className="sidebar-toggle sidebar-toggle-inline"
                onClick={() => setSidebarOpen((current) => !current)}
                aria-label={sidebarOpen ? "Ocultar sidebar" : "Mostrar sidebar"}
              >
                {sidebarOpen ? "Ocultar" : "Mostrar"}
              </button>
              <span className="brand-icon" />
              <span>Horus Planner</span>
            </div>
            <div className="sidebar-scroll">
              <SidebarCard title="Quick Actions" items={data.quickActions} />
              <SidebarCard title="Management" items={data.managementLinks} />
              <SidebarCard title="Directory" items={data.directoryLinks} />
              <SidebarCard title="Trackers" items={data.trackerLinks} />

              <section className="panel player-card">
                <div className="panel-title">Dreamy Brown Noise</div>
                <div className="player-surface">
                  <div>Brown noise</div>
                  <div>Focus mode</div>
                  <div>56 min session</div>
                </div>
              </section>

              <SidebarCard title="Agenda Events" items={data.agendaEvents} />
              <SidebarCard title="Habit Journal" items={data.habits} />
              <SidebarCard title="Currently Reading" items={data.readingList} />
            </div>
          </aside>

          <section className="content">
            <div className="title-block">
              <div className="title-group">
                <div className="toolbar-row">
                  <button
                    type="button"
                    className="sidebar-toggle"
                    onClick={() => setSidebarOpen((current) => !current)}
                    aria-label={sidebarOpen ? "Ocultar sidebar" : "Mostrar sidebar"}
                  >
                    {sidebarOpen ? "Recolher menu" : "Abrir menu"}
                  </button>
                  <span className="toolbar-note">Main ajustado para ocupar toda a area util da pagina.</span>
                </div>
                <h1>{getTitle(view)}</h1>
              </div>
              <nav className="top-nav">
                {primaryNavigation.map((item) => {
                  const isActive =
                    (view === "dashboard" && item.href === "/") ||
                    (view !== "dashboard" && item.href === `/${view}`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={isActive ? "active" : ""}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {renderContent(view, data)}
          </section>

          <aside className="utility">
            <section className="calendar-widget">
              <div className="calendar-numbers">
                <div>
                  <strong>01</strong>
                  <span>PM</span>
                </div>
                <div>
                  <strong>12</strong>
                  <span>Sunday</span>
                </div>
              </div>
            </section>

            <section className="timer-widget">
              <div className="timer-modes">
                <span>Pomodoro</span>
                <span>Short Break</span>
                <span>Long Break</span>
              </div>
              <div className="timer-value">25:00</div>
              <button>Start</button>
              <div className="timer-footer">
                <span>Mode</span>
                <span>Setup</span>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
