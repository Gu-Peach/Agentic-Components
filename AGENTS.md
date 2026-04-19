# Agentic Coding Guidelines for behavior

This document defines the operational parameters, code style, and architectural standards for AI agents working in this repository.

## 1. Hard Constraints (Non-Negotiable)

### File & Folder Limits

- **Dynamic Languages (Python, TS, JS)**: Maximum **200 lines** per file. If a file exceeds this, refactor into smaller cohesive modules.
- **Static Languages (Go, Rust, Java)**: Maximum **250 lines** per file.
- **Folder Density**: Maximum **8 files** per folder. Organize into logical sub-folders if this is exceeded.

### Architectural "Bad Smells" - PROACTIVE OPTIMIZATION REQUIRED

You must monitor for and suggest optimizations for:

1. **Rigidity**: System is hard to change; small edits cause cascade effects.
2. **Redundancy**: Duplicate logic across multiple locations.
3. **Circular Dependency**: Modules mutually depending on each other.
4. **Fragility**: Changes break unrelated functionality.
5. **Obscurity**: Intent is unclear; structure is confusing.
6. **Data Clump**: Group of variables always passed together (should be an object).
7. **Needless Complexity**: Over-engineering simple problems.

**MANDATORY**: If you identify these smells, you **MUST** ask the user for permission to optimize and provide a specific suggestion.

---

## 2. Backend (Python/FastAPI)

- **Manager**: `uv` (Fast Python package installer).
- **Commands**:
  - Sync: `uv sync`
  - Dev: `uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000`
  - All Tests: `uv run pytest`
  - Single File: `uv run pytest tests/test_transpiler.py`
  - Single Case: `uv run pytest tests/test_transpiler.py::test_specific_function`
- **Code Style**:
  - **Formatting**: PEP 8. Single quotes `'` for strings.
  - **Type Hinting**: **Mandatory** (Python 3.9+ syntax).
  - **Models**: Pydantic v2. Use `model_config = {"extra": "allow", "populate_by_name": True}`.
  - **Async**: Mandatory for route handlers and database operations.
  - **Error Handling**: Use `HTTPException` for API responses.

---

## 3. Frontend (Next.js/React)

- **Manager**: `pnpm` (v10+).
- **Commands**:
  - Install: `pnpm install`
  - Dev: `pnpm run dev`
  - Lint: `pnpm run lint`
  - Generate Data: `pnpm run generate:ontology`
- **Code Style**:
  - **Framework**: Next.js 16 (App Router), React 19, TypeScript (Strict).
  - **Styling**: Tailwind CSS 4 utility classes exclusively.
  - **Visualization**: Cytoscape.js. Relationships: Blue (`#3b82f6`); Inheritance: Amber (`#f59e0b`).
  - **DTDL Utilities**: Use `isType` and `getDisplayName` helpers.
  - **State**: Zustand for global; React Hooks for local.

---

## 4. Operational Rules

- **Absolute Paths**: Always use absolute paths (e.g., `/Users/laobao/myworkspace/3stooges-dtdl-ontology/backend/main.py`).
- **Repo Safety**: `/repo/` is read-only. Do not delete files or stage external code for commit.
- **Delegation Protocol**:
  - **Visual/UI**: `delegate_task(category="visual-engineering", load_skills=["frontend-ui-ux"])`
  - **Browser/E2E**: `delegate_task(category="unspecified-high", load_skills=["playwright"])`
  - **Complex Logic**: `delegate_task(category="ultrabrain")`
  - **Git Operations**: `delegate_task(category="quick", load_skills=["git-master"])`
- **Definition of Done (DoD)**:
  1. **Verification**: `pytest` passes, `lint` passes, `lsp_diagnostics` clean.
  2. **Evidence**: Provide execution logs.
  3. **History**: No `.env` commits. Use conventional commits (`feat:`, `fix:`, `refactor:`).

---

## 5. Task Execution Protocol

### Stage Task Management (Mandatory)

- **Before starting a new stage**: You **MUST** first update the "阶段目标" and "当前阶段任务清单" sections in `TODO.md` with the stage objectives and task list.
- **Stage objectives must include**:
  - Current stage name and milestone
  - Stage duration (e.g., 2 weeks)
  - Stage goals (what to achieve)
  - Acceptance criteria (measurable success metrics)
