// src/lib/api.ts
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export interface Candidate {
  id: string;
  name: string;
  photo?: string;
  description?: string;
  party?: string;
  votes?: number;
}

export async function getCandidates(): Promise<Candidate[]> {
  const res = await fetch(`${API_BASE}/api/candidates`);
  if (!res.ok) throw new Error("No se pudieron cargar los candidatos");
  return (await res.json()).candidates;
}

export async function getResults() {
  const res = await fetch(`${API_BASE}/api/results`);
  if (!res.ok) throw new Error("No se pudieron cargar los resultados");
  return await res.json(); // { candidates, totalVotes }
}

export async function getUserStatus(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/status`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || "No se pudo verificar estado");
  }
  return await res.json(); // { hasVoted, role }
}

export async function postVote(email: string, password: string, candidateId: string) {
  const res = await fetch(`${API_BASE}/api/vote`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, candidateId }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || "Error al votar");
  return j;
}
