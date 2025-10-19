#!/usr/bin/env node

// verify-system.js - Verificación rápida del sistema electoral
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = 'http://localhost:4000';

async function quickTest() {
    console.log('🔍 Verificando sistema electoral...\n');
    
    try {
        // 1. Health check
        console.log('1. Verificando servidor backend...');
        const health = await fetch(`${API_BASE}/api/health`);
        const healthData = await health.json();
        console.log(health.ok ? '✅ Backend funcionando' : '❌ Backend no responde');
        
        // 2. Candidatos
        console.log('2. Verificando candidatos...');
        const candidates = await fetch(`${API_BASE}/api/candidates`);
        const candidatesData = await candidates.json();
        console.log(candidates.ok ? `✅ ${candidatesData.candidates?.length || 0} candidatos encontrados` : '❌ Error obteniendo candidatos');
        
        // 3. Elecciones  
        console.log('3. Verificando elecciones...');
        const elections = await fetch(`${API_BASE}/api/elections`);
        const electionsData = await elections.json();
        console.log(elections.ok ? `✅ ${electionsData.elections?.length || 0} elecciones encontradas` : '❌ Error obteniendo elecciones');
        
        // 4. Usuarios
        console.log('4. Verificando usuarios...');
        const users = await fetch(`${API_BASE}/api/admin/users`);
        const usersData = await users.json();
        console.log(users.ok ? `✅ ${usersData.users?.length || 0} usuarios encontrados` : '❌ Error obteniendo usuarios');
        
        // 5. Estadísticas de auditoría
        console.log('5. Verificando auditoría...');
        const audit = await fetch(`${API_BASE}/api/admin/audit-logs/stats`);
        const auditData = await audit.json();
        console.log(audit.ok ? `✅ ${auditData.stats?.total || 0} eventos de auditoría` : '❌ Error obteniendo auditoría');
        
        console.log('\n🎉 Verificación básica completada!');
        
    } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('💡 Asegúrate de que el servidor backend esté ejecutándose en puerto 4000');
    }
}

quickTest();