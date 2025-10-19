import { useEffect, useState } from 'react';
import { getAdminStats, getCandidatesWithVotes, getVoters, type AdminStats, type CandidateWithVotes, type VoterInfo } from '../lib/api';

export default function Dashboard() {
    const [stats, setStats] = useState<AdminStats>({ totalVotes: 0, totalVoters: 0, participation: 0, candidatesCount: 0 });
    const [candidates, setCandidates] = useState<CandidateWithVotes[]>([]);
    const [voters, setVoters] = useState<VoterInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [statsData, candidatesData, votersData] = await Promise.all([
                    getAdminStats(),
                    getCandidatesWithVotes(),
                    getVoters()
                ]);
                setStats(statsData);
                setCandidates(candidatesData);
                setVoters(votersData);
            } catch (error) {
                console.error('Error cargando datos del dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-white">Dashboard Administrativo</h1>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gray-700 animate-pulse p-4 rounded-lg h-20"></div>
                    <div className="bg-gray-700 animate-pulse p-4 rounded-lg h-20"></div>
                    <div className="bg-gray-700 animate-pulse p-4 rounded-lg h-20"></div>
                </div>
            </div>
        );
    }

    const votedCount = voters.filter(v => v.role === 'voter' && v.hasVoted).length;
    const votersOnlyCount = voters.filter(v => v.role === 'voter').length;
    const participationPercent = votersOnlyCount > 0 ? Math.round((votedCount / votersOnlyCount) * 100) : 0;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Dashboard Administrativo</h1>
            
            {/* Estadísticas generales */}
            <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-blue-600 p-4 rounded-lg">
                    <div className="text-white text-lg">Total votos</div>
                    <div className="text-white text-3xl font-bold">{stats.totalVotes}</div>
                </div>
                <div className="bg-green-600 p-4 rounded-lg">
                    <div className="text-white text-lg">Participación</div>
                    <div className="text-white text-3xl font-bold">{participationPercent}%</div>
                </div>
                <div className="bg-purple-600 p-4 rounded-lg">
                    <div className="text-white text-lg">Candidatos</div>
                    <div className="text-white text-3xl font-bold">{stats.candidatesCount}</div>
                </div>
                <div className="bg-orange-600 p-4 rounded-lg">
                    <div className="text-white text-lg">Votantes</div>
                    <div className="text-white text-3xl font-bold">{votersOnlyCount}</div>
                </div>
            </div>

            {/* Resultados por candidato */}
            <div className="bg-neutral-800 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-white mb-4">Votos por Candidato</h2>
                <div className="space-y-4">
                    {candidates.map((candidate) => (
                        <div key={candidate.id} className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
                            <div>
                                <h3 className="text-white font-medium">{candidate.name}</h3>
                                <p className="text-gray-400 text-sm">ID: {candidate.id}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-white">{candidate.votes}</div>
                                <div className="text-gray-400 text-sm">
                                    {stats.totalVotes > 0 ? Math.round((candidate.votes / stats.totalVotes) * 100) : 0}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Estado de votantes */}
            <div className="bg-neutral-800 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-white mb-4">Estado de Votantes</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-green-400 font-medium mb-2">Han votado ({votedCount})</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {voters.filter(v => v.role === 'voter' && v.hasVoted).map((voter) => (
                                <div key={voter.id} className="text-sm text-gray-300 p-2 bg-green-900/20 rounded">
                                    {voter.email}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-yellow-400 font-medium mb-2">Pendientes ({votersOnlyCount - votedCount})</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {voters.filter(v => v.role === 'voter' && !v.hasVoted).map((voter) => (
                                <div key={voter.id} className="text-sm text-gray-300 p-2 bg-yellow-900/20 rounded">
                                    {voter.email}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <p className="text-gray-300">🎉 Panel administrativo conectado con la base de datos local</p>
        </div>
    );
}
