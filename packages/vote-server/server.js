// server.js
const express = require("express");
const cors = require("cors");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const { nanoid } = require("nanoid");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

// Simple rate limiting tracking
const rateLimitStore = new Map();

// Basic rate limiter implementation
function checkRateLimit(key, maxAttempts, windowMs) {
  const now = Date.now();
  const record = rateLimitStore.get(key) || { attempts: 0, resetTime: now + windowMs };
  
  if (now > record.resetTime) {
    record.attempts = 0;
    record.resetTime = now + windowMs;
  }
  
  record.attempts++;
  rateLimitStore.set(key, record);
  
  return record.attempts <= maxAttempts;
}

// DB setup (lowdb JSON file)
const file = path.join(__dirname, "db.json");
const adapter = new JSONFile(file);
const db = new Low(adapter, { users: [], candidates: [], votes: [], auditLogs: [], sessions: [], elections: [], publishedResults: [] });

async function initDb() {
  await db.read();
  
  // Initialize db.data structure if it doesn't exist
  if (!db.data) {
    db.data = { users: [], candidates: [], votes: [], auditLogs: [], sessions: [], elections: [], publishedResults: [] };
  }
  
  // Ensure all required arrays exist
  db.data.users = db.data.users || [];
  db.data.candidates = db.data.candidates || [];
  db.data.votes = db.data.votes || [];
  db.data.auditLogs = db.data.auditLogs || [];
  db.data.sessions = db.data.sessions || [];
  db.data.elections = db.data.elections || [];
  db.data.publishedResults = db.data.publishedResults || [];
  
  // Create default election if none exists
  if (db.data.elections.length === 0) {
    const defaultElection = {
      id: 'election-2024',
      name: 'Elección General 2024',
      description: 'Elección general para cargos públicos',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      status: 'active', // 'draft', 'active', 'closed', 'published'
      allowedVoters: [],
      settings: {
        requireAccessCode: false,
        allowPublicResults: true,
        autoPublishResults: true,
        resultPublishDelay: 0 // minutes after election ends
      },
      createdAt: new Date().toISOString(),
      createdBy: 'system'
    };
    db.data.elections.push(defaultElection);
  }
  
  await db.write();
}
initDb();

// --- Security Functions ---

// Hash password with salt
function hashPassword(password, salt = null) {
  if (!salt) salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

// Verify password
function verifyPassword(password, hash, salt) {
  const { hash: newHash } = hashPassword(password, salt);
  return hash === newHash;
}

// Generate secure session token
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Generate secure access code (6 digits)
function generateAccessCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Log audit events
async function logAuditEvent(type, actor, message, metadata = {}) {
  await db.read();
  const auditEntry = {
    id: nanoid(),
    timestamp: new Date().toISOString(),
    type, // 'LOGIN', 'VOTE', 'ADMIN_ACTION', 'SECURITY_EVENT'
    actor,
    message,
    metadata,
    ip: metadata.ip || 'unknown'
  };
  db.data.auditLogs.push(auditEntry);
  await db.write();
  return auditEntry;
}

// Get client IP
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         'unknown';
}

// Check if election is active
function isElectionActive(election) {
  const now = new Date();
  const startDate = new Date(election.startDate);
  const endDate = new Date(election.endDate);
  
  return election.status === 'active' && now >= startDate && now <= endDate;
}

// Check if election should be closed
function shouldCloseElection(election) {
  const now = new Date();
  const endDate = new Date(election.endDate);
  
  return election.status === 'active' && now > endDate;
}

// Generate election results
async function generateElectionResults(electionId) {
  await db.read();
  
  const election = db.data.elections.find(e => e.id === electionId);
  if (!election) throw new Error('Election not found');
  
  // Get all candidates for this election
  const candidates = db.data.candidates.map(candidate => ({
    ...candidate,
    votes: candidate.votes || 0
  }));
  
  // Calculate totals
  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
  const totalEligibleVoters = db.data.users.filter(u => u.role === 'voter' && u.isEligible !== false).length;
  const totalVotedUsers = db.data.users.filter(u => u.role === 'voter' && u.hasVoted).length;
  
  // Calculate percentages
  const candidatesWithPercentages = candidates.map(candidate => ({
    ...candidate,
    percentage: totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(2) : '0.00'
  })).sort((a, b) => b.votes - a.votes); // Sort by votes descending
  
  const participationRate = totalEligibleVoters > 0 ? 
    ((totalVotedUsers / totalEligibleVoters) * 100).toFixed(2) : '0.00';
  
  const results = {
    id: nanoid(),
    electionId,
    electionName: election.name,
    generatedAt: new Date().toISOString(),
    status: 'preliminary', // 'preliminary' or 'final'
    statistics: {
      totalVotes,
      totalEligibleVoters,
      totalVotedUsers,
      participationRate: parseFloat(participationRate),
      abstentions: totalEligibleVoters - totalVotedUsers
    },
    candidates: candidatesWithPercentages,
    metadata: {
      generationMethod: 'automatic',
      dataIntegrityHash: crypto.createHash('sha256')
        .update(JSON.stringify(candidates) + totalVotes)
        .digest('hex')
    }
  };
  
  return results;
}

