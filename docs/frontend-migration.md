# Frontend conformance migration (FrontendRules §7, §8, §12)

Audit of items 29–31 against `claude/FrontendRules.md`, with reference
implementations landed and a checklist for the rest. Toasts are **sonner**
throughout (the only toast lib in the repo — keep it that way).

## Item 31 — ErrorBoundary on every route ✅ DONE

`app/router.tsx` now wraps every route element in `RouteErrorBoundary` via the
`guard(label, node)` helper, including the `/:slug` authenticated shell and its
children and `/invite/:token`. A page crash shows a recoverable fallback instead
of blanking the app; for nested routes the leaf boundary sits inside the shell's
`<Outlet>`, so a page error keeps the sidebar/nav intact.

## Item 29 — React Query for server state

**Reference:** `features/settings/api/useOrgMembers.ts` (+ test). The shape to
copy: a stable key factory (`xKeys.list(id)`), an explicit `staleTime`, `enabled`
guarding on required params, co-located under `features/<name>/api/`.

Today only `hooks/useBoardData.ts` uses React Query. These hooks hand-roll
`useState` + `services/api` and should migrate (read paths → `useQuery`, write
paths → `useMutation` with `queryClient.invalidateQueries`). Surface query/mutation
errors with a **sonner** `toast.error(...)`, never a silent failure.

| Hook | Reads to convert | Notes |
|---|---|---|
| `useMembers` | `getOrgMembers` | start here — pair with `useOrgMembers` reference; invites/role-change/remove → mutations that invalidate `orgMembersKeys.list(slug)` |
| `useOrg` | `getOrg` / user orgs | key: `['org', slug]` |
| `useProject` | project detail | key: `['project', projectId]` |
| `useProjectMembers` | project members | mirrors `useOrgMembers` |
| `useBacklog` | backlog issues | larger; reads + reorder mutation |
| `useWorkflow` | statuses | reads + status CRUD mutations |
| `useIssueDetail` | issue detail | reads + field-update mutations |
| `useChat` | AI chat | streaming/append — keep local state; only the history fetch is a query |
| `useAuth` | login/signup/logout | mutations, not queries; optional — auth is fine as-is |

Migration order: `useMembers` → `useProjectMembers` → `useOrg`/`useProject` →
`useWorkflow`/`useIssueDetail` → `useBacklog`. Each is independent and testable
with `renderHook` + a `QueryClientProvider` wrapper (see the reference test).

## Item 30 — React Hook Form + Zod for forms

**Reference:** `features/auth/pages/LoginPage.tsx` + `features/auth/schemas.ts`
(+ existing test, kept green). The shape to copy: a co-located Zod schema,
`useForm({ resolver: zodResolver(schema) })`, `{...register('field')}`,
inline `errors.field.message`, `disabled={isSubmitting}`, and submit failures
surfaced via a **sonner** `toast.error(...)`.

`react-hook-form` + `@hookform/resolvers` are now installed.

| Form | File | Schema home |
|---|---|---|
| Login | `features/auth/pages/LoginPage.tsx` ✅ | `features/auth/schemas.ts` |
| Signup | `features/auth/pages/SignupPage.tsx` | `features/auth/schemas.ts` (add `signupSchema`) |
| New project | `features/dashboard/NewProjectModal.tsx` | `features/dashboard/schemas.ts` |
| Create issue | `features/dashboard/components/CreateIssueModal.tsx` | `features/dashboard/schemas.ts` |
| Create sprint | `features/dashboard/components/CreateSprintModal.tsx` | `features/dashboard/schemas.ts` |
| Invite member | `features/settings/pages/MembersPage.tsx` | `features/settings/schemas.ts` |
| Issue edit | `features/dashboard/components/IssueSlideOver.tsx` | `features/dashboard/schemas.ts` |

Keep each form's existing placeholders/button labels so co-located tests keep
passing; add inline error `<p className="text-xs text-destructive">` per field.
