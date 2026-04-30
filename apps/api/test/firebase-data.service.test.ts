import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { FirebaseDataService } from "../src/firebase/firebase-data.service";

test("updateTaskStatus closes active execution before persisting terminal status", async () => {
  const service = new FirebaseDataService({} as never) as FirebaseDataService & {
    closeActiveExecutionForTask: (...args: unknown[]) => Promise<unknown>;
    updateTask: (...args: unknown[]) => Promise<unknown>;
  };

  const calls: string[] = [];
  service.closeActiveExecutionForTask = async (_userId, _taskId, status) => {
    calls.push(`close:${String(status)}`);
    return { ok: true };
  };
  service.updateTask = async (_userId, _taskId, payload) => {
    const typedPayload = payload as { status: string };
    calls.push(`update:${typedPayload.status}`);
    return typedPayload;
  };

  await service.updateTaskStatus("user-1", "task-1", "PAUSED");

  assert.deepEqual(calls, ["close:PAUSED", "update:PAUSED"]);
});

test("updateTaskStatus does not close execution for non-terminal status", async () => {
  const service = new FirebaseDataService({} as never) as FirebaseDataService & {
    closeActiveExecutionForTask: (...args: unknown[]) => Promise<unknown>;
    updateTask: (...args: unknown[]) => Promise<unknown>;
  };

  let closeCalls = 0;
  service.closeActiveExecutionForTask = async () => {
    closeCalls += 1;
    return null;
  };
  service.updateTask = async (_userId, _taskId, payload) => payload;

  await service.updateTaskStatus("user-1", "task-1", "IN_PROGRESS");

  assert.equal(closeCalls, 0);
});

test("startExecution returns existing active execution instead of creating a duplicate", async () => {
  const activeExecution = {
    id: "exec-1",
    userId: "user-1",
    taskId: "task-1",
    status: "IN_PROGRESS",
    actualMinutes: 0,
    focusScore: 0,
    createdAt: new Date().toISOString(),
  };

  const service = new FirebaseDataService({} as never) as FirebaseDataService & {
    getOwnedDoc: (...args: unknown[]) => Promise<unknown>;
    findActiveExecutionForTask: (...args: unknown[]) => Promise<unknown>;
    updateTaskStatus: (...args: unknown[]) => Promise<unknown>;
    setDoc: (...args: unknown[]) => Promise<unknown>;
  };

  let updateTaskStatusCalls = 0;
  let setDocCalls = 0;
  service.getOwnedDoc = async () => ({ id: "task-1", status: "TODO" });
  service.findActiveExecutionForTask = async () => activeExecution;
  service.updateTaskStatus = async () => {
    updateTaskStatusCalls += 1;
    return null;
  };
  service.setDoc = async () => {
    setDocCalls += 1;
    return null;
  };

  const result = await service.startExecution("user-1", "task-1");

  assert.equal(result, activeExecution);
  assert.equal(updateTaskStatusCalls, 0);
  assert.equal(setDocCalls, 0);
});

test("startExecution rejects finished tasks", async () => {
  const service = new FirebaseDataService({} as never) as FirebaseDataService & {
    getOwnedDoc: (...args: unknown[]) => Promise<unknown>;
  };

  service.getOwnedDoc = async () => ({ id: "task-1", status: "DONE" });

  await assert.rejects(
    () => service.startExecution("user-1", "task-1"),
    (error) => error instanceof BadRequestException,
  );
});

test("closeActiveExecutionForTask derives minutes from startedAt when actualMinutes is not provided", async () => {
  const startedAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const service = new FirebaseDataService({} as never) as FirebaseDataService & {
    findActiveExecutionForTask: (...args: unknown[]) => Promise<unknown>;
    updateDoc: (...args: unknown[]) => Promise<unknown>;
  };

  service.findActiveExecutionForTask = async () => ({
    id: "exec-1",
    userId: "user-1",
    taskId: "task-1",
    status: "IN_PROGRESS",
    actualMinutes: 0,
    focusScore: 0,
    startedAt,
    createdAt: startedAt,
  });

  let updatedPayload: { actualMinutes?: number; status?: string } | null = null;
  service.updateDoc = async (_collectionName, _id, payload) => {
    updatedPayload = payload as { actualMinutes?: number; status?: string };
    return payload;
  };

  await service.closeActiveExecutionForTask("user-1", "task-1", "DONE");

  assert.ok(updatedPayload);
  assert.equal(updatedPayload?.status, "DONE");
  assert.ok((updatedPayload?.actualMinutes ?? 0) >= 4);
});

test("stopExecution fails when there is no active execution", async () => {
  const service = new FirebaseDataService({} as never) as FirebaseDataService & {
    getOwnedDoc: (...args: unknown[]) => Promise<unknown>;
    closeActiveExecutionForTask: (...args: unknown[]) => Promise<unknown>;
  };

  service.getOwnedDoc = async () => ({ id: "task-1", status: "IN_PROGRESS" });
  service.closeActiveExecutionForTask = async () => null;

  await assert.rejects(
    () => service.stopExecution("user-1", "task-1"),
    (error) => error instanceof NotFoundException,
  );
});
