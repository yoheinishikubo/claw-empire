# Development Team Deliverable - Skill Learning History & Prompt Skill Header

## Scope
- Owner: Development Team (Aria/Bolt)
- Date: 2026-02-20
- Goal: Persist CLI-specific skill-learning history and expose currently available skills at the top of task execution prompts.

## 1) DB Design (Required Columns / Keys / Retention)
Table: `skill_learning_history`

Required columns:
- `id` (TEXT, PK)
- `job_id` (TEXT, NOT NULL) - learning job correlation key
- `provider` (TEXT, NOT NULL) - CLI provider scope (`claude`, `codex`, `gemini`, `opencode`, `copilot`, `antigravity`, `api`)
- `repo` (TEXT, NOT NULL) - skill source repo
- `skill_id` (TEXT, NOT NULL) - normalized skill id
- `skill_label` (TEXT, NOT NULL) - prompt/header friendly label
- `status` (TEXT, NOT NULL) - `queued | running | succeeded | failed`
- `command` (TEXT, NOT NULL) - executed command snapshot
- `error` (TEXT, nullable) - failure reason
- `run_started_at` (INTEGER, nullable)
- `run_completed_at` (INTEGER, nullable)
- `created_at` (INTEGER)
- `updated_at` (INTEGER)

Keys/indexes:
- PK: `id`
- Unique key: `(job_id, provider)`
- Index: `(provider, status, updated_at DESC)`
- Index: `(provider, repo, skill_id, updated_at DESC)`

Retention policy:
- Time retention: keep 180 days (`COALESCE(run_completed_at, updated_at, created_at)` 기준)
- Volume retention: provider별 최신 2,000건 유지, 초과분 자동 정리

## 2) Prompt Top Skills Exposure Rules
Trigger:
- On each task execution start (`startTaskExecutionForAgent`), build prompt header block from DB.

Priority:
1. Current provider success history (`status='succeeded'`) 최신순
2. If provider-specific list is empty, fallback to global success history
3. If none exists, emit explicit `none` marker

Exception handling:
- Query failure: emit `[unavailable]`
- No learned skills: emit `[none]`
- Long labels: clipped to safe length
- Maximum items in header: 8

Prompt format:
- First line starts with `[Available Skills]...` and tag list in bracket style (`[...][...]`)
- Second line includes `[Skills Rule]` guidance for usage priority

## 3) 2-Week Execution Actions (Owner / Done Criteria)
| Action | Owner | Done Criteria |
|---|---|---|
| A1. Learning history persistence hardening | Bolt (Dev) | `POST /api/skills/learn` lifecycle(`queued/running/succeeded/failed`) updates DB rows and returns 정상 응답 |
| A2. Prompt header integration verification | Aria (Dev) | 실제 task run prompt 상단에 provider별 skills header 노출 확인 (`none/global/provider` 3케이스) |
| A3. Ops observability hook | Bolt + Ops liaison | `/api/skills/history`, `/api/skills/available`로 최근 이력/가용 스킬 조회 가능 |
| A4. Backward compatibility check | Aria | 기존 DB에서 서버 기동 시 migration 오류 없음, 기존 task/workflow 동작 회귀 없음 |
| A5. Release readiness notes | Dev Team | 릴리즈 노트 초안에 스키마 추가/프롬프트 규칙/운영 파라미터(보존정책) 반영 |

## Implemented Files
- `server/server-main.ts`
- `server/modules/routes/ops.ts`
- `server/modules/workflow/orchestration.ts`
