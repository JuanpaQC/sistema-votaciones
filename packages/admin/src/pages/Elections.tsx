import { useEffect, useState } from 'react';
import { Plus, Calendar, Clock, Users, BarChart3, Play, Square, Eye, Settings, CheckCircle, AlertCircle, XCircle, Trash2 } from 'lucide-react';

interface Election {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    status: 'draft' | 'active' | 'closed' | 'published';
    settings: {
        requireAccessCode: boolean;
        allowPublicResults: boolean;
        autoPublishResults: boolean;
        resultPublishDelay: number;
    };
    createdAt: string;
    createdBy: string;
    resultsPublishedAt?: string;
}

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
}

export default function Elections() {
    const [elections, setElections] = useState<Election[]>([]);
    const [publishedResults, setPublishedResults] = useState<PublishedResults[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('elections');
    const [selectedElection, setSelectedElection] = useState<Election | null>(null);
    const [selectedResults, setSelectedResults] = useState<PublishedResults | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        requireAccessCode: false,
        allowPublicResults: true,
        autoPublishResults: true,
        resultPublishDelay: 0
    });

    const loadElections = async () => {
        try {
            const response = await fetch('/api/elections');
            if (!response.ok) throw new Error('Error al cargar elecciones');
            const data = await response.json();
            setElections(data.elections || []);
        } catch (error) {
            console.error('Error cargando elecciones:', error);
            setError('Error al cargar las elecciones');
        }
    };

    const loadPublishedResults = async () => {
        try {
            const response = await fetch('/api/results/published');
            if (!response.ok) throw new Error('Error al cargar resultados');
            const data = await response.json();
            setPublishedResults(data.results || []);
        } catch (error) {
            console.error('Error cargando resultados:', error);
            setError('Error al cargar los resultados publicados');
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([loadElections(), loadPublishedResults()]);
            setLoading(false);
        };
        loadData();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'draft': return <Settings size={16} className="text-gray-400" />;
            case 'active': return <Play size={16} className="text-green-400" />;
            case 'closed': return <Square size={16} className="text-red-400" />;
            case 'published': return <CheckCircle size={16} className="text-blue-400" />;
            default: return <AlertCircle size={16} className="text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-600/20 text-gray-400 border-gray-600';
            case 'active': return 'bg-green-600/20 text-green-400 border-green-600';
            case 'closed': return 'bg-red-600/20 text-red-400 border-red-600';
            case 'published': return 'bg-blue-600/20 text-blue-400 border-blue-600';
            default: return 'bg-gray-600/20 text-gray-400 border-gray-600';
        }
    };

    const handlePublishResults = async (electionId: string) => {
        if (!confirm('¿Estás seguro de que quieres publicar los resultados de esta elección?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/elections/${electionId}/publish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ publishedBy: 'admin' })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al publicar resultados');
            }

            const data = await response.json();
            setSuccess('Resultados publicados exitosamente');
            await loadElections();
            await loadPublishedResults();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Error al publicar resultados');
        }
    };

    const handleStatusChange = async (electionId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/admin/elections/${electionId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al actualizar estado');
            }

            setSuccess(`Estado de elección actualizado a ${newStatus}`);
            await loadElections();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Error al actualizar estado');
        }
    };

    const handleDeleteElection = async (electionId: string, electionName: string) => {
        if (!confirm(`¿Estás seguro de que quieres eliminar permanentemente la elección "${electionName}"?\n\nEsta acción no se puede deshacer y eliminará todos los datos relacionados.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/elections/${electionId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar elección');
            }

            setSuccess('Elección eliminada exitosamente');
            await loadElections();
            await loadPublishedResults();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Error al eliminar elección');
        }
    };

    const handleCreateElection = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name || !formData.startDate || !formData.endDate) {
            setError('Nombre, fecha de inicio y fecha de fin son obligatorios');
            return;
        }

        // Confirmar que crear nueva elección resetea el sistema
        if (!confirm('Al crear una nueva elección se reiniciará el sistema electoral:\n\n- Los votos de todos los candidatos se pondrán en 0\n- Todos los votantes se marcarán como "no han votado"\n- Se limpiará el historial de votos\n\n¿Continuar?')) {
            return;
        }

        try {
            const response = await fetch('/api/admin/elections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    settings: {
                        requireAccessCode: formData.requireAccessCode,
                        allowPublicResults: formData.allowPublicResults,
                        autoPublishResults: formData.autoPublishResults,
                        resultPublishDelay: formData.resultPublishDelay
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear elección');
            }

            const data = await response.json();
            setSuccess('Elección creada exitosamente. Sistema electoral reiniciado para nueva temporada.');
            setShowCreateForm(false);
            setFormData({
                name: '',
                description: '',
                startDate: '',
                endDate: '',
                requireAccessCode: false,
                allowPublicResults: true,
                autoPublishResults: true,
                resultPublishDelay: 0
            });
            await loadElections();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Error al crear elección');
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-white">Gestión de Elecciones</h1>
                <div className="animate-pulse space-y-4">
                    <div className="bg-neutral-700 h-20 rounded-lg"></div>
                    <div className="bg-neutral-700 h-20 rounded-lg"></div>
                    <div className="bg-neutral-700 h-20 rounded-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Gestión de Elecciones</h1>
                <div className="flex items-center gap-4">
                    <div className="text-gray-400">
                        Elecciones: <span className="text-white font-bold">{elections.length}</span>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        Nueva Elección
                    </button>
                </div>
            </div>

            {/* Mensajes de estado */}
            {error && (
                <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded-lg">
                    {error}
                    <button onClick={() => setError('')} className="ml-4 underline">Cerrar</button>
                </div>
            )}

            {success && (
                <div className="bg-green-600/20 border border-green-600 text-green-400 px-4 py-3 rounded-lg">
                    {success}
                    <button onClick={() => setSuccess('')} className="ml-4 underline">Cerrar</button>
                </div>
            )}

            {/* Pestañas */}
            <div className="border-b border-neutral-700">
                <nav className="flex space-x-8">
                    {[
                        { id: 'elections', name: 'Elecciones Activas', icon: Calendar },
                        { id: 'results', name: 'Resultados Publicados', icon: BarChart3 },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-500'
                                        : 'border-transparent text-gray-400 hover:text-gray-300'
                                }`}
                            >
                                <Icon size={16} />
                                {tab.name}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Contenido de Elecciones */}
            {activeTab === 'elections' && (
                <div className="space-y-6">
                    {/* Estadísticas de elecciones */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gray-600 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-white">
                                <Settings size={20} />
                                <div>
                                    <div className="text-sm">Borrador</div>
                                    <div className="text-2xl font-bold">{elections.filter(e => e.status === 'draft').length}</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-green-600 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-white">
                                <Play size={20} />
                                <div>
                                    <div className="text-sm">Activas</div>
                                    <div className="text-2xl font-bold">{elections.filter(e => e.status === 'active').length}</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-red-600 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-white">
                                <Square size={20} />
                                <div>
                                    <div className="text-sm">Cerradas</div>
                                    <div className="text-2xl font-bold">{elections.filter(e => e.status === 'closed').length}</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-blue-600 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-white">
                                <CheckCircle size={20} />
                                <div>
                                    <div className="text-sm">Publicadas</div>
                                    <div className="text-2xl font-bold">{elections.filter(e => e.status === 'published').length}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lista de elecciones */}
                    <div className="bg-neutral-800 rounded-lg overflow-hidden">
                        <div className="p-6 border-b border-neutral-700">
                            <h2 className="text-xl font-semibold text-white">Elecciones Registradas</h2>
                        </div>
                        <div className="divide-y divide-neutral-700">
                            {elections.map((election) => (
                                <div key={election.id} className="p-6 hover:bg-neutral-700/50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(election.status)}`}>
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(election.status)}
                                                        {election.status.toUpperCase()}
                                                    </div>
                                                </span>
                                                <h3 className="text-white font-semibold text-lg">{election.name}</h3>
                                            </div>
                                            
                                            {election.description && (
                                                <p className="text-gray-300 mb-3">{election.description}</p>
                                            )}
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} />
                                                    <span>Inicio: {new Date(election.startDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} />
                                                    <span>Fin: {new Date(election.endDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users size={14} />
                                                    <span>Creado por: {election.createdBy}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Settings size={14} />
                                                    <span>Auto-publicar: {election.settings.autoPublishResults ? 'Sí' : 'No'}</span>
                                                </div>
                                            </div>

                                            {election.resultsPublishedAt && (
                                                <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3 mb-3">
                                                    <div className="flex items-center gap-2 text-blue-400 text-sm">
                                                        <CheckCircle size={14} />
                                                        <span>Resultados publicados el {new Date(election.resultsPublishedAt).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedElection(election)}
                                                className="text-blue-400 hover:text-blue-300 text-sm px-3 py-2 rounded border border-blue-400/30 hover:border-blue-400/50 transition-colors flex items-center gap-1"
                                            >
                                                <Eye size={14} />
                                                Ver Detalles
                                            </button>
                                            
                                            {election.status === 'closed' && (
                                                <>
                                                    <button
                                                        onClick={() => handlePublishResults(election.id)}
                                                        className="text-green-400 hover:text-green-300 text-sm px-3 py-2 rounded border border-green-400/30 hover:border-green-400/50 transition-colors flex items-center gap-1"
                                                    >
                                                        <CheckCircle size={14} />
                                                        Publicar Resultados
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteElection(election.id, election.name)}
                                                        className="text-red-400 hover:text-red-300 text-sm px-3 py-2 rounded border border-red-400/30 hover:border-red-400/50 transition-colors flex items-center gap-1"
                                                    >
                                                        <Trash2 size={14} />
                                                        Eliminar
                                                    </button>
                                                </>
                                            )}
                                            
                                            {election.status === 'published' && (
                                                <button
                                                    onClick={() => handleDeleteElection(election.id, election.name)}
                                                    className="text-red-400 hover:text-red-300 text-sm px-3 py-2 rounded border border-red-400/30 hover:border-red-400/50 transition-colors flex items-center gap-1"
                                                >
                                                    <Trash2 size={14} />
                                                    Eliminar
                                                </button>
                                            )}
                                            
                                            {election.status === 'draft' && (
                                                <button
                                                    onClick={() => handleStatusChange(election.id, 'active')}
                                                    className="text-green-400 hover:text-green-300 text-sm px-3 py-2 rounded border border-green-400/30 hover:border-green-400/50 transition-colors flex items-center gap-1"
                                                >
                                                    <Play size={14} />
                                                    Activar
                                                </button>
                                            )}
                                            
                                            {election.status === 'active' && (
                                                <button
                                                    onClick={() => handleStatusChange(election.id, 'closed')}
                                                    className="text-red-400 hover:text-red-300 text-sm px-3 py-2 rounded border border-red-400/30 hover:border-red-400/50 transition-colors flex items-center gap-1"
                                                >
                                                    <Square size={14} />
                                                    Cerrar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {elections.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                <Calendar size={48} className="mx-auto mb-4 text-gray-600" />
                                <p className="text-lg mb-2">No hay elecciones registradas</p>
                                <p className="text-sm">Las elecciones se crearán automáticamente o se pueden gestionar desde la API.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Contenido de Resultados Publicados */}
            {activeTab === 'results' && (
                <div className="space-y-6">
                    <div className="bg-neutral-800 rounded-lg overflow-hidden">
                        <div className="p-6 border-b border-neutral-700">
                            <h2 className="text-xl font-semibold text-white">Resultados Oficiales Publicados</h2>
                        </div>
                        <div className="divide-y divide-neutral-700">
                            {publishedResults.map((result) => (
                                <div key={result.id} className="p-6 hover:bg-neutral-700/50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <h3 className="text-white font-semibold text-lg">{result.electionName}</h3>
                                                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-green-600/20 text-green-400 border border-green-600">
                                                    {result.status === 'final' ? 'RESULTADOS OFICIALES' : 'PRELIMINAR'}
                                                </span>
                                            </div>
                                            
                                            {/* Estadísticas principales */}
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm">
                                                <div className="bg-blue-900/20 p-3 rounded-lg">
                                                    <div className="text-blue-400 font-medium">{result.statistics.totalVotes}</div>
                                                    <div className="text-gray-400">Votos Totales</div>
                                                </div>
                                                <div className="bg-green-900/20 p-3 rounded-lg">
                                                    <div className="text-green-400 font-medium">{result.statistics.participationRate}%</div>
                                                    <div className="text-gray-400">Participación</div>
                                                </div>
                                                <div className="bg-purple-900/20 p-3 rounded-lg">
                                                    <div className="text-purple-400 font-medium">{result.statistics.totalEligibleVoters}</div>
                                                    <div className="text-gray-400">Habilitados</div>
                                                </div>
                                                <div className="bg-yellow-900/20 p-3 rounded-lg">
                                                    <div className="text-yellow-400 font-medium">{result.statistics.abstentions}</div>
                                                    <div className="text-gray-400">Abstenciones</div>
                                                </div>
                                                <div className="bg-gray-900/20 p-3 rounded-lg">
                                                    <div className="text-gray-400 font-medium">{result.candidates.length}</div>
                                                    <div className="text-gray-400">Candidatos</div>
                                                </div>
                                            </div>
                                            
                                            {/* Top 3 candidatos */}
                                            <div className="mb-3">
                                                <h4 className="text-white font-medium mb-2">Primeros 3 lugares:</h4>
                                                <div className="space-y-2">
                                                    {result.candidates.slice(0, 3).map((candidate, index) => (
                                                        <div key={candidate.id} className="flex items-center gap-3">
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                                index === 0 ? 'bg-yellow-500 text-black' :
                                                                index === 1 ? 'bg-gray-400 text-black' :
                                                                'bg-orange-600 text-white'
                                                            }`}>
                                                                {index + 1}
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="text-white font-medium">{candidate.name}</span>
                                                                <span className="text-gray-400 text-sm ml-2">({candidate.party})</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-white font-bold">{candidate.votes}</div>
                                                                <div className="text-gray-400 text-sm">{candidate.percentage}%</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div className="text-sm text-gray-500">
                                                Publicado el {new Date(result.publishedAt).toLocaleString()} por {result.publishedBy}
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedResults(result)}
                                                className="text-blue-400 hover:text-blue-300 text-sm px-3 py-2 rounded border border-blue-400/30 hover:border-blue-400/50 transition-colors flex items-center gap-1"
                                            >
                                                <BarChart3 size={14} />
                                                Ver Resultados Completos
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {publishedResults.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                <BarChart3 size={48} className="mx-auto mb-4 text-gray-600" />
                                <p className="text-lg mb-2">No hay resultados publicados</p>
                                <p className="text-sm">Los resultados aparecerán aquí una vez que se publiquen las elecciones.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de detalles de elección */}
            {selectedElection && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-neutral-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white">Detalles de la Elección</h2>
                            <button
                                onClick={() => setSelectedElection(null)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">{selectedElection.name}</h3>
                                <p className="text-gray-300">{selectedElection.description}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="text-gray-400">Estado</label>
                                    <div className="text-white font-medium">{selectedElection.status}</div>
                                </div>
                                <div>
                                    <label className="text-gray-400">Creado por</label>
                                    <div className="text-white font-medium">{selectedElection.createdBy}</div>
                                </div>
                                <div>
                                    <label className="text-gray-400">Fecha de inicio</label>
                                    <div className="text-white font-medium">{new Date(selectedElection.startDate).toLocaleString()}</div>
                                </div>
                                <div>
                                    <label className="text-gray-400">Fecha de fin</label>
                                    <div className="text-white font-medium">{new Date(selectedElection.endDate).toLocaleString()}</div>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-white font-medium mb-2">Configuración</h4>
                                <div className="bg-neutral-700 p-4 rounded-lg">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Requiere código de acceso:</span>
                                            <span className="text-white">{selectedElection.settings.requireAccessCode ? 'Sí' : 'No'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Resultados públicos:</span>
                                            <span className="text-white">{selectedElection.settings.allowPublicResults ? 'Sí' : 'No'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Auto-publicar resultados:</span>
                                            <span className="text-white">{selectedElection.settings.autoPublishResults ? 'Sí' : 'No'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Retraso de publicación:</span>
                                            <span className="text-white">{selectedElection.settings.resultPublishDelay} minutos</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-neutral-700 flex justify-end">
                            <button
                                onClick={() => setSelectedElection(null)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de resultados completos */}
            {selectedResults && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-neutral-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white">Resultados Oficiales</h2>
                            <button
                                onClick={() => setSelectedResults(null)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">{selectedResults.electionName}</h3>
                            
                            {/* Todos los candidatos */}
                            <div className="space-y-3">
                                {selectedResults.candidates.map((candidate, index) => (
                                    <div key={candidate.id} className="bg-neutral-700 p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">{candidate.name}</div>
                                                    <div className="text-gray-400 text-sm">{candidate.party}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-white">{candidate.votes}</div>
                                                <div className="text-gray-400">{candidate.percentage}%</div>
                                            </div>
                                        </div>
                                        <div className="w-full bg-neutral-600 rounded-full h-2">
                                            <div 
                                                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${candidate.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-6 text-sm text-gray-400">
                                <p>Publicado el {new Date(selectedResults.publishedAt).toLocaleString()}</p>
                                <p>Hash de integridad: {selectedResults.metadata?.dataIntegrityHash}</p>
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-neutral-700 flex justify-end">
                            <button
                                onClick={() => setSelectedResults(null)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal de creación de nueva elección */}
            {showCreateForm && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-neutral-800 rounded-lg max-w-2xl w-full">
                        <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white">Crear Nueva Elección</h2>
                            <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleCreateElection} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Nombre</label>
                                <input 
                                    className="w-full bg-neutral-700 text-white px-3 py-2 rounded"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Descripción</label>
                                <textarea 
                                    className="w-full bg-neutral-700 text-white px-3 py-2 rounded"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Fecha inicio</label>
                                    <input 
                                        type="datetime-local"
                                        className="w-full bg-neutral-700 text-white px-3 py-2 rounded"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Fecha fin</label>
                                    <input 
                                        type="datetime-local"
                                        className="w-full bg-neutral-700 text-white px-3 py-2 rounded"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="flex items-center gap-2 text-gray-300">
                                    <input 
                                        type="checkbox"
                                        checked={formData.requireAccessCode}
                                        onChange={e => setFormData({ ...formData, requireAccessCode: e.target.checked })}
                                        className="accent-blue-600"
                                    />
                                    Requerir código de acceso
                                </label>
                                <label className="flex items-center gap-2 text-gray-300">
                                    <input 
                                        type="checkbox"
                                        checked={formData.allowPublicResults}
                                        onChange={e => setFormData({ ...formData, allowPublicResults: e.target.checked })}
                                        className="accent-blue-600"
                                    />
                                    Resultados públicos
                                </label>
                                <label className="flex items-center gap-2 text-gray-300">
                                    <input 
                                        type="checkbox"
                                        checked={formData.autoPublishResults}
                                        onChange={e => setFormData({ ...formData, autoPublishResults: e.target.checked })}
                                        className="accent-blue-600"
                                    />
                                    Auto-publicar resultados
                                </label>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Retraso de publicación (min)</label>
                                    <input 
                                        type="number"
                                        min={0}
                                        className="w-full bg-neutral-700 text-white px-3 py-2 rounded"
                                        value={formData.resultPublishDelay}
                                        onChange={e => setFormData({ ...formData, resultPublishDelay: parseInt(e.target.value || '0', 10) })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-gray-400 hover:text-white">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
                                    Crear Elección
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
