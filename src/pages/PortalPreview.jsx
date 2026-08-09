import { useSearchParams } from 'react-router-dom';
import AdminPortal from './AdminPortal';
import JudgePortal from './JudgePortal';

/**
 * Dev-only harness for eyeballing the imported portal designs.
 *
 * Two reasons this exists:
 *  - /admin and /judge are behind ProtectedRoute, so previewing them otherwise
 *    means holding a real Supabase session.
 *  - The Judge portal's "denied" screen and its PR-evaluator loading/error
 *    states are driven by props. In the running app those come from the role
 *    check and the real PREvaluator; here they come from the query string.
 *
 * Registered only when import.meta.env.DEV — never reachable in production.
 */
export function AdminPreview() {
  return <AdminPortal />;
}

export function JudgePreview() {
  const [params] = useSearchParams();
  return (
    <JudgePortal
      view={params.get('view') || 'list'}
      prEvaluatorState={params.get('pr') || 'ready'}
      assignmentsEmpty={params.get('empty') === '1'}
    />
  );
}