// Publish election results
async function publishElectionResults(electionId, publishedBy = 'system') {
  await db.read();
  
  const election = db.data.elections.find(e => e.id === electionId);
  if (!election) throw new Error('Election not found');
  
  // Generate results
  const results = await generateElectionResults(electionId);
  results.status = 'final';
  results.publishedAt = new Date().toISOString();
  results.publishedBy = publishedBy;
  
  // Store published results
  db.data.publishedResults.push(results);
  
  // Update election status
  election.status = 'published';
  election.resultsPublishedAt = results.publishedAt;
  
  await db.write();
  
  // Log the publication
  await logAuditEvent('ADMIN_ACTION', publishedBy, 'Election results published', {
    electionId,
    electionName: election.name,
    totalVotes: results.statistics.totalVotes,
    participationRate: results.statistics.participationRate,
    resultId: results.id
  });
  
  return results;
}

// Auto-publish results if election has ended and auto-publish is enabled
async function checkAndAutoPublishResults() {
  await db.read();
  
  const electionsToPublish = db.data.elections.filter(election => {
    return shouldCloseElection(election) && 
           election.settings.autoPublishResults && 
           election.status !== 'published';
  });
  
  for (const election of electionsToPublish) {
    try {
      await publishElectionResults(election.id, 'auto-publish');
      console.log(`Auto-published results for election: ${election.name}`);
    } catch (error) {
      console.error(`Failed to auto-publish results for election ${election.id}:`, error);
      await logAuditEvent('ADMIN_ACTION', 'auto-publish', 'Failed to auto-publish election results', {
        electionId: election.id,
        error: error.message
      });
    }
  }
}

