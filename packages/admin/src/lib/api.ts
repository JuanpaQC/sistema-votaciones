// API service para conectar con datos reales del servidor
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export interface AdminStats {
  totalVotes: number;
  totalVoters: number;
  participation: number;
  candidatesCount: number;
}

export interface CandidateWithVotes {
  id: string;
  name: string;
  photo?: string;
  description?: string;
  party?: string;
  position?: string;
  trajectory?: string;
  profile?: string;
  projects?: string;
  contactInfo?: string;
  votes: number;
}

export interface CreateCandidateData {
  name: string;
  photo?: string;
  description: string;
  party: string;
}

export interface VoterInfo {
  id: string;
  email: string;
  role: string;
  hasVoted: boolean;
}

export interface VoteRecord {
  id: string;
  candidateId: string;
  ts: string;
}

// Obtener estadísticas generales para admin
export async function getAdminStats(): Promise<AdminStats> {
  try {
    // Obtener votos y candidatos
    const [votesRes, candidatesRes] = await Promise.all([
      fetch(`${API_BASE}/api/admin/votes`),
      fetch(`${API_BASE}/api/candidates`)
    ]);

    if (!votesRes.ok || !candidatesRes.ok) {
      throw new Error("No se pudieron cargar las estadísticas");
    }

    const votesData = await votesRes.json();
    const candidatesData = await candidatesRes.json();

    const totalVotes = votesData.votes?.length || 0;
    const candidatesCount = candidatesData.candidates?.length || 0;
    
    // Calcular participación (necesitamos obtener total de usuarios)
    const usersRes = await fetch(`${API_BASE}/api/admin/users`);
    const totalVoters = usersRes.ok ? (await usersRes.json()).users?.filter((u: any) => u.role === 'voter').length || 0 : 0;
    
    const participation = totalVoters > 0 ? totalVotes / totalVoters : 0;

    return {
      totalVotes,
      totalVoters,
      participation,
      candidatesCount
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas admin:", error);
    return {
      totalVotes: 0,
      totalVoters: 0,
      participation: 0,
      candidatesCount: 0
    };
  }
}

// Obtener candidatos con sus votos
export async function getCandidatesWithVotes(): Promise<CandidateWithVotes[]> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/votes`);
    if (!res.ok) throw new Error("No se pudieron cargar los candidatos");
    
    const data = await res.json();
    return data.candidates || [];
  } catch (error) {
    console.error("Error obteniendo candidatos:", error);
    return [];
  }
}

// Obtener información de votantes (solo para admin)
export async function getVoters(): Promise<VoterInfo[]> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/users`);
    if (!res.ok) throw new Error("No se pudieron cargar los votantes");
    
    const data = await res.json();
    return data.users || [];
  } catch (error) {
    console.error("Error obteniendo votantes:", error);
    return [];
  }
}

// Obtener historial de votos (anónimo, solo timestamps y candidateIds)
export async function getVotesHistory(): Promise<VoteRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/votes`);
    if (!res.ok) throw new Error("No se pudo cargar el historial");
    
    const data = await res.json();
    return data.votes || [];
  } catch (error) {
    console.error("Error obteniendo historial:", error);
    return [];
  }
}

// Crear un nuevo candidato
export async function createCandidate(candidateData: CreateCandidateData): Promise<CandidateWithVotes> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/candidates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(candidateData)
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "No se pudo crear el candidato");
    }
    
    const data = await res.json();
    return data.candidate;
  } catch (error) {
    console.error("Error creando candidato:", error);
    throw error;
  }
}

// Actualizar un candidato existente
export async function updateCandidate(id: string, candidateData: Partial<CreateCandidateData>): Promise<CandidateWithVotes> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/candidates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(candidateData)
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "No se pudo actualizar el candidato");
    }
    
    const data = await res.json();
    return data.candidate;
  } catch (error) {
    console.error("Error actualizando candidato:", error);
    throw error;
  }
}

// Eliminar un candidato
export async function deleteCandidate(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/candidates/${id}`, {
      method: "DELETE"
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "No se pudo eliminar el candidato");
    }
  } catch (error) {
    console.error("Error eliminando candidato:", error);
    throw error;
  }
}

// Verificar si el usuario actual es admin
// Interfaces para votantes
export interface NewVoter {
  email: string;
  name: string;
  documentId: string;
  isEligible?: boolean;
  district?: string;
  phone?: string;
}

export interface VoterCredentials {
  email: string;
  password: string;
  accessCode: string;
}

export interface CreateVotersResponse {
  results: Array<{
    email: string;
    success: boolean;
    error?: string;
    id?: string;
  }>;
  credentials: VoterCredentials[];
}

// Crear votantes individuales o en lote
export async function createVoters(voters: NewVoter[]): Promise<CreateVotersResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/voters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voters })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "No se pudieron crear los votantes");
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error creando votantes:", error);
    throw error;
  }
}

// Crear carga masiva de votantes
export async function bulkUploadVoters(voters: NewVoter[]): Promise<CreateVotersResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/users/bulk-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voters })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "No se pudo completar la carga masiva");
    }
    
    const data = await res.json();
    // Adaptar la respuesta del bulk-upload al formato esperado
    return {
      results: data.results.created.map((cred: any) => ({
        email: cred.email,
        success: true,
        id: cred.row.toString()
      })).concat(data.results.errors.map((err: any) => ({
        email: err.email,
        success: false,
        error: err.error
      }))),
      credentials: data.results.created.map((cred: any) => ({
        email: cred.email,
        password: cred.password,
        accessCode: cred.accessCode
      }))
    };
  } catch (error) {
    console.error("Error en carga masiva:", error);
    throw error;
  }
}

export async function verifyAdminSession(): Promise<boolean> {
  try {
    const sessionData = localStorage.getItem("session") || sessionStorage.getItem("session");
    if (!sessionData) return false;
    
    const session = JSON.parse(sessionData);
    if (!session.email || !session.password) return false;
    
    // Verificar con el servidor
    const res = await fetch(`${API_BASE}/api/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: session.email, 
        password: session.password 
      })
    });
    
    if (!res.ok) return false;
    
    const data = await res.json();
    return data.role === "admin";
  } catch (error) {
    console.error("Error verificando sesión admin:", error);
    return false;
  }
}
