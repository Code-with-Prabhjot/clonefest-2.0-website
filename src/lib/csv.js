/**
 * Client-side CSV export.
 *
 * Everything the admin console exports is already in memory from useEventData,
 * so there is no server round trip. Values are quoted defensively: squad names
 * and judge feedback can contain commas, quotes and newlines.
 */

function cell(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(columns, rows) {
  const head = columns.map((c) => cell(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => cell(c.get(r))).join(','));
  return [head, ...body].join('\r\n');
}

export function downloadCsv(filename, csv) {
  // BOM so Excel opens UTF-8 (squad names, ₹, em dashes) correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const stamp = () => new Date().toISOString().slice(0, 10);

export const EXPORTS = {
  users: ({ profiles }) => ({
    filename: `clonefest-users-${stamp()}.csv`,
    csv: toCsv([
      { label: 'Callsign', get: (p) => p.full_name },
      { label: 'USN', get: (p) => p.usn },
      { label: 'College', get: (p) => p.college },
      { label: 'Branch', get: (p) => p.branch },
      { label: 'Batch', get: (p) => p.batch },
      { label: 'Role', get: (p) => p.role },
      { label: 'Squad', get: (p) => p.team_name },
      { label: 'Registered', get: (p) => p.created_at },
    ], profiles),
  }),

  submissions: ({ submissions }) => ({
    filename: `clonefest-submissions-${stamp()}.csv`,
    csv: toCsv([
      { label: 'Squad', get: (s) => s.team_name },
      { label: 'Track', get: (s) => s.track_id },
      { label: 'PR URL', get: (s) => s.pr_url },
      { label: 'Status', get: (s) => s.status },
      { label: 'Notes', get: (s) => s.notes },
      { label: 'Submitted', get: (s) => s.created_at },
    ], submissions),
  }),

  squads: ({ squads }) => ({
    filename: `clonefest-squads-${stamp()}.csv`,
    csv: toCsv([
      { label: 'Squad', get: (q) => q.name },
      { label: 'Lead', get: (q) => q.lead },
      { label: 'Members', get: (q) => q.members },
      { label: 'Invite code', get: (q) => q.invite },
      { label: 'Tracks', get: (q) => q.tracks.join(' ') },
      { label: 'Submissions', get: (q) => q.total },
      { label: 'Cleared', get: (q) => q.cleared },
      { label: 'Pending', get: (q) => q.pending },
      { label: 'Rejected', get: (q) => q.rejected },
      { label: 'Registered', get: (q) => q.registered },
    ], squads),
  }),

  leaderboard: ({ ranked }) => ({
    filename: `clonefest-leaderboard-${stamp()}.csv`,
    csv: toCsv([
      { label: 'Rank', get: (r) => r.place },
      { label: 'Squad', get: (r) => r.name },
      { label: 'Members', get: (r) => r.members },
      { label: 'Cleared', get: (r) => r.cleared },
      { label: 'Pending', get: (r) => r.pending },
      { label: 'Total submissions', get: (r) => r.total },
      { label: 'Last activity', get: (r) => r.lastAt },
    ], ranked),
  }),
};
