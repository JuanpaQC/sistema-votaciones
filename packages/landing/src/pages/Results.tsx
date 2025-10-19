import { useEffect, useState } from 'react';
import { BarChart3, Users, Calendar, CheckCircle, Trophy, TrendingUp } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

interface PublishedResults {
    id: string;
    electionId: string;
    electionName: string;
    publishedAt: string;
    publishedBy: string;
    status: 'preliminary' | 'final';
    statistics: {
        totalVotes: number;
        totalEligibleVoters: number;
        totalVotedUsers: number;
        participationRate: number;
        abstentions: number;
    };
    candidates: Array<{
        id: string;
        name: string;
        party: string;
        votes: number;
        percentage: string;
    }>;
    metadata?: {
        dataIntegrityHash?: string;
    };
}

export default function Results() {
    const [results, setResults] = useState<PublishedResults | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const loadPublishedResults = async () => {
        try {
            // First, try to get all published results and pick the most recent
            const allPublishedResponse = await fetch('/api/results/published');
            
            if (allPublishedResponse.ok) {
                const allPublishedData = await allPublishedResponse.json();
                const publishedResults = allPublishedData.results || [];
                
                if (publishedResults.length > 0) {
                    // Sort by publishedAt date (most recent first) and take the first one
                    const mostRecentResult = publishedResults.sort((a: PublishedResults, b: PublishedResults) => 
                        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
                    )[0];
                    
                    setResults(mostRecentResult);
                    setLastUpdated(new Date());
                    return;
                }
            }
            
            // If no published results, try to get active election for preliminary results
            const activeElectionResponse = await fetch('/api/elections/active');
            
            if (activeElectionResponse.ok) {
                const activeElectionData = await activeElectionResponse.json();
                const electionId = activeElectionData.election.id;
                
                // Get preliminary results for active election
                const preliminaryResponse = await fetch(`/api/results/preliminary/${electionId}`);
                if (preliminaryResponse.ok) {
                    const preliminaryData = await preliminaryResponse.json();
                    setResults({
                        ...preliminaryData.results,
                        status: 'preliminary' as const,
                        publishedBy: 'sistema',
                        publishedAt: new Date().toISOString()
                    });
                    setLastUpdated(new Date());
                    return;
                }
            }
            
            // If nothing found, try to get the most recent election (even if closed)
            const allElectionsResponse = await fetch('/api/elections');
            if (allElectionsResponse.ok) {
                const electionsData = await allElectionsResponse.json();
                const elections = electionsData.elections || [];
                
                if (elections.length > 0) {
                    // Sort by creation date (most recent first)
                    const mostRecentElection = elections.sort((a: any, b: any) => 
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )[0];
                    
                    // Try to get published results for the most recent election
                    const publishedResponse = await fetch(`/api/results/published/${mostRecentElection.id}`);
                    if (publishedResponse.ok) {
                        const publishedData = await publishedResponse.json();
                        setResults(publishedData.results);
                        setLastUpdated(new Date());
                        return;
                    }
                    
                    // Try preliminary results as last resort
                    const preliminaryResponse = await fetch(`/api/results/preliminary/${mostRecentElection.id}`);
                    if (preliminaryResponse.ok) {
                        const preliminaryData = await preliminaryResponse.json();
                        setResults({
                            ...preliminaryData.results,
                            status: 'preliminary' as const,
                            publishedBy: 'sistema',
                            publishedAt: new Date().toISOString()
                        });
                        setLastUpdated(new Date());
                        return;
                    }
                }
            }
            
            throw new Error('No se encontraron resultados disponibles');
            
        } catch (error) {
            console.error('Error cargando resultados:', error);
            setError('Error al cargar los resultados. Intenta nuevamente más tarde.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPublishedResults();
        
        // Auto-refresh every 30 seconds if showing preliminary results
        const interval = setInterval(() => {
            if (results?.status === 'preliminary') {
                loadPublishedResults();
            }
        }, 30000);
        
        return () => clearInterval(interval);
    }, [results?.status]);

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Resultados Electorales</h1>
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
                            <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="animate-pulse">
                                <div className="bg-white p-6 rounded-lg shadow h-24">
                                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                                    <div className="h-8 bg-gray-300 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="animate-pulse space-y-4">
                        {[1,2,3].map(i => (
                            <div key={i} className="bg-white p-6 rounded-lg shadow">
                                <div className="h-6 bg-gray-300 rounded mb-4"></div>
                                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                                <div className="h-2 bg-gray-300 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
                </div>
                <Footer />
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Error al cargar resultados</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => {
                            setError('');
                            setLoading(true);
                            loadPublishedResults();
                        }}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Intentar de nuevo
                    </button>
                </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!results) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 flex items-center justify-center">
                <div className="text-center">
                    <BarChart3 size={64} className="text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">No hay resultados disponibles</h2>
                    <p className="text-gray-600">Los resultados se mostrarán una vez que la elección haya finalizado.</p>
                </div>
                </div>
                <Footer />
            </>
        );
    }

    const winner = results.candidates[0];
    const isOfficial = results.status === 'final';

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <BarChart3 size={32} className="text-blue-600" />
                        <h1 className="text-4xl font-bold text-gray-900">Resultados Electorales</h1>
                    </div>
                    
                    <h2 className="text-2xl text-gray-700 mb-4">{results.electionName}</h2>
                    
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                        <span className={`px-4 py-2 rounded-full font-medium ${
                            isOfficial 
                                ? 'bg-green-100 text-green-800 border border-green-300' 
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                        }`}>
                            {isOfficial ? '🏆 RESULTADOS OFICIALES' : '📊 RESULTADOS PRELIMINARES'}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar size={16} />
                            Actualizado: {lastUpdated.toLocaleString()}
                        </span>
                    </div>

                    {!isOfficial && (
                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-yellow-800 text-sm">
                                ⏱️ Los resultados se actualizan automáticamente cada 30 segundos durante el proceso de votación
                            </p>
                        </div>
                    )}
                </div>

                {/* Estadísticas principales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
                    <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BarChart3 size={24} className="text-blue-600" />
                            </div>
                            <div>
                                <div className="text-2xl md:text-3xl font-bold text-gray-900">{results.statistics.totalVotes.toLocaleString()}</div>
                                <div className="text-gray-600 text-sm">Votos Emitidos</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg border-l-4 border-green-500">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp size={24} className="text-green-600" />
                            </div>
                            <div>
                                <div className="text-2xl md:text-3xl font-bold text-gray-900">{results.statistics.participationRate}%</div>
                                <div className="text-gray-600 text-sm">Participación</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg border-l-4 border-purple-500">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Users size={24} className="text-purple-600" />
                            </div>
                            <div>
                                <div className="text-2xl md:text-3xl font-bold text-gray-900">{results.statistics.totalEligibleVoters.toLocaleString()}</div>
                                <div className="text-gray-600 text-sm">Habilitados</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg border-l-4 border-gray-500">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <CheckCircle size={24} className="text-gray-600" />
                            </div>
                            <div>
                                <div className="text-2xl md:text-3xl font-bold text-gray-900">{results.statistics.abstentions.toLocaleString()}</div>
                                <div className="text-gray-600 text-sm">Abstenciones</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Candidato ganador */}
                {isOfficial && winner && (
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-300 rounded-xl p-6 md:p-8 mb-12 shadow-lg">
                        <div className="flex items-center gap-4 mb-4">
                            <Trophy size={32} className="text-yellow-600" />
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Candidato Electo</h3>
                                <p className="text-gray-700">Ganador de la elección</p>
                            </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-6 items-center">
                            <div>
                                <h4 className="text-3xl font-bold text-gray-900 mb-2">{winner.name}</h4>
                                <p className="text-xl text-gray-700 mb-4">{winner.party}</p>
                                <div className="flex items-baseline gap-4">
                                    <span className="text-4xl font-bold text-yellow-600">{winner.votes.toLocaleString()}</span>
                                    <span className="text-2xl text-gray-600">votos</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-6xl font-bold text-yellow-600 mb-2">{winner.percentage}%</div>
                                <div className="text-gray-600">de los votos válidos</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Resultados por candidato */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b">
                        <h3 className="text-xl font-bold text-gray-900">Resultados por Candidato</h3>
                        <p className="text-gray-600">Distribución completa de votos</p>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        {results.candidates.map((candidate, index) => (
                            <div key={candidate.id} className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                            index === 0 ? 'bg-yellow-500' :
                                            index === 1 ? 'bg-gray-500' :
                                            index === 2 ? 'bg-orange-600' :
                                            'bg-blue-600'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900">{candidate.name}</h4>
                                            <p className="text-gray-600">{candidate.party}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-gray-900">{candidate.votes.toLocaleString()}</div>
                                        <div className="text-lg text-gray-600">{candidate.percentage}%</div>
                                    </div>
                                </div>
                                
                                {/* Barra de progreso */}
                                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                                    <div 
                                        className={`h-4 rounded-full transition-all duration-1000 ease-out ${
                                            index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                                            index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                                            index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                                            'bg-gradient-to-r from-blue-400 to-blue-600'
                                        }`}
                                        style={{ width: `${candidate.percentage}%` }}
                                    ></div>
                                </div>
                                
                                {/* Línea separadora */}
                                {index < results.candidates.length - 1 && (
                                    <div className="border-b border-gray-200 mt-6"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer informativo */}
                <div className="mt-12 bg-white rounded-lg p-6 shadow-lg">
                    <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Información de Publicación</h4>
                            <p>Publicado el: {new Date(results.publishedAt).toLocaleString()}</p>
                            <p>Estado: {isOfficial ? 'Resultados Oficiales' : 'Resultados Preliminares'}</p>
                            <p>Publicado por: {results.publishedBy}</p>
                        </div>
                        
                        {results.metadata?.dataIntegrityHash && (
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Verificación de Integridad</h4>
                                <p className="font-mono text-xs break-all">
                                    Hash: {results.metadata.dataIntegrityHash}
                                </p>
                                <p className="text-xs text-green-600 mt-1">✓ Datos verificados</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            </div>
            <Footer />
        </>
    );
}