- **Task list format**: Each task must follow the format:
  ```
  - `ready` `<MODULE>-<TYPE>-<SEQ>` `<P0|P1|P2>` `<milestone>`
    <task description>
    Acceptance Criteria: <measurable completion criteria>
  ```
- **Task status workflow**: `ready` → `in_progress` → `done`
- **After completing each task**: You **MUST** immediately update the task status in `TODO.md` from `in_progress` to `done`.
- **Prohibited**: Starting stage work without first updating `TODO.md` with stage objectives and task list.

### Planning Before Execution (Mandatory)

- Before starting any multi-step task, you **MUST** write a task plan into the current stage of `TODO.md` first, then begin execution.
- Task entries must strictly follow the TODO.md format shown above.
- After writing the plan, update each entry's status from `ready` → `in_progress` → `done` as you proceed.
- **Prohibited**: Executing any multi-step task without first writing a plan to `TODO.md`.


### Step Confirmation

- After completing each sub-step, output a brief progress summary (completed / remaining) and wait for user confirmation before proceeding to the next step.

### Edit Failure Handling

- After an Edit failure, **do not retry immediately**. You **MUST** first Read the target file to confirm its actual current content, then regenerate a precisely matching `str_replace` pair.
- When performing multiple consecutive Edits on the same file, you **MUST** re-Read the file before each Edit to ensure `old_str` exactly matches the file's current content.

### Tool Calling Protocol (CRITICAL)

**MANDATORY**: All tool calls MUST include complete and valid parameters. Empty or incomplete tool calls are STRICTLY PROHIBITED.

#### Correct Tool Call Format

Every tool invocation MUST follow this structure:

```xml
<invoke name="ToolName">
<parameter name="parameter_name">parameter_value</parameter>
<parameter name="another_parameter">another_value</parameter>
</invoke>
```

#### Common Tool Requirements

**Edit Tool** - Requires ALL three parameters:
```xml
<invoke name="Edit">
<parameter name="file_path">E:\project\behavior\file.ts</parameter>
<parameter name="old_string">exact text to replace</parameter>
<parameter name="new_string">new text content</parameter>
</invoke>
```

**Write Tool** - Requires both parameters:
```xml
<invoke name="Write">
<parameter name="file_path">E:\project\behavior\file.ts</parameter>
<parameter name="content">file content here</parameter>
</invoke>
```

**Read Tool** - Requires file_path:
```xml
<invoke name="Read">
<parameter name="file_path">E:\project\behavior\file.ts</parameter>
</invoke>
```

#### PROHIBITED Patterns

**NEVER** call tools with missing parameters:
```xml
<!-- ❌ WRONG - Missing all parameters -->
<invoke name="Edit">
</invoke>

<!-- ❌ WRONG - Missing required parameters -->
<invoke name="Edit">
<parameter name="file_path">E:\project\behavior\file.ts</parameter>
</invoke>

<!-- ❌ WRONG - Empty parameters -->
<invoke name="Write">
<parameter name="file_path"></parameter>
<parameter name="content"></parameter>
</invoke>
```

#### Error Recovery Protocol

1. **If a tool call fails**: Read the error message carefully
2. **Identify the root cause**: Missing parameter? Wrong file path? Content mismatch?
3. **For Edit failures**: MUST Read the file first to confirm current content
4. **Never retry blindly**: Fix the underlying issue before retrying
5. **Never repeat the same failed call**: Each retry must address the specific error

#### Self-Check Before Tool Calls

Before invoking ANY tool, verify:
- [ ] All required parameters are present
- [ ] All parameter values are non-empty
- [ ] File paths are absolute and correct
- [ ] For Edit: `old_string` exactly matches file content
- [ ] For Edit: `new_string` is different from `old_string`

---

## 6. OpenSpec Documentation Language

- **Language**: All OpenSpec artifacts (proposal.md, design.md, specs, tasks.md) **MUST** be written in **Chinese (Simplified)**.
- **Rationale**: The project team primarily communicates in Chinese. Chinese documentation improves readability and reduces translation overhead.
- **Enforcement**: When using `/openspec-propose` or creating OpenSpec changes, generate all content in Chinese.
- **Exception**: Code examples, API endpoints, and technical identifiers should remain in English.

---

_Generated by Sisyphus. Updated: Apr 2026._