// --- Helpers ---
function findUserByEmail(email) {
  return db.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

// Enhanced auth: validate email + password with hashing
function validateCredentials(email, password, accessCode = null) {
  const user = findUserByEmail(email);
  if (!user) return null;
  
  // For backward compatibility, support plain text passwords during migration
  let isValidPassword = false;
  if (user.passwordHash && user.passwordSalt) {
    // Use hashed password verification
    isValidPassword = verifyPassword(password, user.passwordHash, user.passwordSalt);
  } else if (user.password) {
    // Fallback to plain text (for existing users)
    isValidPassword = user.password === password;
  }
  
  if (!isValidPassword) return null;
  
  // If access code is provided, validate it
  if (accessCode && user.accessCode && user.accessCode !== accessCode) {
    return null;
  }
  
  return user;
}

// Create or update user session
async function createUserSession(user, ip) {
  await db.read();
  const sessionToken = generateSessionToken();
  const session = {
    id: nanoid(),
    userId: user.id,
    token: sessionToken,
    createdAt: new Date().toISOString(),
    lastAccessAt: new Date().toISOString(),
    ip,
    active: true
  };
  
  // Invalidate previous sessions for this user
  db.data.sessions = db.data.sessions.map(s => 
    s.userId === user.id ? { ...s, active: false } : s
  );
  
  db.data.sessions.push(session);
  await db.write();
  
  return session;
}

// Validate session token
async function validateSession(token) {
  await db.read();
  const session = db.data.sessions.find(s => s.token === token && s.active);
  if (!session) return null;
  
  // Update last access time
  session.lastAccessAt = new Date().toISOString();
  await db.write();
  
  const user = db.data.users.find(u => u.id === session.userId);
  return { session, user };
}

// --- Endpoints ---

// Health
app.get("/api/health", (req, res) => res.json({ ok: true }));

// GET candidates (public)
app.get("/api/candidates", async (req, res) => {
  await db.read();
  res.json({ candidates: db.data.candidates });
});

// GET public results (aggregate) — returns candidates with votes
app.get("/api/results", async (req, res) => {
  await db.read();
  res.json({ candidates: db.data.candidates, totalVotes: db.data.votes.length });
});

// POST /api/login - Enhanced with security features
app.post("/api/login", async (req, res) => {
  const { email, password, accessCode } = req.body || {};
  const clientIP = getClientIP(req);
  
  // Rate limiting deshabilitado para desarrollo
  
  if (!email || !password) {
    await logAuditEvent('SECURITY_EVENT', email || 'unknown', 'Login attempt with missing credentials', { ip: clientIP });
    return res.status(400).json({ error: "email and password required" });
  }

  await db.read();
  const user = validateCredentials(email, password, accessCode);
  
  if (!user) {
    await logAuditEvent('SECURITY_EVENT', email, 'Failed login attempt', { ip: clientIP, reason: 'invalid_credentials' });
    return res.status(401).json({ error: "invalid credentials" });
  }

  // Create secure session
  const session = await createUserSession(user, clientIP);
  
  // Log successful login
  await logAuditEvent('LOGIN', user.email, 'Successful login', { 
    ip: clientIP, 
    role: user.role, 
    sessionId: session.id 
  });

  // Return minimal info with session token
  const { id, email: e, role, hasVoted } = user;
  res.json({ 
    id, 
    email: e, 
    role, 
    hasVoted,
    sessionToken: session.token,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  });
});

// POST /api/vote - Enhanced with strong security and anonymity
app.post("/api/vote", async (req, res) => {
  const { email, password, candidateId, sessionToken, accessCode } = req.body || {};
  const clientIP = getClientIP(req);
  
  // Rate limiting para votos deshabilitado para desarrollo
  
  // Validate required fields
  if (!email || !password || !candidateId) {
    await logAuditEvent('SECURITY_EVENT', email || 'unknown', 'Vote attempt with missing data', { ip: clientIP });
    return res.status(400).json({ error: "email, password, and candidateId required" });
  }

  await db.read();
  
  // Validate credentials with access code
  const user = validateCredentials(email, password, accessCode);
  if (!user) {
    await logAuditEvent('SECURITY_EVENT', email, 'Vote attempt with invalid credentials', { ip: clientIP });
    return res.status(401).json({ error: "invalid credentials" });
  }

  // Additional session validation for extra security
  if (sessionToken) {
    const sessionData = await validateSession(sessionToken);
    if (!sessionData || sessionData.user.id !== user.id) {
      await logAuditEvent('SECURITY_EVENT', email, 'Vote attempt with invalid session', { ip: clientIP });
      return res.status(401).json({ error: "invalid session" });
    }
  }

  // Check if user already voted
  if (user.hasVoted) {
    await logAuditEvent('SECURITY_EVENT', email, 'Attempted double vote', { ip: clientIP, candidateId });
    return res.status(400).json({ error: "user already voted" });
  }

  // Validate candidate exists
  const candidate = db.data.candidates.find(c => c.id === candidateId);
  if (!candidate) {
    await logAuditEvent('SECURITY_EVENT', email, 'Vote for non-existent candidate', { ip: clientIP, candidateId });
    return res.status(400).json({ error: "candidate not found" });
  }

  // Generate anonymous vote hash for integrity
  const voteHash = crypto.createHash('sha256')
    .update(`${user.id}${candidateId}${Date.now()}`)
    .digest('hex');

  // Create anonymous vote record (NO user identification stored)
  const vote = {
    id: nanoid(),
    candidateId,
    timestamp: new Date().toISOString(),
    voteHash, // For integrity verification, but not linkable to user
    ip: crypto.createHash('sha256').update(clientIP).digest('hex') // Hashed IP for basic fraud detection
  };
  
  db.data.votes.push(vote);

  // Increment candidate counter
  candidate.votes = (candidate.votes || 0) + 1;

  // Mark user as having voted (but don't store vote choice)
  const dbUser = db.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (dbUser) {
    dbUser.hasVoted = true;
    dbUser.votedAt = new Date().toISOString();
  }

  await db.write();

  // Log the vote event (without revealing choice)
  await logAuditEvent('VOTE', email, 'Vote cast successfully', { 
    ip: clientIP, 
    voteId: vote.id,
    // NOTE: candidateId is NOT logged to preserve vote secrecy
  });

  res.json({ 
    success: true, 
    voteId: vote.id,
    timestamp: vote.timestamp,
    message: "Vote recorded successfully" 
  });
});

// GET /api/user-status?email=...&password=...
// returns { hasVoted } so the frontend can show "ya votaste" to that user.
app.post("/api/status", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email+password required" });

  await db.read();
  const user = validateCredentials(email, password);
  if (!user) return res.status(401).json({ error: "invalid credentials" });

  res.json({ hasVoted: !!user.hasVoted, role: user.role });
});

// Admin-only: get raw votes count or list (note: votes are anonymous, but admin can see timestamps and candidate ids)
// For demo this endpoint is unprotected; in prod deberías protegerlo.
app.get("/api/admin/votes", async (req, res) => {
  await db.read();
  res.json({ votes: db.data.votes, candidates: db.data.candidates });
});

