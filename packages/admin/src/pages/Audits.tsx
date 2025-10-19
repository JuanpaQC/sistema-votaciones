import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Info, X, Download, Search, Eye, Clock, User } from 'lucide-react';

interface AuditLog {
    id: string;
    timestamp: string;
    type: 'LOGIN' | 'VOTE' | 'ADMIN_ACTION' | 'SECURITY_EVENT';
    actor: string;
    message: string;
    metadata: {
        ip?: string;
        sessionId?: string;
        role?: string;
        reason?: string;
        voteId?: string;
        [key: string]: any;
    };
}

export default function Audits() {
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingLog, setViewingLog] = useState<AuditLog | null>(null);
    const [error, setError] = useState('');

    const loadAuditLogs = async () => {
        try {
            const response = await fetch('/api/admin/audit-logs?limit=200');
            if (!response.ok) {
                throw new Error('Error al cargar los logs de auditoría');
            }
            const data = await response.json();
            setAuditLogs(data.logs || []);
        } catch (error) {
            console.error('Error cargando audit logs:', error);
            setError('Error al cargar los registros de auditoría');
            // Fallback a datos mock para demo
            const mockLogs: AuditLog[] = [
                {
                    id: '1',
                    timestamp: new Date().toISOString(),
                    type: 'LOGIN',
                    actor: 'admin@demo.com',
                    message: 'Successful login',
                    metadata: { ip: '192.168.1.100', role: 'admin', sessionId: 'sess_123' }
                },
                {
                    id: '2',
                    timestamp: new Date(Date.now() - 60000).toISOString(),
                    type: 'VOTE',
                    actor: 'voter@demo.com',
                    message: 'Vote cast successfully',
                    metadata: { ip: '192.168.1.101', voteId: 'vote_456' }
                },
                {
                    id: '3',
                    timestamp: new Date(Date.now() - 120000).toISOString(),
                    type: 'SECURITY_EVENT',
                    actor: 'unknown@test.com',
                    message: 'Failed login attempt',
                    metadata: { ip: '192.168.1.102', reason: 'invalid_credentials' }
                },
                {
                    id: '4',
                    timestamp: new Date(Date.now() - 180000).toISOString(),
                    type: 'ADMIN_ACTION',
                    actor: 'admin@demo.com',
                    message: 'Created 5 new voters',
                    metadata: { votersCreated: 5, totalAttempts: 5 }
                }
            ];
            setAuditLogs(mockLogs);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAuditLogs();
    }, []);

    const filteredLogs = auditLogs.filter(log => {
        let matchesFilter = true;
        if (filter !== 'all') {
            matchesFilter = log.type === filter;
        }
        
        let matchesSearch = true;
        if (searchTerm) {
            matchesSearch = log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (log.metadata.ip && log.metadata.ip.includes(searchTerm));
        }
        
        return matchesFilter && matchesSearch;
    });

    const getLogIcon = (type: string) => {
        switch (type) {
            case 'LOGIN': return <User size={16} />;
            case 'VOTE': return <Shield size={16} />;
            case 'ADMIN_ACTION': return <Info size={16} />;
            case 'SECURITY_EVENT': return <AlertTriangle size={16} />;
            default: return <Info size={16} />;
        }
    };

    const getLogColor = (type: string) => {
        switch (type) {
            case 'LOGIN': return 'bg-blue-900/20 border-blue-500 text-blue-400';
            case 'VOTE': return 'bg-green-900/20 border-green-500 text-green-400';
            case 'ADMIN_ACTION': return 'bg-purple-900/20 border-purple-500 text-purple-400';
            case 'SECURITY_EVENT': return 'bg-red-900/20 border-red-500 text-red-400';
            default: return 'bg-gray-900/20 border-gray-500 text-gray-400';
        }
    };

    const exportLogs = () => {
        const csvContent = [
            'Timestamp,Type,Actor,Message,IP,Metadata',
            ...filteredLogs.map(log => [
                log.timestamp,
                log.type,
                log.actor,
                log.message.replace(/,/g, ';'),
                log.metadata.ip || '',
                JSON.stringify(log.metadata).replace(/,/g, ';')
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold text-white">Auditoría y Seguridad</h1>
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
                <h1 className="text-3xl font-bold text-white">Auditoría y Seguridad</h1>
                <div className="flex items-center gap-4">
                    <div className="text-gray-400">
                        Eventos: <span className="text-white font-bold">{auditLogs.length}</span>
                    </div>
                    <button
                        onClick={exportLogs}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Download size={18} />
                        Exportar
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-yellow-600/20 border border-yellow-600 text-yellow-400 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertTriangle size={18} />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-600 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-white">
                        <User size={20} />
                        <div>
                            <div className="text-sm">Inicios de sesión</div>
                            <div className="text-2xl font-bold">{auditLogs.filter(l => l.type === 'LOGIN').length}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-green-600 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-white">
                        <Shield size={20} />
                        <div>
                            <div className="text-sm">Votos emitidos</div>
                            <div className="text-2xl font-bold">{auditLogs.filter(l => l.type === 'VOTE').length}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-purple-600 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-white">
                        <Info size={20} />
                        <div>
                            <div className="text-sm">Acciones admin</div>
                            <div className="text-2xl font-bold">{auditLogs.filter(l => l.type === 'ADMIN_ACTION').length}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-red-600 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-white">
                        <AlertTriangle size={20} />
                        <div>
                            <div className="text-sm">Eventos seguridad</div>
                            <div className="text-2xl font-bold">{auditLogs.filter(l => l.type === 'SECURITY_EVENT').length}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Búsqueda y Filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por usuario, mensaje o IP..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-neutral-700 text-white border border-neutral-600 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    {[
                        { key: 'all', label: 'Todos', count: auditLogs.length },
                        { key: 'LOGIN', label: 'Login', count: auditLogs.filter(l => l.type === 'LOGIN').length },
                        { key: 'VOTE', label: 'Votos', count: auditLogs.filter(l => l.type === 'VOTE').length },
                        { key: 'ADMIN_ACTION', label: 'Admin', count: auditLogs.filter(l => l.type === 'ADMIN_ACTION').length },
                        { key: 'SECURITY_EVENT', label: 'Seguridad', count: auditLogs.filter(l => l.type === 'SECURITY_EVENT').length },
                    ].map(({ key, label, count }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                                filter === key 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-neutral-700 text-gray-300 hover:bg-neutral-600'
                            }`}
                        >
                            {label} ({count})
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista de logs */}
            <div className="bg-neutral-800 rounded-lg overflow-hidden">
                <div className="p-6 border-b border-neutral-700">
                    <h2 className="text-xl font-semibold text-white">
                        Registros de Auditoría {filter !== 'all' && `- ${filter}`}
                    </h2>
                </div>
                <div className="divide-y divide-neutral-700">
                    {filteredLogs.map((log) => (
                        <div key={log.id} className="p-6 hover:bg-neutral-700/50 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-medium border-l-4 ${getLogColor(log.type)}`}>
                                            <div className="flex items-center gap-2">
                                                {getLogIcon(log.type)}
                                                {log.type}
                                            </div>
                                        </span>
                                        <span className="text-white font-medium">{log.actor}</span>
                                        {log.metadata.ip && (
                                            <span className="text-gray-500 text-sm font-mono">{log.metadata.ip}</span>
                                        )}
                                    </div>
                                    <p className="text-gray-300 mb-2">{log.message}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {new Date(log.timestamp).toLocaleString()}
                                        </div>
                                        {Object.keys(log.metadata).length > 1 && (
                                            <button
                                                onClick={() => setViewingLog(log)}
                                                className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                            >
                                                <Eye size={14} />
                                                Ver detalles
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {filteredLogs.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <Shield size={48} className="mx-auto mb-4 text-gray-600" />
                        <p className="text-lg mb-2">No hay registros que mostrar</p>
                        <p className="text-sm">No se encontraron eventos que coincidan con los filtros actuales.</p>
                    </div>
                )}
            </div>

            {/* Modal de detalles */}
            {viewingLog && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-neutral-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white">Detalles del Evento</h2>
                            <button
                                onClick={() => setViewingLog(null)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400">Tipo</label>
                                    <div className="text-white font-medium">{viewingLog.type}</div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400">Actor</label>
                                    <div className="text-white font-medium">{viewingLog.actor}</div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-sm text-gray-400">Mensaje</label>
                                <div className="text-white">{viewingLog.message}</div>
                            </div>
                            
                            <div>
                                <label className="text-sm text-gray-400">Timestamp</label>
                                <div className="text-white font-mono">{new Date(viewingLog.timestamp).toLocaleString()}</div>
                            </div>
                            
                            <div>
                                <label className="text-sm text-gray-400">Metadatos</label>
                                <div className="bg-neutral-700 p-4 rounded-lg">
                                    <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-auto">
                                        {JSON.stringify(viewingLog.metadata, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-neutral-700 flex justify-end">
                            <button
                                onClick={() => setViewingLog(null)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}