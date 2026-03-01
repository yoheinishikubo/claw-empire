import type { Agent, Department, WorkflowPackKey } from "../types";

function mergePackAgent(globalAgent: Agent | undefined, packAgent: Agent): Agent {
  // DB row is the source of truth after hydration.
  if (globalAgent) return globalAgent;
  // Fallback for edge cases before hydration settles.
  return packAgent;
}

function mergePackDepartment(globalDepartment: Department | undefined, packDepartment: Department): Department {
  // DB row is the source of truth after hydration.
  if (globalDepartment) return globalDepartment;
  // Fallback for edge cases before hydration settles.
  return packDepartment;
}

export function resolvePackAgentViews(params: {
  packKey: WorkflowPackKey;
  globalAgents: Agent[];
  packAgents?: Agent[] | null;
}): { scopedAgents: Agent[]; mergedAgents: Agent[] } {
  const { packKey, globalAgents, packAgents } = params;
  if (packKey === "development" || !packAgents || packAgents.length === 0) {
    return { scopedAgents: globalAgents, mergedAgents: globalAgents };
  }

  const globalById = new Map<string, Agent>();
  for (const agent of globalAgents) {
    globalById.set(agent.id, agent);
  }

  const scopedAgents = packAgents.map((packAgent) => mergePackAgent(globalById.get(packAgent.id), packAgent));
  const scopedAgentIds = new Set(scopedAgents.map((agent) => agent.id));
  const mergedAgents = [...scopedAgents, ...globalAgents.filter((agent) => !scopedAgentIds.has(agent.id))];
  return { scopedAgents, mergedAgents };
}

export function resolvePackDepartmentsForDisplay(params: {
  packKey: WorkflowPackKey;
  globalDepartments: Department[];
  packDepartments?: Department[] | null;
}): Department[] {
  const { packKey, globalDepartments, packDepartments } = params;
  if (packKey === "development" || !packDepartments || packDepartments.length === 0) {
    return globalDepartments;
  }

  const globalById = new Map<string, Department>();
  for (const department of globalDepartments) {
    globalById.set(department.id, department);
  }

  const scopedDepartments = packDepartments.map((packDepartment) =>
    mergePackDepartment(globalById.get(packDepartment.id), packDepartment),
  );
  const scopedDeptIds = new Set(scopedDepartments.map((department) => department.id));
  return [...scopedDepartments, ...globalDepartments.filter((department) => !scopedDeptIds.has(department.id))];
}
