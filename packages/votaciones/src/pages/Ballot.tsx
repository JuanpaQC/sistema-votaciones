import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CONFIRM_CODE } from "../lib/mock";
import CandidateCard from "../components/ballot/CandidateCard";
import Modal from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import CodeInput from "../components/verify/CodeInput";
import { getUserStatus, postVote, getCandidates, type Candidate } from "../lib/api";

type SessionShape = {
  email?: string;
  password?: string;
  accessCode?: string;
  sessionToken?: string;
  expiresAt?: string;
  role?: "voter" | "admin";
  hasVoted?: boolean;
  remember?: boolean;
};

export default function Ballot() {
  const { electionId } = useParams();
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [userHasVoted, setUserHasVoted] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<SessionShape | null>(null);

  // Cargar candidatos desde la API
  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const candidatesData = await getCandidates();
        setCandidates(candidatesData);
      } catch (error) {
        console.error('Error cargando candidatos:', error);
        setError('Error al cargar los candidatos');
      } finally {
        setLoadingCandidates(false);
      }
    };
    
    loadCandidates();
  }, []);

  // Cargar sesión + estado de voto al montar
  useEffect(() => {
    const raw = localStorage.getItem("session") || sessionStorage.getItem("session");
    let sess: SessionShape | null = null;
    try {
      sess = raw ? JSON.parse(raw) : null;
    } catch {
      sess = null;
    }
    setSession(sess);

    // Si no hay sesión -> impedir votar (userHasVoted = null)
    if (!sess?.email) {
      setUserHasVoted(null);
      return;
    }

    // Consultar si ya votó (anónimo)
    const email = sess.email!;
    const password = sess.password || "123456"; // 👈 solo para pruebas locales
    getUserStatus(email, password)
      .then((s) => setUserHasVoted(!!s.hasVoted))
      .catch(() => setUserHasVoted(false));
  }, [electionId]);

  const onConfirm = () => {
    if (!selectedId) return;

    // Bloquear si ya votó
    if (userHasVoted) {
      setError("Ya has emitido tu voto en esta elección.");
      setOpen(true);
      setDone(false);
      return;
    }

    // Validar sesión antes de abrir modal
    if (!session?.email) {
      setError("Debes iniciar sesión para votar. Serás redirigido al login.");
      setOpen(true);
      setDone(false);
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        const loginUrl = import.meta.env.VITE_LOGIN_BASE ?? "http://localhost:5174";
        window.location.replace(loginUrl);
      }, 2000);
      return;
    }

    setOpen(true);
    setCode("");
    setError(null);
    setDone(false);
  };

  const onVerify = async () => {
    // Verificación de código (demo)
    if (code.trim() !== CONFIRM_CODE) {
      setError("Código incorrecto. Inténtalo de nuevo.");
      return;
    }
    if (!selectedId || !session?.email) return;

    try {
      setSubmitting(true);
      setError(null);

      const email = session.email!;
      const password = session.password || "123456";
      const accessCode = session.accessCode;
      const sessionToken = session.sessionToken;

      // Registrar voto (anónimo) en backend con seguridad mejorada
      const voteData = {
        email,
        password,
        candidateId: selectedId,
        ...(accessCode && { accessCode }),
        ...(sessionToken && { sessionToken })
      };
      
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(voteData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar el voto');
      }
      
      const result = await response.json();

      // Marcar UI como votado
      setUserHasVoted(true);
      setDone(true);

      // Actualizar session.hasVoted en el storage
      const updated = { ...session, hasVoted: true };
      setSession(updated);
      if (session.remember) localStorage.setItem("session", JSON.stringify(updated));
      else sessionStorage.setItem("session", JSON.stringify(updated));
      
      console.log('Voto registrado:', result);
    } catch (e: any) {
      setError(e?.message ?? "Error al registrar el voto");
      setDone(false);
    } finally {
      setSubmitting(false);
    }
  };

  const selected = candidates.find((c) => c.id === selectedId) || null;

  // Mostrar loading mientras cargan los candidatos
  if (loadingCandidates) {
    return (
      <div className="min-h-screen bg-white px-4 md:px-8 py-10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando candidatos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-3 sm:px-4 md:px-8 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-screen-xl">
        <header className="mb-6 sm:mb-8 text-center px-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            Votación General
          </h1>
          <p className="text-sm text-gray-500 mt-2 px-4">
            Selecciona tu candidato y confirma tu voto.
          </p>
          {session?.email && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4 mx-2">
              <p className="text-sm text-green-700">
                ✓ Conectado como: <span className="font-medium">{session.email}</span>
              </p>
            </div>
          )}
          {!session?.email && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4 mx-2">
              <p className="text-sm text-red-700">
                ⚠️ No hay sesión activa. Por favor, inicia sesión primero.
              </p>
            </div>
          )}
        </header>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <section className="w-full">
          {/* Container centrado para las cards */}
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-center">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center">
                {candidates.map((c) => {
                  const isSelected = selectedId === c.id;
                  return (
                    <CandidateCard
                      key={c.id}
                      name={c.name}
                      party={c.party}
                      photo={c.photo}
                      description={c.description}
                      selected={isSelected}
                      onClick={() => setSelectedId(c.id)}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {candidates.length === 0 && (
            <div className="text-center py-12 px-4">
              <p className="text-gray-500 text-lg">No hay candidatos disponibles en este momento.</p>
            </div>
          )}

          {/* Indicador de selección centrado */}
          {selectedId && (
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-300 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-lg">✓</span>
                  </div>
                  <span className="font-semibold text-xl text-indigo-800">Candidato Seleccionado</span>
                </div>
                <div className="text-center">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
                    <h3 className="font-bold text-2xl text-indigo-900 mb-1">
                      {selected?.name}
                    </h3>
                    {selected?.party && (
                      <p className="text-indigo-700 font-medium text-lg">
                        {selected.party}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botón centrado */}
          <div className="mt-8 flex justify-center">
            <Button
              onClick={onConfirm}
              disabled={!selectedId || candidates.length === 0}
              className="px-12 py-4 rounded-xl text-lg font-medium min-h-[56px] touch-manipulation"
              title={
                userHasVoted
                  ? "Ya registraste tu voto"
                  : !session?.email
                    ? "Debes iniciar sesión"
                    : !selectedId
                      ? "Selecciona un candidato"
                      : undefined
              }
            >
              <span className="text-xl">
                {userHasVoted ? "✓ Ya votaste" : "🗳️ Confirmar voto"}
              </span>
            </Button>
          </div>
        </section>
      </div>

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={done ? "✅ Voto registrado" : "Código de verificación"}
        footer={
          done ? (
            <div className="flex justify-center sm:justify-end">
              <Button 
                onClick={() => setOpen(false)}
                className="w-full sm:w-auto min-h-[48px] touch-manipulation"
              >
                ✓ Listo
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end">
              <Button 
                variant="ghost" 
                onClick={() => setOpen(false)} 
                disabled={submitting}
                className="w-full sm:w-auto min-h-[48px] touch-manipulation order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={onVerify} 
                disabled={submitting}
                className="w-full sm:w-auto min-h-[48px] touch-manipulation order-1 sm:order-2"
              >
                {submitting ? "Registrando..." : "🔍 Verificar"}
              </Button>
            </div>
          )
        }
      >
        {done ? (
          <div className="text-center sm:text-left">
            <div className="flex justify-center sm:justify-start items-center gap-3 mb-4">
              <div className="flex h-12 w-12 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-green-500 text-white text-lg sm:text-base">
                ✓
              </div>
              <div className="hidden sm:block">
                <p className="font-medium text-gray-800 text-lg">
                  Voto registrado con éxito
                </p>
              </div>
            </div>
            <div className="sm:ml-11">
              <p className="font-medium text-gray-800 text-lg sm:text-base mb-2">
                Tu voto por{" "}
                <span className="font-bold text-indigo-600">{selected?.name}</span>
                {selected?.party && (
                  <span className="block sm:inline text-base sm:text-sm text-gray-600 mt-1 sm:mt-0">
                    {" "}- {selected.party}
                  </span>
                )}
                {" "}ha sido registrado.
              </p>
              <p className="text-sm text-gray-500">
                🎉 Gracias por participar en la votación.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center sm:text-left mb-4">
              <p className="text-sm sm:text-base text-gray-600 mb-3">
                Ingresa el código de verificación:
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800 text-center">
                  <span className="font-medium">Código de demo:</span>{" "}
                  <span className="font-mono bg-yellow-200 px-2 py-1 rounded text-lg">
                    {CONFIRM_CODE}
                  </span>
                </p>
              </div>
            </div>
            <CodeInput value={code} onChange={setCode} />
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
