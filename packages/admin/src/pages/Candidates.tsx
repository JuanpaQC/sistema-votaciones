import { useEffect, useState } from 'react';
import { getCandidatesWithVotes, createCandidate, updateCandidate, deleteCandidate, type CandidateWithVotes, type CreateCandidateData } from '../lib/api';
import { Plus, X, Eye, Edit2, Trash2, User, Briefcase, Target, Phone, Globe, Twitter, Facebook, Instagram } from 'lucide-react';

interface CandidateFormData {
  name: string;
  photo: string;
  description: string;
  party: string;
  profile: {
    education: string[];
    experience: string[];
    achievements: string[];
  };
  trajectory: {
    positions: Array<{
      title: string;
      organization: string;
      period: string;
      description?: string;
    }>;
    politicalExperience: Array<{
      role: string;
      party: string;
      period: string;
      description?: string;
    }>;
  };
  projects: Array<{
    title: string;
    category: 'economic' | 'social' | 'infrastructure' | 'education' | 'health' | 'environment' | 'security' | 'other';
    description: string;
    objectives: string[];
    timeline?: string;
    budget?: string;
  }>;
  contactInfo: {
    website?: string;
    email?: string;
    phone?: string;
    socialMedia?: {
      twitter?: string;
      facebook?: string;
      instagram?: string;
    };
  };
}

