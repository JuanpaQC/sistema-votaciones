#!/usr/bin/env node

// test-system.js - Sistema completo de pruebas para el sistema electoral
// Este script verifica todos los 7 requerimientos del sistema

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const path = require('path');

// Configuración de pruebas
const API_BASE = 'http://localhost:4000';
const LANDING_URL = 'http://localhost:5177';
const ADMIN_URL = 'http://localhost:5173';
const LOGIN_URL = 'http://localhost:5174';
const VOTE_URL = 'http://localhost:5175';

// Colores para output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

// Función para logs con colores
function log(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

// Función para hacer request HTTP
async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        return { success: response.ok, status: response.status, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Estado global de las pruebas
let testResults = {
    requerimiento1: { passed: 0, failed: 0, tests: [] },
    requerimiento2: { passed: 0, failed: 0, tests: [] },
    requerimiento3: { passed: 0, failed: 0, tests: [] },
    requerimiento4: { passed: 0, failed: 0, tests: [] },
    requerimiento5: { passed: 0, failed: 0, tests: [] },
    requerimiento6: { passed: 0, failed: 0, tests: [] },
    requerimiento7: { passed: 0, failed: 0, tests: [] }
};

// Función para ejecutar un test
async function runTest(requerimiento, testName, testFunction) {
    try {
        log(`  ⏳ ${testName}`, 'yellow');
        const result = await testFunction();
        
        if (result.success) {
            testResults[requerimiento].passed++;
            testResults[requerimiento].tests.push({ name: testName, status: 'PASS', message: result.message });
            log(`  ✅ ${testName} - ${result.message}`, 'green');
        } else {
            testResults[requerimiento].failed++;
            testResults[requerimiento].tests.push({ name: testName, status: 'FAIL', message: result.message });
            log(`  ❌ ${testName} - ${result.message}`, 'red');
        }
    } catch (error) {
        testResults[requerimiento].failed++;
        testResults[requerimiento].tests.push({ name: testName, status: 'ERROR', message: error.message });
        log(`  💥 ${testName} - Error: ${error.message}`, 'red');
    }
}

// ============= REQUERIMIENTO 1: DISPONIBILIDAD MULTIPLATAFORMA =============
async function testRequerimiento1() {
    log('\n🖥️  REQUERIMIENTO 1: Disponibilidad Multiplataforma', 'blue');
    
    await runTest('requerimiento1', 'Landing page accesible', async () => {
        const response = await fetch(LANDING_URL);
        return {
            success: response.ok,
            message: response.ok ? 'Landing page carga correctamente' : `Error ${response.status}`
        };
    });
    
    await runTest('requerimiento1', 'Panel de administración accesible', async () => {
        const response = await fetch(ADMIN_URL);
        return {
            success: response.ok,
            message: response.ok ? 'Panel admin carga correctamente' : `Error ${response.status}`
        };
    });
    
    await runTest('requerimiento1', 'Sistema de login accesible', async () => {
        const response = await fetch(LOGIN_URL);
        return {
            success: response.ok,
            message: response.ok ? 'Sistema login carga correctamente' : `Error ${response.status}`
        };
    });
    
    await runTest('requerimiento1', 'Interfaz de votación accesible', async () => {
        const response = await fetch(VOTE_URL);
        return {
            success: response.ok,
            message: response.ok ? 'Interfaz votación carga correctamente' : `Error ${response.status}`
        };
    });
}

// ============= REQUERIMIENTO 2: GESTIÓN DE CANDIDATURAS =============
async function testRequerimiento2() {
    log('\n👥 REQUERIMIENTO 2: Gestión de Candidaturas', 'blue');
    
    await runTest('requerimiento2', 'API obtener candidatos', async () => {
        const result = await makeRequest(`${API_BASE}/api/candidates`);
        return {
            success: result.success,
            message: result.success ? `${result.data.candidates?.length || 0} candidatos encontrados` : result.error
        };
    });
    
    await runTest('requerimiento2', 'Crear candidato con campos extendidos', async () => {
        const candidateData = {
            name: 'Test Candidate',
            party: 'Test Party',
            position: 'Test Position',
            trajectory: 'Test trajectory information',
            profile: 'Test profile information',
            projects: 'Test project proposals',
            description: 'Test description'
        };
        
        const result = await makeRequest(`${API_BASE}/api/admin/candidates/extended`, {
            method: 'POST',
            body: JSON.stringify(candidateData)
        });
        
        return {
            success: result.success && result.data.candidate?.name === candidateData.name,
            message: result.success ? 'Candidato creado con todos los campos' : (result.data?.error || result.error)
        };
    });
    
    await runTest('requerimiento2', 'Campos de candidato disponibles para votantes', async () => {
        const result = await makeRequest(`${API_BASE}/api/candidates`);
        const hasExtendedFields = result.data.candidates?.some(c => 
            c.trajectory || c.profile || c.projects
        );
        
        return {
            success: result.success && hasExtendedFields,
            message: hasExtendedFields ? 'Candidatos tienen información completa para votantes' : 'Faltan campos extendidos en candidatos'
        };
    });
}

// ============= REQUERIMIENTO 3: GESTIÓN DE VOTANTES =============
async function testRequerimiento3() {
    log('\n📋 REQUERIMIENTO 3: Gestión de Votantes', 'blue');
    
    await runTest('requerimiento3', 'API obtener usuarios/votantes', async () => {
        const result = await makeRequest(`${API_BASE}/api/admin/users`);
        return {
            success: result.success,
            message: result.success ? `${result.data.users?.length || 0} usuarios encontrados` : result.error
        };
    });
    
    await runTest('requerimiento3', 'Crear votante individual', async () => {
        const voterData = {
            email: `test-voter-${Date.now()}@test.com`,
            role: 'voter',
            isEligible: true
        };
        
        const result = await makeRequest(`${API_BASE}/api/admin/users`, {
            method: 'POST',
            body: JSON.stringify(voterData)
        });
        
        return {
            success: result.success && result.data.credentials?.email === voterData.email,
            message: result.success ? 'Votante creado con credenciales seguras' : (result.data?.error || result.error)
        };
    });
    
    await runTest('requerimiento3', 'Carga masiva de votantes', async () => {
        const bulkVoters = [
            { email: `bulk1-${Date.now()}@test.com`, name: 'Bulk Voter 1', isEligible: true },
            { email: `bulk2-${Date.now()}@test.com`, name: 'Bulk Voter 2', isEligible: true }
        ];
        
        const result = await makeRequest(`${API_BASE}/api/admin/users/bulk-upload`, {
            method: 'POST',
            body: JSON.stringify({ voters: bulkVoters })
        });
        
        return {
            success: result.success && result.data.summary?.created === bulkVoters.length,
            message: result.success ? `${result.data.summary?.created || 0} votantes creados masivamente` : (result.data?.error || result.error)
        };
    });
    
    await runTest('requerimiento3', 'Verificación de elegibilidad', async () => {
        const result = await makeRequest(`${API_BASE}/api/admin/users/detailed`);
        const eligibleVoters = result.data.users?.filter(u => u.isEligible === true) || [];
        
        return {
            success: result.success && eligibleVoters.length > 0,
            message: result.success ? `${eligibleVoters.length} votantes elegibles encontrados` : result.error
        };
    });
}

// ============= REQUERIMIENTO 4: PROCESO DE VOTACIÓN Y SEGURIDAD =============
async function testRequerimiento4() {
    log('\n🔐 REQUERIMIENTO 4: Proceso de Votación y Seguridad', 'blue');
    
    await runTest('requerimiento4', 'Sistema de autenticación funcional', async () => {
        const loginData = {
            email: 'admin@test.com',
            password: 'test123'
        };
        
        const result = await makeRequest(`${API_BASE}/api/login`, {
            method: 'POST',
            body: JSON.stringify(loginData)
        });
        
        return {
            success: result.success || result.status === 401, // 401 es esperado si no existe el usuario
            message: result.success ? 'Sistema de autenticación funcional' : 'Sistema de autenticación rechaza credenciales inválidas (correcto)'
        };
    });
    
    await runTest('requerimiento4', 'Rate limiting implementado', async () => {
        // Intentar múltiples logins rápidos para activar rate limiting
        const promises = [];
        for (let i = 0; i < 6; i++) {
            promises.push(makeRequest(`${API_BASE}/api/login`, {
                method: 'POST',
                body: JSON.stringify({ email: 'test@test.com', password: 'wrong' })
            }));
        }
        
        const results = await Promise.all(promises);
        const rateLimited = results.some(r => r.status === 429);
        
        return {
            success: rateLimited,
            message: rateLimited ? 'Rate limiting activo para login' : 'Rate limiting no activado'
        };
    });
    
    await runTest('requerimiento4', 'API de votación protegida', async () => {
        const voteData = {
            email: 'test@test.com',
            password: 'wrong',
            candidateId: 'test-id'
        };
        
        const result = await makeRequest(`${API_BASE}/api/vote`, {
            method: 'POST',
            body: JSON.stringify(voteData)
        });
        
        return {
            success: !result.success, // Debe fallar con credenciales incorrectas
            message: result.success ? 'API de votación no está protegida' : 'API de votación rechaza credenciales inválidas (correcto)'
        };
    });
    
    await runTest('requerimiento4', 'Logs de auditoría generados', async () => {
        const result = await makeRequest(`${API_BASE}/api/admin/audit-logs/stats`);
        
        return {
            success: result.success && result.data.stats?.total > 0,
            message: result.success ? `${result.data.stats?.total || 0} eventos de auditoría registrados` : result.error
        };
    });
}

// ============= REQUERIMIENTO 5: PUBLICACIÓN Y AUDITORÍA =============
async function testRequerimiento5() {
    log('\n📊 REQUERIMIENTO 5: Publicación y Auditoría', 'blue');
    
    await runTest('requerimiento5', 'Sistema de elecciones funcional', async () => {
        const result = await makeRequest(`${API_BASE}/api/elections`);
        
        return {
            success: result.success,
            message: result.success ? `${result.data.elections?.length || 0} elecciones encontradas` : result.error
        };
    });
    
    await runTest('requerimiento5', 'Resultados preliminares disponibles', async () => {
        const electionsResult = await makeRequest(`${API_BASE}/api/elections`);
        if (!electionsResult.success || !electionsResult.data.elections?.length) {
            return { success: false, message: 'No hay elecciones para probar' };
        }
        
        const electionId = electionsResult.data.elections[0].id;
        const result = await makeRequest(`${API_BASE}/api/results/preliminary/${electionId}`);
        
        return {
            success: result.success,
            message: result.success ? 'Resultados preliminares generados correctamente' : (result.data?.error || result.error)
        };
    });
    
    await runTest('requerimiento5', 'API de publicación de resultados', async () => {
        const electionsResult = await makeRequest(`${API_BASE}/api/elections`);
        if (!electionsResult.success || !electionsResult.data.elections?.length) {
            return { success: false, message: 'No hay elecciones para probar publicación' };
        }
        
        const electionId = electionsResult.data.elections[0].id;
        const result = await makeRequest(`${API_BASE}/api/admin/elections/${electionId}/publish`, {
            method: 'POST',
            body: JSON.stringify({ publishedBy: 'test-system' })
        });
        
        return {
            success: result.success,
            message: result.success ? 'Sistema de publicación de resultados funcional' : (result.data?.error || result.error)
        };
    });
    
    await runTest('requerimiento5', 'Logs de auditoría detallados', async () => {
        const result = await makeRequest(`${API_BASE}/api/admin/audit-logs/detailed`);
        
        return {
            success: result.success && result.data.logs?.length > 0,
            message: result.success ? `${result.data.logs?.length || 0} logs de auditoría detallados` : result.error
        };
    });
}

// ============= REQUERIMIENTO 6: INTEGRACIÓN DEL BACKEND =============
async function testRequerimiento6() {
    log('\n🔧 REQUERIMIENTO 6: Integración del Backend', 'blue');
    
    await runTest('requerimiento6', 'Health check del servidor', async () => {
        const result = await makeRequest(`${API_BASE}/api/health`);
        
        return {
            success: result.success && result.data.ok === true,
            message: result.success ? 'Servidor backend funcionando correctamente' : result.error
        };
    });
    
    await runTest('requerimiento6', 'APIs de administración disponibles', async () => {
        const endpoints = [
            '/api/admin/candidates',
            '/api/admin/users',
            '/api/admin/elections',
            '/api/admin/audit-logs/stats',
            '/api/admin/voting-stats'
        ];
        
        const results = await Promise.all(
            endpoints.map(endpoint => makeRequest(`${API_BASE}${endpoint}`))
        );
        
        const successCount = results.filter(r => r.success).length;
        
        return {
            success: successCount === endpoints.length,
            message: `${successCount}/${endpoints.length} APIs de administración funcionando`
        };
    });
    
    await runTest('requerimiento6', 'Base de datos funcional', async () => {
        // Verificar que los datos persisten
        const result1 = await makeRequest(`${API_BASE}/api/candidates`);
        const initialCount = result1.data.candidates?.length || 0;
        
        // Crear un candidato de prueba
        const createResult = await makeRequest(`${API_BASE}/api/admin/candidates`, {
            method: 'POST',
            body: JSON.stringify({
                name: `Test DB Persistence ${Date.now()}`,
                party: 'Test Party',
                description: 'Test persistence'
            })
        });
        
        if (!createResult.success) {
            return { success: false, message: 'No se pudo crear candidato de prueba' };
        }
        
        const result2 = await makeRequest(`${API_BASE}/api/candidates`);
        const finalCount = result2.data.candidates?.length || 0;
        
        return {
            success: finalCount > initialCount,
            message: finalCount > initialCount ? 'Base de datos persiste datos correctamente' : 'Problema con persistencia de datos'
        };
    });
    
    await runTest('requerimiento6', 'Sistema de estadísticas completo', async () => {
        const result = await makeRequest(`${API_BASE}/api/admin/voting-stats`);
        
        const hasRequiredStats = result.data.stats?.totalUsers !== undefined &&
                                 result.data.stats?.eligibleVoters !== undefined &&
                                 result.data.stats?.participationRate !== undefined;
        
        return {
            success: result.success && hasRequiredStats,
            message: result.success && hasRequiredStats ? 'Sistema de estadísticas completo y funcional' : 'Faltan estadísticas importantes'
        };
    });
}

// ============= REQUERIMIENTO 7: PRUEBAS Y VALIDACIÓN =============
async function testRequerimiento7() {
    log('\n🧪 REQUERIMIENTO 7: Pruebas y Validación', 'blue');
    
    await runTest('requerimiento7', 'Validación de datos de entrada', async () => {
        // Probar crear candidato sin datos requeridos
        const result = await makeRequest(`${API_BASE}/api/admin/candidates`, {
            method: 'POST',
            body: JSON.stringify({}) // Sin datos requeridos
        });
        
        return {
            success: !result.success && result.status === 400,
            message: result.success ? 'Validación de entrada falla - acepta datos inválidos' : 'Validación de entrada funciona correctamente'
        };
    });
    
    await runTest('requerimiento7', 'Manejo de errores HTTP', async () => {
        // Probar endpoint inexistente
        const result = await makeRequest(`${API_BASE}/api/nonexistent-endpoint`);
        
        return {
            success: !result.success && (result.status === 404 || result.status >= 400),
            message: !result.success ? 'Manejo de errores HTTP funciona correctamente' : 'No maneja errores HTTP apropiadamente'
        };
    });
    
    await runTest('requerimiento7', 'Integridad de datos', async () => {
        // Verificar que no se pueden crear duplicados o datos inconsistentes
        const email = `integrity-test-${Date.now()}@test.com`;
        
        // Crear primer usuario
        const result1 = await makeRequest(`${API_BASE}/api/admin/users`, {
            method: 'POST',
            body: JSON.stringify({ email, role: 'voter' })
        });
        
        // Intentar crear duplicado
        const result2 = await makeRequest(`${API_BASE}/api/admin/users`, {
            method: 'POST',
            body: JSON.stringify({ email, role: 'voter' })
        });
        
        return {
            success: result1.success && !result2.success,
            message: (result1.success && !result2.success) ? 'Sistema previene duplicados correctamente' : 'Sistema permite datos duplicados'
        };
    });
    
    await runTest('requerimiento7', 'Performance del sistema', async () => {
        const start = Date.now();
        
        const promises = [
            makeRequest(`${API_BASE}/api/candidates`),
            makeRequest(`${API_BASE}/api/elections`),
            makeRequest(`${API_BASE}/api/voting-progress`),
            makeRequest(`${API_BASE}/api/health`)
        ];
        
        await Promise.all(promises);
        const duration = Date.now() - start;
        
        return {
            success: duration < 2000, // Menos de 2 segundos
            message: `Respuesta del sistema en ${duration}ms ${duration < 2000 ? '(Excelente)' : '(Lento)'}`
        };
    });
}

// ============= FUNCIÓN PRINCIPAL =============
async function runAllTests() {
    log('\n' + '='.repeat(60), 'cyan');
    log('🗳️  SISTEMA ELECTORAL - SUITE DE PRUEBAS COMPLETA', 'cyan');
    log('='.repeat(60), 'cyan');
    
    const startTime = Date.now();
    
    // Verificar que el servidor esté funcionando
    try {
        const healthCheck = await makeRequest(`${API_BASE}/api/health`);
        if (!healthCheck.success) {
            log('❌ ERROR: Servidor backend no está funcionando. Inicia el servidor primero:', 'red');
            log('   cd packages/vote-server && node server.js', 'yellow');
            process.exit(1);
        }
        log('✅ Servidor backend verificado - ejecutando pruebas...', 'green');
    } catch (error) {
        log('❌ ERROR: No se puede conectar al servidor backend', 'red');
        process.exit(1);
    }
    
    // Ejecutar todas las pruebas
    await testRequerimiento1();
    await testRequerimiento2();
    await testRequerimiento3();
    await testRequerimiento4();
    await testRequerimiento5();
    await testRequerimiento6();
    await testRequerimiento7();
    
    // Generar reporte final
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 RESUMEN DE PRUEBAS', 'cyan');
    log('='.repeat(60), 'cyan');
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    Object.keys(testResults).forEach((req, index) => {
        const result = testResults[req];
        const reqNumber = index + 1;
        const status = result.failed === 0 ? '✅' : '❌';
        
        log(`${status} Requerimiento ${reqNumber}: ${result.passed} ✅ | ${result.failed} ❌`, 
            result.failed === 0 ? 'green' : 'red');
        
        totalPassed += result.passed;
        totalFailed += result.failed;
    });
    
    log('\n' + '-'.repeat(40), 'cyan');
    log(`Total: ${totalPassed} pruebas exitosas, ${totalFailed} fallos`, 
        totalFailed === 0 ? 'green' : 'red');
    log(`Tiempo total: ${totalTime}ms`, 'cyan');
    
    const successRate = ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1);
    log(`Tasa de éxito: ${successRate}%`, successRate === '100.0' ? 'green' : 'yellow');
    
    // Generar reporte detallado
    generateDetailedReport();
    
    log('\n🎉 PRUEBAS COMPLETADAS!', 'bold');
    log('📋 Reporte detallado guardado en: test-report.json', 'cyan');
    
    if (totalFailed === 0) {
        log('✅ TODOS LOS REQUERIMIENTOS IMPLEMENTADOS CORRECTAMENTE', 'green');
    } else {
        log(`⚠️  ${totalFailed} pruebas fallaron - revisar implementación`, 'yellow');
    }
}

// Generar reporte detallado en JSON
function generateDetailedReport() {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalPassed: Object.values(testResults).reduce((sum, r) => sum + r.passed, 0),
            totalFailed: Object.values(testResults).reduce((sum, r) => sum + r.failed, 0)
        },
        requirements: testResults
    };
    
    fs.writeFileSync(
        path.join(__dirname, 'test-report.json'), 
        JSON.stringify(report, null, 2)
    );
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { runAllTests, testResults };