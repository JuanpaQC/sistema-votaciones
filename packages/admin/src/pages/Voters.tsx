import { useEffect, useState, useRef } from 'react';
import { getVoters, createVoters, bulkUploadVoters, type VoterInfo, type NewVoter, type VoterCredentials } from '../lib/api';
import { Upload, Download, Key, Users, UserCheck, UserX, FileText, Plus, X, Search } from 'lucide-react';

// Las interfaces NewVoter y VoterCredentials ahora se importan de api.ts

export default function Voters() {
    const [voters, setVoters] = useState<VoterInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'voted' | 'pending'>('all');
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [showAddVoter, setShowAddVoter] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newVoter, setNewVoter] = useState<NewVoter>({
      email: '',
      name: '',
      documentId: '',
      isEligible: true,
      district: '',
      phone: ''
    });
    const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
    const [uploadPreview, setUploadPreview] = useState<NewVoter[]>([]);
    const [generatedCredentials, setGeneratedCredentials] = useState<VoterCredentials[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Las credenciales ahora se generan de forma segura en el backend
    
    // Procesar archivo CSV
    const handleFileUpload = async (file: File) => {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const requiredHeaders = ['email', 'name', 'documentid'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
            throw new Error(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
        }
        
        const voters: NewVoter[] = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const voter: NewVoter = {
                email: values[headers.indexOf('email')] || '',
                name: values[headers.indexOf('name')] || '',
                documentId: values[headers.indexOf('documentid')] || '',
                isEligible: values[headers.indexOf('eligible')] !== 'false',
                district: values[headers.indexOf('district')] || '',
                phone: values[headers.indexOf('phone')] || ''
            };
            
            if (voter.email && voter.name && voter.documentId) {
                voters.push(voter);
            }
        }
        
        return voters;
    };
    
    // Manejar subida de archivo
    const handleBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setBulkUploadFile(file);
        setError('');
        
        try {
            const voters = await handleFileUpload(file);
            setUploadPreview(voters);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Error procesando archivo');
        }
    };
    
    // Procesar carga masiva
    const processBulkUpload = async () => {
        if (uploadPreview.length === 0) return;
        
        try {
            setError('');
            
            // Enviar al backend usando la API
            const response = await bulkUploadVoters(uploadPreview);
            
            // Usar las credenciales del backend
            setGeneratedCredentials(response.credentials);
            
            const successCount = response.results.filter(r => r.success).length;
            const errorCount = response.results.filter(r => !r.success).length;
            
            if (errorCount > 0) {
                setError(`${errorCount} votantes no pudieron ser creados. Revisa los datos.`);
            }
            
            setSuccess(`${successCount} votantes han sido creados exitosamente`);
            setShowBulkUpload(false);
            setBulkUploadFile(null);
            setUploadPreview([]);
            setShowCredentials(true);
            
            // Recargar la lista de votantes
            const data = await getVoters();
            setVoters(data);
            
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Error procesando la carga masiva');
        }
    };
    
    // Agregar votante individual
    const handleAddVoter = async () => {
        if (!newVoter.email || !newVoter.name || !newVoter.documentId) {
            setError('Por favor completa todos los campos requeridos');
            return;
        }
        
        try {
            setError('');
            
            // Enviar al backend usando la API
            const response = await createVoters([newVoter]);
            
            if (response.results[0]?.success) {
                // Usar las credenciales del backend
                setGeneratedCredentials(response.credentials);
                setSuccess('Votante agregado exitosamente');
                
                // Recargar la lista de votantes
                const data = await getVoters();
                setVoters(data);
                
                setShowCredentials(true);
            } else {
                setError(response.results[0]?.error || 'Error creando el votante');
            }
            
            setNewVoter({
                email: '',
                name: '',
                documentId: '',
                isEligible: true,
                district: '',
                phone: ''
            });
            setShowAddVoter(false);
            
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Error agregando el votante');
        }
    };
    
    // Descargar credenciales
    const downloadCredentials = () => {
        const csvContent = 'Email,Password,Access Code\n' + 
            generatedCredentials.map(c => `${c.email},${c.password},${c.accessCode}`).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'voter-credentials.csv';
        link.click();
        window.URL.revokeObjectURL(url);
    };
    
    useEffect(() => {
        const loadVoters = async () => {
            try {
                const data = await getVoters();
                setVoters(data);
            } catch (error) {
                console.error('Error cargando votantes:', error);
            } finally {
                setLoading(false);
            }
        };

        loadVoters();
    }, []);

    if (loading) {
        return (
            <div className="space-y-4">
                <h1 className="text-xl font-semibold text-white">Votantes</h1>
                <div className="animate-pulse space-y-4">
                    <div className="bg-gray-700 h-16 rounded-lg"></div>
                    <div className="bg-gray-700 h-16 rounded-lg"></div>
                    <div className="bg-gray-700 h-16 rounded-lg"></div>
                </div>
            </div>
        );
    }

    // Filtrar solo votantes (excluir admins)
    const votersOnly = voters.filter(v => v.role === 'voter');
    const votedCount = votersOnly.filter(v => v.hasVoted).length;
    const pendingCount = votersOnly.filter(v => !v.hasVoted).length;

    // Aplicar filtros de estado y búsqueda
    const filteredVoters = votersOnly.filter(voter => {
        let matchesFilter = true;
        if (filter === 'voted') matchesFilter = voter.hasVoted;
        if (filter === 'pending') matchesFilter = !voter.hasVoted;
        
        let matchesSearch = true;
        if (searchTerm) {
            matchesSearch = voter.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          voter.id.toLowerCase().includes(searchTerm.toLowerCase());
        }
        
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Header con acciones */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Gestión del Padrón Electoral</h1>
                <div className="flex items-center gap-4">
                    <div className="text-gray-400">
                        Total: <span className="text-white font-bold">{votersOnly.length}</span> votantes
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowBulkUpload(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Upload size={18} />
                            Carga Masiva
                        </button>
                        <button
                            onClick={() => setShowAddVoter(true)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Agregar Votante
                        </button>
                        {generatedCredentials.length > 0 && (
                            <button
                                onClick={() => setShowCredentials(true)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Key size={18} />
                                Ver Credenciales
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mensajes de estado */}
            {error && (
                <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
                    <UserX size={18} />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto">
                        <X size={16} />
                    </button>
                </div>
            )}
            
            {success && (
                <div className="bg-green-600/20 border border-green-600 text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
                    <UserCheck size={18} />
                    {success}
                    <button onClick={() => setSuccess('')} className="ml-auto">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Estadísticas rápidas */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-600 p-4 rounded-lg">
                    <div className="text-white text-lg">Han votado</div>
                    <div className="text-white text-3xl font-bold">{votedCount}</div>
                </div>
                <div className="bg-yellow-600 p-4 rounded-lg">
                    <div className="text-white text-lg">Pendientes</div>
                    <div className="text-white text-3xl font-bold">{pendingCount}</div>
                </div>
                <div className="bg-blue-600 p-4 rounded-lg">
                    <div className="text-white text-lg">Participación</div>
                    <div className="text-white text-3xl font-bold">
                        {votersOnly.length > 0 ? Math.round((votedCount / votersOnly.length) * 100) : 0}%
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
                            placeholder="Buscar por email o ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-neutral-700 text-white border border-neutral-600 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                            filter === 'all' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-neutral-700 text-gray-300 hover:bg-neutral-600'
                        }`}
                    >
                        <Users size={16} />
                        Todos ({votersOnly.length})
                    </button>
                    <button
                        onClick={() => setFilter('voted')}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                            filter === 'voted' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-neutral-700 text-gray-300 hover:bg-neutral-600'
                        }`}
                    >
                        <UserCheck size={16} />
                        Han votado ({votedCount})
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                            filter === 'pending' 
                            ? 'bg-yellow-600 text-white' 
                            : 'bg-neutral-700 text-gray-300 hover:bg-neutral-600'
                        }`}
                    >
                        <UserX size={16} />
                        Pendientes ({pendingCount})
                    </button>
                </div>
            </div>

            {/* Lista de votantes */}
            <div className="bg-neutral-800 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-white mb-4">
                    Lista de Votantes - {filter === 'all' ? 'Todos' : filter === 'voted' ? 'Han votado' : 'Pendientes'}
                </h2>
                <div className="space-y-3">
                    {filteredVoters.map((voter) => (
                        <div key={voter.id} className={`flex items-center justify-between p-4 rounded-lg ${
                            voter.hasVoted 
                            ? 'bg-green-900/20 border border-green-700/30'
                            : 'bg-yellow-900/20 border border-yellow-700/30'
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                    voter.hasVoted ? 'bg-green-400' : 'bg-yellow-400'
                                }`}></div>
                                <div>
                                    <div className="text-white font-medium">{voter.email}</div>
                                    <div className="text-gray-400 text-sm">ID: {voter.id}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-sm font-medium ${
                                    voter.hasVoted ? 'text-green-400' : 'text-yellow-400'
                                }`}>
                                    {voter.hasVoted ? '✓ Votó' : '⏳ Pendiente'}
                                </div>
                                <div className="text-gray-500 text-xs">Rol: {voter.role}</div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {filteredVoters.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        <p>No hay votantes en esta categoría.</p>
                    </div>
                )}
            </div>

            {/* Usuarios admin (solo para referencia) */}
            {voters.some(v => v.role === 'admin') && (
                <div className="bg-neutral-800 p-6 rounded-lg">
                    <h2 className="text-lg font-semibold text-white mb-4">Administradores</h2>
                    <div className="space-y-3">
                        {voters.filter(v => v.role === 'admin').map((admin) => (
                            <div key={admin.id} className="flex items-center justify-between p-4 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                                    <div>
                                        <div className="text-white font-medium">{admin.email}</div>
                                        <div className="text-gray-400 text-sm">ID: {admin.id}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-purple-400">
                                        🛡️ Admin
                                    </div>
                                    <div className="text-gray-500 text-xs">
                                        {admin.hasVoted ? 'Ha votado' : 'Sin votar'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal de Carga Masiva */}
            {showBulkUpload && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-neutral-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white">Carga Masiva de Votantes</h2>
                            <button
                                onClick={() => {
                                    setShowBulkUpload(false);
                                    setBulkUploadFile(null);
                                    setUploadPreview([]);
                                    setError('');
                                }}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Instrucciones */}
                            <div className="bg-blue-600/20 border border-blue-600 text-blue-400 p-4 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <FileText size={20} className="mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-semibold mb-2">Formato del archivo CSV</h3>
                                        <p className="text-sm mb-2">El archivo debe contener las siguientes columnas (obligatorias):</p>
                                        <code className="bg-blue-900/30 px-2 py-1 rounded text-xs">
                                            email, name, documentId, eligible, district, phone
                                        </code>
                                        <p className="text-xs mt-2 text-blue-300">
                                            Solo email, name y documentId son obligatorios. eligible debe ser true/false.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Subida de archivo */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Seleccionar archivo CSV
                                </label>
                                <div className="border-2 border-dashed border-neutral-600 rounded-lg p-8 text-center">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv"
                                        onChange={handleBulkFileChange}
                                        className="hidden"
                                    />
                                    <Upload size={48} className="mx-auto mb-4 text-gray-600" />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-blue-400 hover:text-blue-300 font-medium"
                                    >
                                        Hacer clic para seleccionar archivo
                                    </button>
                                    {bulkUploadFile && (
                                        <p className="mt-2 text-green-400 text-sm">
                                            ✓ {bulkUploadFile.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            {/* Preview de votantes */}
                            {uploadPreview.length > 0 && (
                                <div>
                                    <h3 className="text-white font-semibold mb-3">
                                        Previsualización ({uploadPreview.length} votantes)
                                    </h3>
                                    <div className="max-h-40 overflow-y-auto bg-neutral-700 rounded-lg">
                                        {uploadPreview.slice(0, 10).map((voter, index) => (
                                            <div key={index} className="p-3 border-b border-neutral-600 last:border-b-0">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <span className="text-white text-sm">{voter.name}</span>
                                                        <span className="text-gray-400 text-xs ml-2">({voter.email})</span>
                                                    </div>
                                                    <div className={`text-xs px-2 py-1 rounded ${
                                                        voter.isEligible ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                                                    }`}>
                                                        {voter.isEligible ? 'Elegible' : 'No elegible'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {uploadPreview.length > 10 && (
                                            <div className="p-3 text-center text-gray-400 text-sm">
                                                ... y {uploadPreview.length - 10} votantes más
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-6 border-t border-neutral-700 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowBulkUpload(false);
                                    setBulkUploadFile(null);
                                    setUploadPreview([]);
                                    setError('');
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={processBulkUpload}
                                disabled={uploadPreview.length === 0}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                Procesar {uploadPreview.length} Votantes
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal Agregar Votante Individual */}
            {showAddVoter && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-neutral-800 rounded-lg max-w-md w-full">
                        <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white">Agregar Votante</h2>
                            <button
                                onClick={() => {
                                    setShowAddVoter(false);
                                    setError('');
                                    setNewVoter({
                                        email: '',
                                        name: '',
                                        documentId: '',
                                        isEligible: true,
                                        district: '',
                                        phone: ''
                                    });
                                }}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">Email *</label>
                                <input
                                    type="email"
                                    value={newVoter.email}
                                    onChange={(e) => setNewVoter(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full bg-neutral-700 text-white border border-neutral-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                    placeholder="votante@ejemplo.com"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">Nombre Completo *</label>
                                <input
                                    type="text"
                                    value={newVoter.name}
                                    onChange={(e) => setNewVoter(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-neutral-700 text-white border border-neutral-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                    placeholder="Nombre completo del votante"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">Documento de Identidad *</label>
                                <input
                                    type="text"
                                    value={newVoter.documentId}
                                    onChange={(e) => setNewVoter(prev => ({ ...prev, documentId: e.target.value }))}
                                    className="w-full bg-neutral-700 text-white border border-neutral-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                    placeholder="Número de documento"
                                    required
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">Distrito</label>
                                    <input
                                        type="text"
                                        value={newVoter.district}
                                        onChange={(e) => setNewVoter(prev => ({ ...prev, district: e.target.value }))}
                                        className="w-full bg-neutral-700 text-white border border-neutral-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                        placeholder="Distrito electoral"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">Teléfono</label>
                                    <input
                                        type="tel"
                                        value={newVoter.phone}
                                        onChange={(e) => setNewVoter(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full bg-neutral-700 text-white border border-neutral-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                        placeholder="Número de teléfono"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="eligible"
                                    checked={newVoter.isEligible}
                                    onChange={(e) => setNewVoter(prev => ({ ...prev, isEligible: e.target.checked }))}
                                    className="rounded border-neutral-600 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="eligible" className="text-gray-300 text-sm">
                                    El votante está al día con sus obligaciones (elegible para votar)
                                </label>
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-neutral-700 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowAddVoter(false);
                                    setError('');
                                    setNewVoter({
                                        email: '',
                                        name: '',
                                        documentId: '',
                                        isEligible: true,
                                        district: '',
                                        phone: ''
                                    });
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddVoter}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                Agregar Votante
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal de Credenciales */}
            {showCredentials && generatedCredentials.length > 0 && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-neutral-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white">Credenciales Generadas</h2>
                            <button
                                onClick={() => setShowCredentials(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="mb-4 p-4 bg-yellow-600/20 border border-yellow-600 text-yellow-400 rounded-lg">
                                <p className="text-sm">
                                    <strong>⚠️ Importante:</strong> Guarda estas credenciales de forma segura. 
                                    Se mostrarán solo una vez por motivos de seguridad.
                                </p>
                            </div>
                            
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {generatedCredentials.map((cred, index) => (
                                    <div key={index} className="bg-neutral-700 p-4 rounded-lg">
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-400">Email:</span>
                                                <div className="text-white font-medium">{cred.email}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Contraseña:</span>
                                                <div className="text-green-400 font-mono">{cred.password}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Código de Acceso:</span>
                                                <div className="text-blue-400 font-mono">{cred.accessCode}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-neutral-700 flex justify-end gap-3">
                            <button
                                onClick={() => setShowCredentials(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={downloadCredentials}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Download size={18} />
                                Descargar CSV
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