export default function Candidates() {
    const [candidates, setCandidates] = useState<CandidateWithVotes[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');
    const [editingCandidate, setEditingCandidate] = useState<CandidateWithVotes | null>(null);
    const [viewingCandidate, setViewingCandidate] = useState<CandidateWithVotes | null>(null);
    const [formData, setFormData] = useState<CandidateFormData>({
      name: '',
      photo: '',
      description: '',
      party: '',
      profile: {
        education: [],
        experience: [],
        achievements: []
      },
      trajectory: {
        positions: [],
        politicalExperience: []
      },
      projects: [],
      contactInfo: {
        socialMedia: {}
      }
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const resetFormData = () => ({
      name: '',
      photo: '',
      description: '',
      party: '',
      profile: {
        education: [],
        experience: [],
        achievements: []
      },
      trajectory: {
        positions: [],
        politicalExperience: []
      },
      projects: [],
      contactInfo: {
        socialMedia: {}
      }
    });

    const loadCandidates = async () => {
      try {
        const data = await getCandidatesWithVotes();
        setCandidates(data);
      } catch (error) {
        console.error('Error cargando candidatos:', error);
        setError('Error al cargar los candidatos');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
        loadCandidates();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name.trim() || !formData.description.trim() || !formData.party.trim()) {
        setError('Por favor, completa todos los campos obligatorios');
        return;
      }

      setSubmitting(true);
      setError('');
      
      try {
        if (editingCandidate) {
          await updateCandidate(editingCandidate.id, formData);
        } else {
          await createCandidate(formData as CreateCandidateData);
        }
        
        // Reset form and reload candidates
        setFormData(resetFormData());
        setShowForm(false);
        setEditingCandidate(null);
        setActiveTab('basic');
        await loadCandidates();
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error al guardar el candidato');
      } finally {
        setSubmitting(false);
      }
    };

    const handleEdit = (candidate: CandidateWithVotes) => {
      setEditingCandidate(candidate);
      setFormData({
        name: candidate.name,
        photo: candidate.photo || '',
        description: candidate.description || '',
        party: candidate.party || '',
        profile: candidate.profile || { education: [], experience: [], achievements: [] },
        trajectory: candidate.trajectory || { positions: [], politicalExperience: [] },
        projects: candidate.projects || [],
        contactInfo: candidate.contactInfo || { socialMedia: {} }
      });
      setShowForm(true);
      setError('');
    };

    const handleDelete = async (id: string) => {
      if (!confirm('¿Estás seguro de que quieres eliminar este candidato?')) {
        return;
      }
      
      try {
        await deleteCandidate(id);
        await loadCandidates();
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error al eliminar el candidato');
      }
    };

    const resetForm = () => {
      setFormData(resetFormData());
      setShowForm(false);
      setEditingCandidate(null);
      setError('');
      setActiveTab('basic');
    };

    // Funciones helper para arrays dinámicos
    const addToArray = (field: string, subfield?: string) => {
      setFormData(prev => {
        const newData = { ...prev };
        if (subfield) {
          (newData as any)[field][subfield].push('');
        } else {
          (newData as any)[field].push(field === 'projects' ? {
            title: '',
            category: 'other' as const,
            description: '',
            objectives: ['']
          } : field === 'positions' ? {
            title: '',
            organization: '',
            period: ''
          } : {
            role: '',
            party: '',
            period: ''
          });
        }
        return newData;
      });
    };

    const removeFromArray = (field: string, index: number, subfield?: string) => {
      setFormData(prev => {
        const newData = { ...prev };
        if (subfield) {
          (newData as any)[field][subfield].splice(index, 1);
        } else {
          (newData as any)[field].splice(index, 1);
        }
        return newData;
      });
    };

    const updateArrayItem = (field: string, index: number, value: any, subfield?: string, itemField?: string) => {
      setFormData(prev => {
        const newData = { ...prev };
        if (subfield && itemField) {
          (newData as any)[field][subfield][index][itemField] = value;
        } else if (subfield) {
          (newData as any)[field][subfield][index] = value;
        } else {
          (newData as any)[field][index] = value;
        }
        return newData;
      });
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <h1 className="text-xl font-semibold text-white">Candidatos</h1>
                <div className="animate-pulse space-y-4">
                    <div className="bg-gray-700 h-20 rounded-lg"></div>
                    <div className="bg-gray-700 h-20 rounded-lg"></div>
                    <div className="bg-gray-700 h-20 rounded-lg"></div>
                </div>
            </div>
        );
    }

    const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Candidatos</h1>
                <div className="flex items-center gap-4">
                    <div className="text-gray-400">
                        Total: <span className="text-white font-bold">{candidates.length}</span>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        {showForm ? 'Cancelar' : 'Agregar Candidato'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Formulario */}
            {showForm && (
                <div className="bg-neutral-800 p-6 rounded-lg">
                    <h2 className="text-lg font-semibold text-white mb-4">
                        {editingCandidate ? 'Editar Candidato' : 'Nuevo Candidato'}
                    </h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-2">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full bg-neutral-700 text-white border border-neutral-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                placeholder="Nombre del candidato"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-2">
                                Partido *
                            </label>
                            <input
                                type="text"
                                value={formData.party}
                                onChange={(e) => setFormData(prev => ({ ...prev, party: e.target.value }))}
                                className="w-full bg-neutral-700 text-white border border-neutral-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                placeholder="Partido político"
                                required
                            />
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-gray-300 text-sm font-medium mb-2">
                                URL de la foto
                            </label>
                            <input
                                type="url"
                                value={formData.photo}
                                onChange={(e) => setFormData(prev => ({ ...prev, photo: e.target.value }))}
                                className="w-full bg-neutral-700 text-white border border-neutral-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                placeholder="https://ejemplo.com/foto.jpg"
                            />
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-gray-300 text-sm font-medium mb-2">
                                Descripción *
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full bg-neutral-700 text-white border border-neutral-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 h-24 resize-none"
                                placeholder="Descripción del candidato"
                                required
                            />
                        </div>
                        
                        <div className="md:col-span-2 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                {submitting ? 'Guardando...' : (editingCandidate ? 'Actualizar' : 'Crear')}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
            {/* Lista de candidatos */}
            <div className="bg-neutral-800 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-white mb-4">Candidatos Registrados</h2>
                <div className="grid gap-4">
                    {candidates.map((candidate, index) => {
                        const percentage = totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0;
                        return (
                            <div key={candidate.id} className="bg-neutral-700 p-4 rounded-lg">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-4">
                                        {candidate.photo && (
                                            <img 
                                                src={candidate.photo} 
                                                alt={candidate.name}
                                                className="w-16 h-16 object-cover rounded-lg"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-semibold">{candidate.name}</h3>
                                                    <p className="text-gray-400 text-sm">{candidate.party}</p>
                                                </div>
                                            </div>
                                            {candidate.description && (
                                                <p className="text-gray-300 text-sm mb-2">{candidate.description}</p>
                                            )}
                                            <p className="text-gray-500 text-xs">ID: {candidate.id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-white">{candidate.votes}</div>
                                            <div className="text-gray-400 text-sm">{percentage.toFixed(1)}%</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(candidate)}
                                                className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1 rounded border border-blue-400/30 hover:border-blue-400/50 transition-colors"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(candidate.id)}
                                                className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded border border-red-400/30 hover:border-red-400/50 transition-colors"
                                                disabled={candidate.votes > 0}
                                                title={candidate.votes > 0 ? 'No se puede eliminar un candidato con votos' : ''}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Barra de progreso */}
                                <div className="w-full bg-neutral-600 rounded-full h-2">
                                    <div 
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {candidates.length === 0 && !showForm && (
                <div className="text-center py-8 text-gray-400">
                    <p>No hay candidatos registrados en el sistema.</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Crear primer candidato
                    </button>
                </div>
            )}
        </div>
    );
}