// Admin-only: get users info (without passwords for security)
app.get("/api/admin/users", async (req, res) => {
  await db.read();
  // Remove sensitive data from response for security
  const safeUsers = db.data.users.map(user => ({
    id: user.id,
    email: user.email,
    role: user.role,
    hasVoted: user.hasVoted,
    votedAt: user.votedAt,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    isEligible: user.isEligible !== false // Default to true for existing users
  }));
  res.json({ users: safeUsers });
});

// Admin-only: get audit logs
app.get("/api/admin/audit-logs", async (req, res) => {
  const { type, limit = 100, offset = 0 } = req.query;
  
  await db.read();
  let logs = db.data.auditLogs || [];
  
  // Filter by type if specified
  if (type) {
    logs = logs.filter(log => log.type === type);
  }
  
  // Sort by timestamp (newest first)
  logs = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Apply pagination
  const paginatedLogs = logs.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({ 
    logs: paginatedLogs, 
    total: logs.length,
    hasMore: parseInt(offset) + parseInt(limit) < logs.length
  });
});

// Admin-only: create or update voter credentials
app.post("/api/admin/voters", async (req, res) => {
  const { voters } = req.body || {};
  if (!Array.isArray(voters) || voters.length === 0) {
    return res.status(400).json({ error: "voters array required" });
  }
  
  await db.read();
  const results = [];
  const credentials = [];
  
  for (const voterData of voters) {
    const { email, name, documentId, isEligible = true, district, phone } = voterData;
    
    if (!email || !name || !documentId) {
      results.push({ email, success: false, error: "email, name, and documentId required" });
      continue;
    }
    
    // Check if user already exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      results.push({ email, success: false, error: "user already exists" });
      continue;
    }
    
    // Generate secure credentials
    const password = crypto.randomBytes(6).toString('hex').toUpperCase(); // 12 char password
    const accessCode = generateAccessCode();
    const { hash, salt } = hashPassword(password);
    
    // Create new voter
    const newVoter = {
      id: nanoid(),
      email,
      name,
      documentId,
      passwordHash: hash,
      passwordSalt: salt,
      accessCode,
      role: 'voter',
      hasVoted: false,
      isEligible,
      district,
      phone,
      createdAt: new Date().toISOString()
    };
    
    db.data.users.push(newVoter);
    
    credentials.push({
      email,
      password,
      accessCode
    });
    
    results.push({ email, success: true, id: newVoter.id });
  }
  
  await db.write();
  
  // Log the admin action
  await logAuditEvent('ADMIN_ACTION', 'admin', `Created ${results.filter(r => r.success).length} new voters`, {
    votersCreated: results.filter(r => r.success).length,
    totalAttempts: voters.length
  });
  
  res.json({ results, credentials });
});

// Logout endpoint
app.post("/api/logout", async (req, res) => {
  const { sessionToken, email } = req.body || {};
  
  if (sessionToken) {
    await db.read();
    // Invalidate the session
    const session = db.data.sessions.find(s => s.token === sessionToken);
    if (session) {
      session.active = false;
      session.endedAt = new Date().toISOString();
      await db.write();
      
      await logAuditEvent('LOGIN', email || 'unknown', 'User logged out', { sessionId: session.id });
    }
  }
  
  res.json({ success: true });
});

// Get elections
app.get("/api/elections", async (req, res) => {
  await db.read();
  const elections = db.data.elections || [];
  res.json({ elections });
});

// Get active election
app.get("/api/elections/active", async (req, res) => {
  await db.read();
  const activeElection = db.data.elections.find(e => isElectionActive(e));
  
  if (!activeElection) {
    return res.status(404).json({ error: 'No active election found' });
  }
  
  res.json({ election: activeElection });
});

