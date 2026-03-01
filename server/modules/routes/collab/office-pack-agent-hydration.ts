import type { DatabaseSync } from "node:sqlite";
import type { AgentRow } from "./direct-chat-types.ts";

type DbLike = Pick<DatabaseSync, "prepare">;

const VALID_AGENT_ROLES = new Set(["team_leader", "senior", "junior", "intern"]);
const VALID_CLI_PROVIDERS = new Set(["claude", "codex", "gemini", "opencode", "copilot", "antigravity", "api"]);

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeOptionalText(value: unknown): string | null {
  const text = normalizeText(value);
  return text.length > 0 ? text : null;
}

function normalizePositiveInt(value: unknown, fallback: number): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const i = Math.trunc(num);
  return i >= 0 ? i : fallback;
}

function normalizeNullablePositiveInt(value: unknown): number | null {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const i = Math.trunc(num);
  return i > 0 ? i : null;
}

function parseJsonSafe(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

type OfficePackProfileAgent = {
  id: string;
  name: string;
  name_ko: string;
  name_ja: string;
  name_zh: string;
  department_id: string | null;
  role: string;
  acts_as_planning_leader: number;
  cli_provider: string;
  cli_model: string | null;
  cli_reasoning_level: string | null;
  avatar_emoji: string;
  sprite_number: number | null;
  personality: string | null;
  created_at: number;
};

type OfficePackProfileDepartment = {
  id: string;
  name: string;
  name_ko: string;
  name_ja: string;
  name_zh: string;
  icon: string;
  color: string;
  description: string | null;
  prompt: string | null;
  sort_order: number;
  created_at: number;
};

function normalizeOfficePackProfileAgent(raw: unknown, nowMs: number): OfficePackProfileAgent | null {
  const obj = asObject(raw);
  if (!obj) return null;

  const id = normalizeText(obj.id);
  if (!id) return null;

  const name = normalizeText(obj.name) || id;
  const roleRaw = normalizeText(obj.role).toLowerCase();
  const cliProviderRaw = normalizeText(obj.cli_provider).toLowerCase();

  return {
    id,
    name,
    name_ko: normalizeText(obj.name_ko) || name,
    name_ja: normalizeText(obj.name_ja),
    name_zh: normalizeText(obj.name_zh),
    department_id: normalizeOptionalText(obj.department_id),
    role: VALID_AGENT_ROLES.has(roleRaw) ? roleRaw : "senior",
    acts_as_planning_leader:
      roleRaw === "team_leader" && normalizePositiveInt(obj.acts_as_planning_leader, 0) > 0 ? 1 : 0,
    cli_provider: VALID_CLI_PROVIDERS.has(cliProviderRaw) ? cliProviderRaw : "codex",
    cli_model: normalizeOptionalText(obj.cli_model),
    cli_reasoning_level: normalizeOptionalText(obj.cli_reasoning_level),
    avatar_emoji: normalizeText(obj.avatar_emoji) || "🤖",
    sprite_number: normalizeNullablePositiveInt(obj.sprite_number),
    personality: normalizeOptionalText(obj.personality),
    created_at: normalizePositiveInt(obj.created_at, nowMs),
  };
}

function normalizeOfficePackProfileDepartment(raw: unknown, nowMs: number): OfficePackProfileDepartment | null {
  const obj = asObject(raw);
  if (!obj) return null;

  const id = normalizeText(obj.id);
  if (!id) return null;

  const name = normalizeText(obj.name) || id;
  return {
    id,
    name,
    name_ko: normalizeText(obj.name_ko) || name,
    name_ja: normalizeText(obj.name_ja),
    name_zh: normalizeText(obj.name_zh),
    icon: normalizeText(obj.icon) || "🏢",
    color: normalizeText(obj.color) || "#64748b",
    description: normalizeOptionalText(obj.description),
    prompt: normalizeOptionalText(obj.prompt),
    sort_order: normalizePositiveInt(obj.sort_order, 99),
    created_at: normalizePositiveInt(obj.created_at, nowMs),
  };
}

function findOfficePackProfileAgentById(
  root: Record<string, unknown>,
  agentId: string,
  nowMs: number,
): { agent: OfficePackProfileAgent; department: OfficePackProfileDepartment | null } | null {
  for (const profileRaw of Object.values(root)) {
    const profile = asObject(profileRaw);
    if (!profile) continue;

    const departments = Array.isArray(profile.departments)
      ? profile.departments.map((entry) => normalizeOfficePackProfileDepartment(entry, nowMs)).filter(Boolean)
      : [];
    const agentItems = Array.isArray(profile.agents)
      ? profile.agents.map((entry) => normalizeOfficePackProfileAgent(entry, nowMs)).filter(Boolean)
      : [];

    const agent = (agentItems as OfficePackProfileAgent[]).find((entry) => entry.id === agentId);
    if (!agent) continue;

    const department = agent.department_id
      ? (departments as OfficePackProfileDepartment[]).find((entry) => entry.id === agent.department_id) ?? null
      : null;
    return { agent, department };
  }
  return null;
}

function ensureDepartmentExists(
  db: DbLike,
  departmentId: string | null,
  department: OfficePackProfileDepartment | null,
  nowMs: number,
): string | null {
  if (!departmentId) return null;
  const existing = db.prepare("SELECT id FROM departments WHERE id = ? LIMIT 1").get(departmentId) as
    | { id?: unknown }
    | undefined;
  if (normalizeText(existing?.id)) return departmentId;

  const source = department;
  if (!source) return null;
  try {
    db.prepare(
      `
      INSERT OR IGNORE INTO departments (
        id, name, name_ko, name_ja, name_zh, icon, color, description, prompt, sort_order, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      source.id,
      source.name,
      source.name_ko,
      source.name_ja,
      source.name_zh,
      source.icon,
      source.color,
      source.description,
      source.prompt,
      source.sort_order,
      source.created_at || nowMs,
    );
  } catch {
    return null;
  }

  const inserted = db.prepare("SELECT id FROM departments WHERE id = ? LIMIT 1").get(departmentId) as
    | { id?: unknown }
    | undefined;
  return normalizeText(inserted?.id) ? departmentId : null;
}

export function hydrateOfficePackAgentFromSettings(
  db: DbLike,
  agentId: string,
  nowMs: () => number,
): AgentRow | null {
  const normalizedAgentId = normalizeText(agentId);
  if (!normalizedAgentId) return null;

  const existing = db.prepare("SELECT * FROM agents WHERE id = ?").get(normalizedAgentId) as AgentRow | undefined;
  if (existing) return existing;

  const settingsRow = db.prepare("SELECT value FROM settings WHERE key = 'officePackProfiles' LIMIT 1").get() as
    | { value?: unknown }
    | undefined;
  if (!settingsRow) return null;

  const parsed = parseJsonSafe(settingsRow.value);
  const root = asObject(parsed);
  if (!root) return null;

  const now = nowMs();
  const found = findOfficePackProfileAgentById(root, normalizedAgentId, now);
  if (!found) return null;

  const deptId = ensureDepartmentExists(db, found.agent.department_id, found.department, now);

  try {
    db.prepare(
      `
      INSERT OR IGNORE INTO agents (
        id, name, name_ko, name_ja, name_zh, department_id, role,
        acts_as_planning_leader,
        cli_provider, avatar_emoji, sprite_number, personality, status, current_task_id,
        stats_tasks_done, stats_xp, created_at, cli_model, cli_reasoning_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'idle', NULL, 0, 0, ?, ?, ?)
    `,
    ).run(
      found.agent.id,
      found.agent.name,
      found.agent.name_ko,
      found.agent.name_ja,
      found.agent.name_zh,
      deptId,
      found.agent.role,
      found.agent.acts_as_planning_leader,
      found.agent.cli_provider,
      found.agent.avatar_emoji,
      found.agent.sprite_number,
      found.agent.personality,
      found.agent.created_at,
      found.agent.cli_model,
      found.agent.cli_reasoning_level,
    );
  } catch {
    return null;
  }

  const hydrated = db.prepare("SELECT * FROM agents WHERE id = ?").get(found.agent.id) as AgentRow | undefined;
  return hydrated ?? null;
}

function upsertOfficePackProfileAgent(
  db: DbLike,
  agent: OfficePackProfileAgent,
  department: OfficePackProfileDepartment | null,
  now: number,
): number {
  const deptId = ensureDepartmentExists(db, agent.department_id, department, now);
  try {
    const result = db
      .prepare(
        `
      INSERT INTO agents (
        id, name, name_ko, name_ja, name_zh, department_id, role,
        acts_as_planning_leader,
        cli_provider, avatar_emoji, sprite_number, personality, status, current_task_id,
        stats_tasks_done, stats_xp, created_at, cli_model, cli_reasoning_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'idle', NULL, 0, 0, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        name_ko = excluded.name_ko,
        name_ja = excluded.name_ja,
        name_zh = excluded.name_zh,
        department_id = excluded.department_id,
        role = excluded.role,
        acts_as_planning_leader = excluded.acts_as_planning_leader,
        cli_provider = excluded.cli_provider,
        avatar_emoji = excluded.avatar_emoji,
        sprite_number = COALESCE(excluded.sprite_number, agents.sprite_number),
        personality = excluded.personality,
        cli_model = excluded.cli_model,
        cli_reasoning_level = excluded.cli_reasoning_level
    `,
      )
      .run(
        agent.id,
        agent.name,
        agent.name_ko,
        agent.name_ja,
        agent.name_zh,
        deptId,
        agent.role,
        agent.acts_as_planning_leader,
        agent.cli_provider,
        agent.avatar_emoji,
        agent.sprite_number,
        agent.personality,
        agent.created_at,
        agent.cli_model,
        agent.cli_reasoning_level,
      ) as { changes?: number } | undefined;
    return result?.changes ?? 0;
  } catch {
    return 0;
  }
}

export function syncOfficePackAgentsFromProfiles(
  db: DbLike,
  profilesRaw: unknown,
  nowMs: () => number,
): { departmentsSynced: number; agentsSynced: number } {
  const root = asObject(parseJsonSafe(profilesRaw));
  if (!root) return { departmentsSynced: 0, agentsSynced: 0 };

  let departmentsSynced = 0;
  let agentsSynced = 0;
  const now = nowMs();

  for (const profileRaw of Object.values(root)) {
    const profile = asObject(profileRaw);
    if (!profile) continue;

    const departments = Array.isArray(profile.departments)
      ? profile.departments.map((entry) => normalizeOfficePackProfileDepartment(entry, now)).filter(Boolean)
      : [];
    const departmentById = new Map<string, OfficePackProfileDepartment>();
    for (const dept of departments as OfficePackProfileDepartment[]) {
      const ensured = ensureDepartmentExists(db, dept.id, dept, now);
      if (ensured) {
        departmentById.set(ensured, dept);
        departmentsSynced += 1;
      }
    }

    const agents = Array.isArray(profile.agents)
      ? profile.agents.map((entry) => normalizeOfficePackProfileAgent(entry, now)).filter(Boolean)
      : [];
    for (const agent of agents as OfficePackProfileAgent[]) {
      const matchedDept = agent.department_id ? departmentById.get(agent.department_id) ?? null : null;
      agentsSynced += upsertOfficePackProfileAgent(db, agent, matchedDept, now);
    }
  }

  return { departmentsSynced, agentsSynced };
}

export function syncOfficePackAgentsForPack(
  db: DbLike,
  profilesRaw: unknown,
  packKey: string,
  nowMs: () => number,
): { departmentsSynced: number; agentsSynced: number } {
  const root = asObject(parseJsonSafe(profilesRaw));
  const normalizedPackKey = normalizeText(packKey);
  if (!root || !normalizedPackKey) return { departmentsSynced: 0, agentsSynced: 0 };

  const profile = asObject(root[normalizedPackKey]);
  if (!profile) return { departmentsSynced: 0, agentsSynced: 0 };

  let departmentsSynced = 0;
  let agentsSynced = 0;
  const now = nowMs();

  const departments = Array.isArray(profile.departments)
    ? profile.departments.map((entry) => normalizeOfficePackProfileDepartment(entry, now)).filter(Boolean)
    : [];
  const departmentById = new Map<string, OfficePackProfileDepartment>();
  for (const dept of departments as OfficePackProfileDepartment[]) {
    const ensured = ensureDepartmentExists(db, dept.id, dept, now);
    if (ensured) {
      departmentById.set(ensured, dept);
      departmentsSynced += 1;
    }
  }

  const agents = Array.isArray(profile.agents)
    ? profile.agents.map((entry) => normalizeOfficePackProfileAgent(entry, now)).filter(Boolean)
    : [];
  for (const agent of agents as OfficePackProfileAgent[]) {
    const matchedDept = agent.department_id ? departmentById.get(agent.department_id) ?? null : null;
    agentsSynced += upsertOfficePackProfileAgent(db, agent, matchedDept, now);
  }

  return { departmentsSynced, agentsSynced };
}
