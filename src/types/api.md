# API 类型定义说明

本文档说明前端与后端 API 交互时的类型定义和命名约定。

---

## 命名约定 ⚠️

**后端 API 使用 camelCase 命名规则**，而不是 snake_case。

### TypeScript 接口定义

所有 API 请求和响应的 TypeScript 类型应使用 **camelCase**：

```typescript
// ✅ 正确的类型定义
interface Agent {
  id: string;
  companyId: string;
  name: string;
  role: AgentRole;
  adapterType: string;
  trustPreset?: string;
  budgetMonthlyCents?: number;
  reportsTo?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateAgentInput {
  name: string;
  role: AgentRole;
  email?: string;
  adapterType: string;
  trustPreset?: string;
  title?: string;
  budgetMonthlyCents?: number;
  adapterConfig?: Record<string, any>;
  runtimeConfig?: Record<string, any>;
  reportsTo?: string | null;
}

// ❌ 错误的命名（不要使用 snake_case）
interface Agent {
  adapter_type: string;  // 错误！
  trust_preset: string;  // 错误！
  budget_monthly_cents: number;  // 错误！
}
```

---

## Issue API 类型

```typescript
interface Issue {
  id: string;
  companyId: string;
  projectId?: string | null;
  title: string;
  description?: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  workMode: IssueWorkMode;
  assigneeAgentId?: string | null;
  assigneeUserId?: string | null;
  parentId?: string | null;
  
  // 新增：Issue 标识符 ✨
  identifier?: string | null;  // 格式: "ISSUE-1", "ISSUE-2"
  issueNumber?: number | null;  // 数字序号: 1, 2, 3...
  
  createdAt: string;
  updatedAt: string;
}

interface CreateIssueInput {
  title: string;
  description?: string;
  priority?: IssuePriority;
  status?: IssueStatus;
  assigneeAgentId?: string;
  assigneeUserId?: string;
  parentId?: string;
  projectId?: string;
  workMode?: IssueWorkMode;
}

interface UpdateIssueInput {
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeAgentId?: string | null;
  assigneeUserId?: string | null;
}
```

---

## 枚举类型

### AgentRole

```typescript
type AgentRole = 
  | 'ceo'        // CEO（首个 Agent 自动设置）
  | 'vp'         // VP 级别
  | 'manager'    // 管理者
  | 'researcher' // 研究员
  | 'general';   // 通用角色（推荐用于普通 Agent）
```

### AdapterType

```typescript
type AdapterType =
  | 'claude_local'  // Claude Code CLI harness
  | 'codex'         // Codex CLI harness
  | 'cursor'        // Cursor CLI harness
  | 'gemini_local'  // Gemini CLI harness
  | 'opencode'      // OpenCode multi-provider harness
  | 'pi';           // Pi harness
```

### IssueStatus

```typescript
type IssueStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'blocked'
  | 'done'
  | 'cancelled';
```

### IssuePriority

```typescript
type IssuePriority =| 'critical'
  | 'high'
  | 'medium'
  | 'low';
```

### IssueWorkMode

```typescript
type IssueWorkMode =
  | 'standard'
  | 'low_trust_review';
```

---

## API 响应格式

所有 API 响应都遵循相同的 camelCase 格式：

```typescript
// GET /api/companies/:companyId/agents
interface AgentsResponse {
  data: Agent[];
  total?: number;
}

// POST /api/companies/:companyId/agents
interface CreateAgentResponse {
  data: Agent;
}

// PATCH /api/agents/:agentId
interface UpdateAgentResponse {
  data: Agent;
}
```

---

## 常见错误

### 1. 字段名错误

```typescript
// ❌ 错误
const payload = {
  adapter_type: 'claude_local',
  trust_preset: 'standard',
};

// ✅ 正确
const payload = {
  adapterType: 'claude_local',
  trustPreset: 'standard',
};
```

### 2. Enum 值错误

```typescript
// ❌ 错误 - role 不是合法值
const agent = {
  role: 'admin',  // 不存在的 role
};

// ✅ 正确
const agent = {
  role: 'general',  // 合法的 role
};
```

---

## 类型检查

在开发环境中启用 TypeScript 严格模式：

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

使用类型检查工具验证：

```bash
npm run typecheck
```

---

## 更多资源

- **完整 API 文档**: [docs/API_GUIDE.md](../../docs/API_GUIDE.md)
- **架构文档**: [ARCHITECTURE.md](../../ARCHITECTURE.md)
- **更新日志**: [CHANGELOG.md](../../CHANGELOG.md)

---

**最后更新**: 2026-08-18  
**版本**: 0.1.0