// Get preliminary results (live results during voting)
app.get("/api/results/preliminary/:electionId", async (req, res) => {
  const { electionId } = req.params;
  
  try {
    const results = await generateElectionResults(electionId);
    res.json({ results });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Get published results (final results)
app.get("/api/results/published/:electionId", async (req, res) => {
  const { electionId } = req.params;
  
  await db.read();
  const publishedResult = db.data.publishedResults.find(r => r.electionId === electionId);
  
  if (!publishedResult) {
    return res.status(404).json({ error: 'No published results found for this election' });
  }
  
  res.json({ results: publishedResult });
});

// Get all published results
app.get("/api/results/published", async (req, res) => {
  await db.read();
  const publishedResults = db.data.publishedResults || [];
  res.json({ results: publishedResults });
});

// Admin: Manually publish results
app.post("/api/admin/elections/:electionId/publish", async (req, res) => {
  const { electionId } = req.params;
  const { publishedBy = 'admin' } = req.body || {};
  
  try {
    const results = await publishElectionResults(electionId, publishedBy);
    res.json({ 
      success: true, 
      results,
      message: 'Results published successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reset function for new electoral season
async function resetForNewElection() {
  await db.read();
  
  // Reset all candidate votes to 0
  db.data.candidates.forEach(candidate => {
    candidate.votes = 0;
  });
  
  // Reset all voters to "not voted" status
  db.data.users.forEach(user => {
    if (user.role === 'voter') {
      user.hasVoted = false;
      // Remove votedAt timestamp if exists
      delete user.votedAt;
    }
  });
  
  // Clear all previous votes (new electoral season)
  db.data.votes = [];
  
  await db.write();
  
  await logAuditEvent('ADMIN_ACTION', 'admin', 'Electoral system reset for new season', {
    candidatesReset: db.data.candidates.length,
    votersReset: db.data.users.filter(u => u.role === 'voter').length,
    votesCleared: true
  });
}

// Admin: Create or update election
app.post("/api/admin/elections", async (req, res) => {
  const { name, description, startDate, endDate, settings } = req.body || {};
  
  if (!name || !startDate || !endDate) {
    return res.status(400).json({ error: 'name, startDate, and endDate are required' });
  }
  
  await db.read();
  
  // Reset electoral system for new season
  await resetForNewElection();
  
  const newElection = {
    id: nanoid(),
    name,
    description: description || '',
    startDate,
    endDate,
    status: 'draft',
    settings: {
      requireAccessCode: false,
      allowPublicResults: true,
      autoPublishResults: true,
      resultPublishDelay: 0,
      ...settings
    },
    createdAt: new Date().toISOString(),
    createdBy: 'admin'
  };
  
  db.data.elections.push(newElection);
  await db.write();
  
  await logAuditEvent('ADMIN_ACTION', 'admin', 'New election created', {
    electionId: newElection.id,
    electionName: name
  });
  
  res.json({ election: newElection });
});

// Admin: Update election status
app.put("/api/admin/elections/:electionId/status", async (req, res) => {
  const { electionId } = req.params;
  const { status } = req.body || {};
  
  if (!['draft', 'active', 'closed', 'published'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  await db.read();
  const election = db.data.elections.find(e => e.id === electionId);
  
  if (!election) {
    return res.status(404).json({ error: 'Election not found' });
  }
  
  const previousStatus = election.status;
  election.status = status;
  election.updatedAt = new Date().toISOString();
  
  await db.write();
  
  await logAuditEvent('ADMIN_ACTION', 'admin', 'Election status updated', {
    electionId,
    electionName: election.name,
    previousStatus,
    newStatus: status
  });
  
  res.json({ election });
});

// Admin: Delete election (only closed elections)
app.delete("/api/admin/elections/:electionId", async (req, res) => {
  const { electionId } = req.params;
  
  await db.read();
  const electionIndex = db.data.elections.findIndex(e => e.id === electionId);
  
  if (electionIndex === -1) {
    return res.status(404).json({ error: 'Election not found' });
  }
  
  const election = db.data.elections[electionIndex];
  
  // Only allow deletion of closed elections
  if (election.status !== 'closed' && election.status !== 'published') {
    return res.status(400).json({ error: 'Only closed or published elections can be deleted' });
  }
  
  // Remove the election
  db.data.elections.splice(electionIndex, 1);
  
  // Also remove published results for this election
  db.data.publishedResults = db.data.publishedResults.filter(r => r.electionId !== electionId);
  
  await db.write();
  
  await logAuditEvent('ADMIN_ACTION', 'admin', 'Election deleted', {
    electionId,
    electionName: election.name,
    electionStatus: election.status
  });
  
  res.json({ success: true, message: 'Election deleted successfully' });
});

// Admin-only: create candidate
app.post("/api/admin/candidates", async (req, res) => {
  const { name, photo, description, party } = req.body || {};
  if (!name || !description || !party) {
    return res.status(400).json({ error: "name, description, and party are required" });
  }

  await db.read();
  const newCandidate = {
    id: nanoid(),
    name,
    photo: photo || `https://via.placeholder.com/200x200?text=${encodeURIComponent(name)}`,
    description,
    party,
    votes: 0
  };
  
  db.data.candidates.push(newCandidate);
  await db.write();
  
  res.json({ candidate: newCandidate });
});

// Admin-only: update candidate
app.put("/api/admin/candidates/:id", async (req, res) => {
  const { id } = req.params;
  const { name, photo, description, party } = req.body || {};
  
  await db.read();
  const candidate = db.data.candidates.find(c => c.id === id);
  if (!candidate) {
    return res.status(404).json({ error: "candidate not found" });
  }
  
  // Update candidate fields if provided
  if (name !== undefined) candidate.name = name;
  if (photo !== undefined) candidate.photo = photo;
  if (description !== undefined) candidate.description = description;
  if (party !== undefined) candidate.party = party;
  
  await db.write();
  res.json({ candidate });
});

// Admin-only: delete candidate
app.delete("/api/admin/candidates/:id", async (req, res) => {
  const { id } = req.params;
  
  await db.read();
  const candidateIndex = db.data.candidates.findIndex(c => c.id === id);
  if (candidateIndex === -1) {
    return res.status(404).json({ error: "candidate not found" });
  }
  
  // Check if candidate has votes - you might want to prevent deletion if they do
  const candidate = db.data.candidates[candidateIndex];
  if (candidate.votes > 0) {
    return res.status(400).json({ error: "cannot delete candidate with votes" });
  }
  
  db.data.candidates.splice(candidateIndex, 1);
  await db.write();
  
  res.json({ ok: true });
});

// --- EXTENDED ADMIN APIs FOR COMPLETE INTEGRATION ---

// Admin: Enhanced candidate management with all fields
app.post("/api/admin/candidates/extended", async (req, res) => {
  const { name, photo, description, party, position, trajectory, profile, projects } = req.body || {};
  if (!name || !party) {
    return res.status(400).json({ error: "name and party are required" });
  }

  await db.read();
  const newCandidate = {
    id: nanoid(),
    name,
    photo: photo || `https://via.placeholder.com/200x200?text=${encodeURIComponent(name)}`,
    description: description || '',
    party,
    position: position || '',
    trajectory: trajectory || '',
    profile: profile || '',
    projects: projects || '',
    votes: 0,
    createdAt: new Date().toISOString()
  };
  
  db.data.candidates.push(newCandidate);
  await db.write();
  
  await logAuditEvent('ADMIN_ACTION', 'admin', 'Extended candidate created', {
    candidateId: newCandidate.id,
    candidateName: name,
    party
  });
  
  res.json({ candidate: newCandidate });
});

// Admin: Update candidate with all fields
app.put("/api/admin/candidates/extended/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};
  
  await db.read();
  const candidate = db.data.candidates.find(c => c.id === id);
  if (!candidate) {
    return res.status(404).json({ error: "candidate not found" });
  }
  
  // Update all candidate fields except id and votes
  const allowedFields = ['name', 'photo', 'description', 'party', 'position', 'trajectory', 'profile', 'projects'];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      candidate[field] = updates[field];
    }
  });
  candidate.updatedAt = new Date().toISOString();
  
  await db.write();
  
  await logAuditEvent('ADMIN_ACTION', 'admin', 'Extended candidate updated', {
    candidateId: id,
    candidateName: candidate.name,
    updatedFields: Object.keys(updates).filter(key => allowedFields.includes(key))
  });
  
  res.json({ candidate });
});

// Admin: Get all users/voters with detailed info
app.get("/api/admin/users/detailed", async (req, res) => {
  await db.read();
  const users = db.data.users.map(user => ({
    id: user.id,
    email: user.email,
    role: user.role,
    isEligible: user.isEligible,
    hasVoted: user.hasVoted,
    accessCode: user.accessCode,
    name: user.name || '',
    department: user.department || '',
    idNumber: user.idNumber || '',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt
  }));
  res.json({ users });
});

// Admin: Bulk upload voters from CSV data
app.post("/api/admin/users/bulk-upload", async (req, res) => {
  const { voters } = req.body || {};
  
  if (!Array.isArray(voters) || voters.length === 0) {
    return res.status(400).json({ error: "voters array is required" });
  }
  
  await db.read();
  
  const results = {
    created: [],
    errors: [],
    duplicates: []
  };
  
  for (let i = 0; i < voters.length; i++) {
    const voterData = voters[i];
    const email = voterData.email?.toLowerCase();
    
    if (!email) {
      results.errors.push({ row: i + 1, email: '', error: 'Email is required' });
      continue;
    }
    
    // Check if user already exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      results.duplicates.push({ row: i + 1, email });
      continue;
    }
    
    try {
      // Generate secure credentials
      const password = Math.random().toString(36).slice(-10);
      const accessCode = generateAccessCode();
      const { hash: passwordHash, salt: passwordSalt } = hashPassword(password);
      
      const newUser = {
        id: nanoid(),
        email,
        passwordHash,
        passwordSalt,
        role: 'voter',
        isEligible: voterData.isEligible !== false,
        hasVoted: false,
        accessCode,
        createdAt: new Date().toISOString(),
        // Additional fields from CSV
        name: voterData.name || '',
        department: voterData.department || '',
        idNumber: voterData.idNumber || ''
      };
      
      db.data.users.push(newUser);
      
      results.created.push({
        email,
        password,
        accessCode,
        name: newUser.name,
        row: i + 1
      });
      
    } catch (error) {
      results.errors.push({ row: i + 1, email, error: error.message });
    }
  }
  
  await db.write();
  
  await logAuditEvent('ADMIN_ACTION', 'admin', 'Bulk voter upload completed', {
    totalAttempted: voters.length,
    created: results.created.length,
    errors: results.errors.length,
    duplicates: results.duplicates.length
  });
  
  res.json({
    success: true,
    summary: {
      total: voters.length,
      created: results.created.length,
      errors: results.errors.length,
      duplicates: results.duplicates.length
    },
    results
  });
});

// Admin: Generate credentials for user
app.post("/api/admin/users/:id/regenerate-credentials", async (req, res) => {
  const { id } = req.params;
  
  await db.read();
  const user = db.data.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  
  // Generate new credentials
  const password = Math.random().toString(36).slice(-10);
  const accessCode = generateAccessCode();
  const { hash: passwordHash, salt: passwordSalt } = hashPassword(password);
  
  user.passwordHash = passwordHash;
  user.passwordSalt = passwordSalt;
  user.accessCode = accessCode;
  user.updatedAt = new Date().toISOString();
  
  await db.write();
  
  await logAuditEvent('ADMIN_ACTION', 'admin', 'User credentials regenerated', {
    userId: id,
    userEmail: user.email
  });
  
  res.json({
    credentials: {
      email: user.email,
      password,
      accessCode
    }
  });
});

// Admin: Get detailed audit logs with filtering
app.get("/api/admin/audit-logs/detailed", async (req, res) => {
  const { page = 1, limit = 50, type, actor, startDate, endDate } = req.query;
  
  await db.read();
  let logs = [...db.data.auditLogs];
  
  // Apply filters
  if (type) {
    logs = logs.filter(log => log.type === type);
  }
  if (actor) {
    logs = logs.filter(log => log.actor.toLowerCase().includes(actor.toLowerCase()));
  }
  if (startDate) {
    logs = logs.filter(log => new Date(log.timestamp) >= new Date(startDate));
  }
  if (endDate) {
    logs = logs.filter(log => new Date(log.timestamp) <= new Date(endDate));
  }
  
  // Sort by timestamp descending (newest first)
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Pagination
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedLogs = logs.slice(startIndex, endIndex);
  
  res.json({
    logs: paginatedLogs,
    pagination: {
      current: parseInt(page),
      limit: parseInt(limit),
      total: logs.length,
      pages: Math.ceil(logs.length / parseInt(limit))
    },
    filters: { type, actor, startDate, endDate }
  });
});

// Admin: Get audit log statistics
app.get("/api/admin/audit-logs/stats", async (req, res) => {
  await db.read();
  const logs = db.data.auditLogs;
  
  const stats = {
    total: logs.length,
    byType: {},
    byDate: {},
    recentActivity: logs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10),
    securityEvents: logs.filter(log => log.type === 'SECURITY_EVENT').length,
    loginEvents: logs.filter(log => log.type === 'LOGIN').length,
    voteEvents: logs.filter(log => log.type === 'VOTE').length,
    adminActions: logs.filter(log => log.type === 'ADMIN_ACTION').length
  };
  
  // Count by type
  logs.forEach(log => {
    stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
  });
  
  // Count by date (last 7 days)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    last7Days.push(dateStr);
    stats.byDate[dateStr] = logs.filter(log => 
      log.timestamp.split('T')[0] === dateStr
    ).length;
  }
  
  res.json({ stats });
});

// Admin: Get comprehensive voting statistics
app.get("/api/admin/voting-stats", async (req, res) => {
  await db.read();
  
  const totalUsers = db.data.users.filter(u => u.role === 'voter').length;
  const eligibleVoters = db.data.users.filter(u => u.role === 'voter' && u.isEligible !== false).length;
  const votedUsers = db.data.users.filter(u => u.role === 'voter' && u.hasVoted).length;
  const totalVotes = db.data.candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
  
  // Voting by time (hourly for today)
  const today = new Date().toISOString().split('T')[0];
  const todayVotes = db.data.auditLogs.filter(log => 
    log.type === 'VOTE' && log.timestamp.startsWith(today)
  );
  
  const hourlyVotes = {};
  for (let i = 0; i < 24; i++) {
    hourlyVotes[`${i.toString().padStart(2, '0')}:00`] = 0;
  }
  
  todayVotes.forEach(log => {
    const hour = new Date(log.timestamp).getHours();
    const hourKey = `${hour.toString().padStart(2, '0')}:00`;
    hourlyVotes[hourKey]++;
  });
  
  const stats = {
    totalUsers,
    eligibleVoters,
    votedUsers,
    totalVotes,
    participationRate: eligibleVoters > 0 ? 
      ((votedUsers / eligibleVoters) * 100).toFixed(2) : '0.00',
    abstentions: eligibleVoters - votedUsers,
    candidates: db.data.candidates.map(c => ({
      id: c.id,
      name: c.name,
      party: c.party,
      votes: c.votes || 0,
      percentage: totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(2) : '0.00'
    })).sort((a, b) => b.votes - a.votes),
    hourlyVotes,
    lastUpdated: new Date().toISOString()
  };
  
  res.json({ stats });
});

// Public: Get basic voting progress
app.get("/api/voting-progress", async (req, res) => {
  await db.read();
  
  const eligibleVoters = db.data.users.filter(u => u.role === 'voter' && u.isEligible !== false).length;
  const votedUsers = db.data.users.filter(u => u.role === 'voter' && u.hasVoted).length;
  
  const progress = {
    eligibleVoters,
    votedUsers,
    participationRate: eligibleVoters > 0 ? 
      ((votedUsers / eligibleVoters) * 100).toFixed(2) : '0.00',
    remaining: eligibleVoters - votedUsers,
    lastUpdated: new Date().toISOString()
  };
  
  res.json({ progress });
});

// Auto-publish timer - check every minute
setInterval(async () => {
  try {
    await checkAndAutoPublishResults();
  } catch (error) {
    console.error('Error in auto-publish timer:', error);
  }
}, 60 * 1000); // Check every minute

// Start
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 Vote Server listening on port ${PORT}`);
  console.log('\n📊 Sistema Electoral Completo - API Endpoints:');
  console.log('\n📋 Public APIs:');
  console.log('   GET  /api/health - Health check');
  console.log('   GET  /api/candidates - Lista pública de candidatos');
  console.log('   GET  /api/results - Resultados públicos');
  console.log('   GET  /api/voting-progress - Progreso de votación');
  
  console.log('\n🔐 Authentication APIs:');
  console.log('   POST /api/login - Autenticación de usuario');
  console.log('   POST /api/logout - Cerrar sesión');
  console.log('   POST /api/vote - Emisión de voto');
  
  console.log('\n🗳️  Election APIs:');
  console.log('   GET  /api/elections - Lista de elecciones');
  console.log('   GET  /api/elections/active - Elección activa');
  console.log('   GET  /api/results/preliminary/:id - Resultados preliminares');
  console.log('   GET  /api/results/published/:id - Resultados oficiales');
  
  console.log('\n👨‍💼 Admin - Candidate Management:');
  console.log('   POST /api/admin/candidates - Crear candidato básico');
  console.log('   POST /api/admin/candidates/extended - Crear candidato completo');
  console.log('   PUT  /api/admin/candidates/:id - Actualizar candidato básico');
  console.log('   PUT  /api/admin/candidates/extended/:id - Actualizar candidato completo');
  console.log('   DELETE /api/admin/candidates/:id - Eliminar candidato');
  
  console.log('\n👥 Admin - Voter Management:');
  console.log('   GET  /api/admin/users - Lista de usuarios');
  console.log('   GET  /api/admin/users/detailed - Lista detallada de usuarios');
  console.log('   POST /api/admin/users - Crear votante individual');
  console.log('   POST /api/admin/users/bulk-upload - Carga masiva de votantes');
  console.log('   POST /api/admin/users/:id/regenerate-credentials - Regenerar credenciales');
  console.log('   PUT  /api/admin/users/:id/eligibility - Actualizar elegibilidad');
  console.log('   DELETE /api/admin/users/:id - Eliminar usuario');
  
  console.log('\n🗳️  Admin - Election Management:');
  console.log('   POST /api/admin/elections - Crear elección');
  console.log('   GET  /api/admin/elections/:id - Detalle de elección');
  console.log('   PUT  /api/admin/elections/:id - Actualizar elección');
  console.log('   PUT  /api/admin/elections/:id/status - Cambiar estado');
  console.log('   POST /api/admin/elections/:id/publish - Publicar resultados');
  
  console.log('\n📊 Admin - Statistics & Audit:');
  console.log('   GET  /api/admin/voting-stats - Estadísticas completas');
  console.log('   GET  /api/admin/audit-logs/detailed - Logs de auditoría');
  console.log('   GET  /api/admin/audit-logs/stats - Estadísticas de logs');
  
  console.log('\n⚙️  Auto-publish system initialized - checking every minute');
  console.log('💾 Database: LowDB JSON file with security features');
  console.log('🔒 Security: PBKDF2 password hashing, session management, rate limiting\n');
  
  // Run initial check
  setTimeout(async () => {
    try {
      await checkAndAutoPublishResults();
    } catch (error) {
      console.error('Error in initial auto-publish check:', error);
    }
  }, 5000); // Wait 5 seconds after startup
});
