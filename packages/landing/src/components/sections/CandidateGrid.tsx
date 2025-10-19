import { useState, useEffect } from 'react'
import { Card, CardBody, CardMedia } from '../ui/Card'
import Badge from '../ui/Badge'

interface Candidate {
    id: string;
    name: string;
    party: string;
    position?: string;
    description?: string;
    trajectory?: string;
    profile?: string;
    projects?: string;
    photo?: string;
    votes?: number;
}

export default function CandidateGrid() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                const response = await fetch('http://localhost:4000/api/candidates');
                if (!response.ok) {
                    throw new Error('Error al cargar candidatos');
                }
                const data = await response.json();
                setCandidates(data.candidates || []);
            } catch (error) {
                console.error('Error cargando candidatos:', error);
                setError('Error al cargar los candidatos');
            } finally {
                setLoading(false);
            }
        };

        fetchCandidates();
    }, []);

    if (loading) {
        return (
            <section id="candidatos" className="max-w-6xl mx-auto px-4 py-10 md:py-14">
                <div className="flex items-end justify-between mb-6">
                    <h2 className="text-2xl md:text-3xl font-semibold">Candidatos</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardMedia>
                                <div className="h-40 w-full bg-gradient-to-br from-primary-500/25 to-white/5 animate-pulse" />
                            </CardMedia>
                            <CardBody>
                                <div className="space-y-2 animate-pulse">
                                    <div className="h-4 bg-slate-600 rounded w-3/4"></div>
                                    <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                                    <div className="h-3 bg-slate-700 rounded w-full"></div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section id="candidatos" className="max-w-6xl mx-auto px-4 py-10 md:py-14">
                <div className="flex items-end justify-between mb-6">
                    <h2 className="text-2xl md:text-3xl font-semibold">Candidatos</h2>
                </div>
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
                    <p className="text-red-400">{error}</p>
                    <p className="text-sm text-slate-400 mt-2">Asegúrate de que el servidor backend esté funcionando</p>
                </div>
            </section>
        );
    }

    return (
        <section id="candidatos" className="max-w-6xl mx-auto px-4 py-10 md:py-14">
            <div className="flex items-end justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-semibold">Candidatos</h2>
                <a href="/resultados" className="text-sm text-primary-400 hover:text-primary-300">Ver resultados →</a>
            </div>
            
            {candidates.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">🗳️</div>
                    <h3 className="text-xl font-semibold mb-2">No hay candidatos registrados</h3>
                    <p className="text-slate-400">Los candidatos aparecerán aquí una vez que sean registrados por el administrador.</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {candidates.map((candidate) => (
                        <Card key={candidate.id}>
                            <CardMedia>
                                {candidate.photo ? (
                                    <img 
                                        src={candidate.photo} 
                                        alt={candidate.name}
                                        className="h-40 w-full object-cover"
                                        onError={(e) => {
                                            // Fallback si la imagen no carga
                                            e.currentTarget.src = `https://via.placeholder.com/300x160/1e293b/64748b?text=${encodeURIComponent(candidate.name)}`;
                                        }}
                                    />
                                ) : (
                                    <div className="h-40 w-full bg-gradient-to-br from-primary-500/25 to-white/5 flex items-center justify-center">
                                        <div className="text-4xl">👤</div>
                                    </div>
                                )}
                            </CardMedia>
                            <CardBody>
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-lg font-semibold">{candidate.name}</h3>
                                        <div className="text-sm text-slate-300">
                                            {candidate.position || 'Candidato'} — {candidate.party}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Información expandida */}
                                <div className="space-y-2 text-sm">
                                    {candidate.profile && (
                                        <p className="text-slate-300">
                                            <span className="font-medium text-slate-200">Perfil:</span> {candidate.profile}
                                        </p>
                                    )}
                                    
                                    {candidate.trajectory && (
                                        <p className="text-slate-300">
                                            <span className="font-medium text-slate-200">Trayectoria:</span> {candidate.trajectory}
                                        </p>
                                    )}
                                    
                                    {candidate.projects && (
                                        <p className="text-slate-300">
                                            <span className="font-medium text-slate-200">Proyectos:</span> {candidate.projects}
                                        </p>
                                    )}
                                    
                                    {candidate.description && (
                                        <p className="text-slate-300">
                                            <span className="font-medium text-slate-200">Descripción:</span> {candidate.description}
                                        </p>
                                    )}
                                </div>
                                
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Badge>{candidate.party}</Badge>
                                    {candidate.position && <Badge>{candidate.position}</Badge>}
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}
        </section>
    )
}
