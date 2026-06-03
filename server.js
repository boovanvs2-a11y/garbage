const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ──────────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// ─── Firebase Admin SDK Setup ────────────────────────────────────
// NOTE: To enable Firebase persistence, set FIREBASE_PROJECT_ID and
// GOOGLE_APPLICATION_CREDENTIALS environment variables.
// For demo/local, we fall back to in-memory.
let db = null;
let usingFirebase = false;

try {
  const admin = require('firebase-admin');
  if (process.env.FIREBASE_PROJECT_ID && !admin.apps.length) {
    const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
      ? require(process.env.GOOGLE_APPLICATION_CREDENTIALS)
      : null;

    admin.initializeApp({
      credential: serviceAccount
        ? admin.credential.cert(serviceAccount)
        : admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    db = admin.firestore();
    usingFirebase = true;
    console.log('✅ Firebase Firestore connected');
  }
} catch (e) {
  console.log('ℹ️  Firebase not configured — using in-memory store (set FIREBASE_PROJECT_ID to enable)');
}

// ─── In-Memory Data Store (Fallback) ────────────────────────────
const memStore = {
  walkabilityReports: [
    { id: '1', lat: 12.974950, lng: 77.604100, area: 'Church Street', score: 92, sidewalkQuality: 'Excellent', lighting: 'Well-lit', greenCover: 'Moderate', pedestrianDensity: 'High', accessibility: 'Ramps Present', hazards: [], timestamp: '2026-06-03T09:12:00Z', reporter: 'Deepak S.', xpAwarded: 50 },
    { id: '2', lat: 12.978250, lng: 77.640620, area: '100ft Road Indiranagar', score: 68, sidewalkQuality: 'Fair', lighting: 'Moderate', greenCover: 'Good', pedestrianDensity: 'High', accessibility: 'Partial Ramps', hazards: ['Poor lighting at night'], timestamp: '2026-06-03T10:15:00Z', reporter: 'Sruthi K.', xpAwarded: 30 },
    { id: '3', lat: 12.917230, lng: 77.622610, area: 'Silk Board Junction', score: 24, sidewalkQuality: 'Poor', lighting: 'Poor', greenCover: 'Low', pedestrianDensity: 'High', accessibility: 'No Ramps', hazards: ['Heavy traffic', 'No footpath', 'Poor lighting'], timestamp: '2026-06-03T11:45:00Z', reporter: 'Prasad M.', xpAwarded: 30 },
    { id: '4', lat: 13.006840, lng: 77.571400, area: 'Malleshwaram 8th Cross', score: 75, sidewalkQuality: 'Good', lighting: 'Good', greenCover: 'Excellent', pedestrianDensity: 'High', accessibility: 'Full Accessibility', hazards: [], timestamp: '2026-06-02T16:30:00Z', reporter: 'Naveen Raj', xpAwarded: 40 },
    { id: '5', lat: 12.929870, lng: 77.581560, area: 'Jayanagar 4th Block', score: 85, sidewalkQuality: 'Good', lighting: 'Well-lit', greenCover: 'Excellent', pedestrianDensity: 'High', accessibility: 'Full Accessibility', hazards: [], timestamp: '2026-06-02T19:00:00Z', reporter: 'Anita Y.', xpAwarded: 50 },
    { id: '6', lat: 12.956920, lng: 77.701130, area: 'Marathahalli Bridge', score: 38, sidewalkQuality: 'Poor', lighting: 'Moderate', greenCover: 'Low', pedestrianDensity: 'Medium', accessibility: 'No Ramps', hazards: ['Construction zone', 'Missing footpath sections'], timestamp: '2026-06-01T08:20:00Z', reporter: 'Kiran V.', xpAwarded: 30 },
  ],

  garbageReports: [
    { id: '1', lat: 12.9274, lng: 77.6833, area: 'Bellandur Outer Ring Road', type: 'Mixed Waste', severity: 'High', status: 'Reported', ward: 'BBMP Ward 150 (Bellandur)', mla: 'Aravind Limbavali (Mahadevapura)', mp: 'P. C. Mohan (Bangalore Central)', timestamp: '2026-06-03T08:00:00Z', reporter: 'Sanjay N.', description: 'Open garbage dump near the tech park exit' },
    { id: '2', lat: 12.9080, lng: 77.5927, area: 'JP Nagar 6th Phase', type: 'Plastic', severity: 'Medium', status: 'In Progress', ward: 'BBMP Ward 177 (JP Nagar)', mla: 'Ramalinga Reddy (BTM Layout)', mp: 'Tejasvi Surya (Bangalore South)', timestamp: '2026-06-02T14:30:00Z', reporter: 'Citizen_V', description: 'Plastic waste accumulating in the stormwater drain' },
    { id: '3', lat: 13.0285, lng: 77.5197, area: 'Peenya Industrial Area', type: 'Hazardous', severity: 'Critical', status: 'Reported', ward: 'BBMP Ward 41 (Peenya Industrial)', mla: 'R. Manjunath (Dasarahalli)', mp: 'D. V. Sadananda Gowda (Bangalore North)', timestamp: '2026-06-01T11:20:00Z', reporter: 'Anand R.', description: 'Chemical waste dumping near empty plot' },
    { id: '4', lat: 12.9698, lng: 77.7500, area: 'Whitefield Main Road', type: 'Construction Debris', severity: 'High', status: 'Resolved', ward: 'BBMP Ward 83 (Kadugodi)', mla: 'Aravind Limbavali (Mahadevapura)', mp: 'P. C. Mohan (Bangalore Central)', timestamp: '2026-05-31T09:45:00Z', reporter: 'Priya Menon', description: 'Construction debris blocking the footpath' },
    { id: '5', lat: 12.8794, lng: 77.5855, area: 'Arakere Lake Road', type: 'Organic', severity: 'Low', status: 'Reported', ward: 'BBMP Ward 193 (Arakere)', mla: 'M. Krishnappa (Bangalore South)', mp: 'Tejasvi Surya (Bangalore South)', timestamp: '2026-06-02T16:15:00Z', reporter: 'Arun K.', description: 'Vegetable waste dumped near the lake fencing' },
  ],

  climateAlerts: [
    { id: '1', type: 'Flood', severity: 'Critical', area: 'Bellandur Lake & Yemalur', lat: 12.9324, lng: 77.6713, description: 'High risk of urban flooding at Yemalur corridor due to rajakaluve encroachment. ResSolv™ identifies 14 commercial assets at imminent risk during >60mm downpour.', riskScore: 92, mitigationStatus: 'Assessment', affectedAssets: 14, timestamp: '2026-06-03T10:30:00Z' },
    { id: '2', type: 'Water Stress', severity: 'High', area: 'Sarjapur Road / Varthur', lat: 12.9406, lng: 77.7466, description: 'Groundwater extraction exceeds recharge rate by 310%. Borewells past 1200ft running dry. ResScore™ Environmental pillar flagged as critical.', riskScore: 84, mitigationStatus: 'Emergency Planning', affectedAssets: 35000, timestamp: '2026-06-02T08:15:00Z' },
    { id: '3', type: 'Air Quality', severity: 'Medium', area: 'Hebbal Junction', lat: 13.0354, lng: 77.5971, description: 'PM2.5 levels exceeding WHO guidelines by 4x due to severe traffic bottlenecking and elevated highway dust entrapment.', riskScore: 68, mitigationStatus: 'Monitoring', affectedAssets: 12000, timestamp: '2026-06-01T14:40:00Z' },
    { id: '4', type: 'Heat Wave', severity: 'High', area: 'Electronic City Phase 1', lat: 12.8452, lng: 77.6601, description: 'Urban Heat Island (UHI) effect detected. Surface temperatures reaching 43°C. Loss of green cover due to rapid concrete expansion.', riskScore: 78, mitigationStatus: 'Planning', affectedAssets: 180, timestamp: '2026-06-03T12:00:00Z' },
    { id: '5', type: 'Flood', severity: 'Medium', area: 'Koramangala 4th Block', lat: 12.9345, lng: 77.6266, description: 'Vulnerable to moderate waterlogging near Sony World Junction. ResHub™ recommends urgent drain desilting before upcoming monsoon.', riskScore: 65, mitigationStatus: 'In Progress', affectedAssets: 45, timestamp: '2026-06-02T09:30:00Z' },
  ],

  safetyAlerts: [
    { id: '1', lat: 12.917230, lng: 77.622610, area: 'Silk Board Junction', type: 'Heavy Traffic', severity: 'Critical', message: 'Extreme pedestrian risk — avoid peak hours 8–10AM & 5–8PM', timestamp: '2026-06-03T07:00:00Z', active: true },
    { id: '2', lat: 12.956920, lng: 77.701130, area: 'Marathahalli Bridge', type: 'Construction', severity: 'High', message: 'Active construction blocking 60% of footpath. Use alternate route via ORR service road.', timestamp: '2026-06-03T06:00:00Z', active: true },
    { id: '3', lat: 12.974950, lng: 77.604100, area: 'MG Road', type: 'Event', severity: 'Medium', message: 'Weekend market event — increased pedestrian density. Enjoy safe walking!', timestamp: '2026-06-02T20:00:00Z', active: true },
    { id: '4', lat: 13.0285, lng: 77.5197, area: 'Peenya Industrial', type: 'Poor Lighting', severity: 'High', message: 'Streetlights out — avoid walking after 8PM. BBMP complaint filed (#BLR-2026-4421).', timestamp: '2026-06-01T22:00:00Z', active: true },
    { id: '5', lat: 12.9080, lng: 77.5927, area: 'JP Nagar 6th Phase', type: 'Waterlogging', severity: 'Medium', message: 'Post-rain waterlogging on main footpath. Use side street.', timestamp: '2026-06-03T09:00:00Z', active: true },
  ],

  routes: [
    { id: '1', name: 'Church Street Heritage Walk', from: 'St. Mark\'s Cathedral', to: 'Cubbon Park Gate', distance: 1.2, duration: 18, safetyScore: 94, accessibility: true, waypoints: [[12.9717, 77.6012], [12.9722, 77.6005], [12.9735, 77.5995]], features: ['Well-lit', 'Wide footpath', 'Green cover', 'No traffic signals'], timestamp: '2026-06-03T08:00:00Z' },
    { id: '2', name: 'Malleshwaram Morning Route', from: '18th Cross Railway Station', to: 'Kanteerava Stadium', distance: 2.8, duration: 38, safetyScore: 79, accessibility: true, waypoints: [[13.0068, 77.5714], [12.9800, 77.5800]], features: ['Tree-lined', 'Low traffic', 'Accessible ramps'], timestamp: '2026-06-02T07:00:00Z' },
    { id: '3', name: 'Indiranagar Safe Walk', from: '100ft Road Signal', to: 'CMH Road Market', distance: 0.9, duration: 13, safetyScore: 71, accessibility: false, waypoints: [[12.9782, 77.6406], [12.9765, 77.6380]], features: ['Moderate lighting', 'Partial footpath'], timestamp: '2026-06-01T06:00:00Z' },
  ],

  userBadges: [],
  communityReports: [],
  nextId: { walkability: 7, garbage: 6, climate: 6, safety: 6, route: 4, community: 1 }
};

// ─── Firebase Helpers ────────────────────────────────────────────
async function fbGet(collection) {
  if (!usingFirebase) return memStore[collection] || [];
  const snap = await db.collection(collection).orderBy('timestamp', 'desc').limit(100).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fbAdd(collection, data) {
  if (!usingFirebase) {
    const key = collection.replace('Reports', '').replace('Alerts', '').toLowerCase();
    const idKey = key === 'walkabilityreports' ? 'walkability' :
      key === 'garbagereports' ? 'garbage' :
      key === 'climatealerts' ? 'climate' :
      key === 'safetyalerts' ? 'safety' : key;
    const newId = String(memStore.nextId[idKey] || (memStore.nextId[idKey] = 1));
    memStore.nextId[idKey] = (parseInt(newId) + 1);
    const newItem = { id: newId, ...data };
    if (!memStore[collection]) memStore[collection] = [];
    memStore[collection].push(newItem);
    return newItem;
  }
  const ref = await db.collection(collection).add(data);
  return { id: ref.id, ...data };
}

async function fbUpdate(collection, id, data) {
  if (!usingFirebase) {
    const arr = memStore[collection] || [];
    const item = arr.find(x => x.id === id || x.id === String(id));
    if (!item) return null;
    Object.assign(item, data);
    return item;
  }
  await db.collection(collection).doc(id).update(data);
  const doc = await db.collection(collection).doc(id).get();
  return { id: doc.id, ...doc.data() };
}

// ─── API: Dashboard ──────────────────────────────────────────────
app.get('/api/dashboard', async (req, res) => {
  try {
    const [walk, garbage, climate, safety] = await Promise.all([
      fbGet('walkabilityReports'),
      fbGet('garbageReports'),
      fbGet('climateAlerts'),
      fbGet('safetyAlerts')
    ]);

    const avgWalkability = walk.length ? Math.round(walk.reduce((a, b) => a + b.score, 0) / walk.length) : 0;
    const sorted = [...walk].sort((a, b) => b.score - a.score);
    const totalGarbage = garbage.length;
    const unresolved = garbage.filter(r => r.status !== 'Resolved').length;
    const criticalAlerts = climate.filter(a => a.severity === 'Critical').length;
    const totalAssets = climate.reduce((a, b) => a + (b.affectedAssets || 0), 0);
    const activeSafety = safety.filter(s => s.active).length;

    const recent = [
      ...garbage.slice(0, 3).map(r => ({ type: 'garbage', ...r })),
      ...climate.slice(0, 2).map(a => ({ type: 'climate', ...a })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ success: true, data: {
      walkability: { avgScore: avgWalkability, totalReports: walk.length, topArea: sorted[0]?.area, worstArea: sorted[sorted.length - 1]?.area },
      garbage: { totalReports: totalGarbage, unresolved, resolved: totalGarbage - unresolved, bySeverity: { critical: garbage.filter(r => r.severity === 'Critical').length, high: garbage.filter(r => r.severity === 'High').length, medium: garbage.filter(r => r.severity === 'Medium').length, low: garbage.filter(r => r.severity === 'Low').length } },
      climate: { totalAlerts: climate.length, criticalAlerts, totalAffectedAssets: totalAssets, avgRiskScore: climate.length ? Math.round(climate.reduce((a, b) => a + b.riskScore, 0) / climate.length) : 0 },
      safety: { activeSafety },
      recentActivity: recent
    }});
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── API: Walkability ────────────────────────────────────────────
app.get('/api/walkability', async (req, res) => {
  const data = await fbGet('walkabilityReports');
  res.json({ success: true, data });
});

app.post('/api/walkability', async (req, res) => {
  try {
    const { lat, lng, area, score, sidewalkQuality, lighting, greenCover, pedestrianDensity, accessibility, hazards, reporter } = req.body;
    if (!lat || !lng || !area || score === undefined) return res.status(400).json({ success: false, message: 'lat, lng, area, score are required' });
    const xpAwarded = score >= 70 ? 50 : score >= 50 ? 30 : 20;
    const newItem = { lat: parseFloat(lat), lng: parseFloat(lng), area, score: parseInt(score), sidewalkQuality: sidewalkQuality || 'Not Assessed', lighting: lighting || 'Not Assessed', greenCover: greenCover || 'Not Assessed', pedestrianDensity: pedestrianDensity || 'Not Assessed', accessibility: accessibility || 'Unknown', hazards: hazards || [], timestamp: new Date().toISOString(), reporter: reporter || 'Anonymous', xpAwarded };
    const result = await fbAdd('walkabilityReports', newItem);
    res.status(201).json({ success: true, data: result, xpAwarded });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── API: Routes / Route Planner ────────────────────────────────
app.get('/api/routes', async (req, res) => {
  const data = await fbGet('routes');
  if (!usingFirebase && (!data || data.length === 0)) return res.json({ success: true, data: memStore.routes });
  res.json({ success: true, data });
});

app.post('/api/routes', async (req, res) => {
  try {
    const { name, from, to, distance, duration, safetyScore, accessibility, waypoints, features } = req.body;
    if (!name || !from || !to) return res.status(400).json({ success: false, message: 'name, from, to required' });
    const xpAwarded = 40;
    const newRoute = { name, from, to, distance: parseFloat(distance) || 0, duration: parseInt(duration) || 0, safetyScore: parseInt(safetyScore) || 70, accessibility: accessibility === true || accessibility === 'true', waypoints: waypoints || [], features: features || [], timestamp: new Date().toISOString() };
    const result = await fbAdd('routes', newRoute);
    res.status(201).json({ success: true, data: result, xpAwarded });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── API: Safety Alerts ──────────────────────────────────────────
app.get('/api/safety-alerts', async (req, res) => {
  let data = await fbGet('safetyAlerts');
  if (!usingFirebase && (!data || data.length === 0)) data = memStore.safetyAlerts;
  if (req.query.active === 'true') data = data.filter(s => s.active);
  res.json({ success: true, data });
});

app.post('/api/safety-alerts', async (req, res) => {
  try {
    const { lat, lng, area, type, severity, message } = req.body;
    if (!area || !type || !message) return res.status(400).json({ success: false, message: 'area, type, message required' });
    const newAlert = { lat: parseFloat(lat) || 12.9716, lng: parseFloat(lng) || 77.5946, area, type, severity: severity || 'Medium', message, timestamp: new Date().toISOString(), active: true };
    const result = await fbAdd('safetyAlerts', newAlert);
    res.status(201).json({ success: true, data: result, xpAwarded: 25 });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── API: Community Reports ──────────────────────────────────────
app.get('/api/community', async (req, res) => {
  let data = await fbGet('communityReports');
  if (!usingFirebase && (!data || data.length === 0)) data = memStore.communityReports;
  res.json({ success: true, data });
});

app.post('/api/community', async (req, res) => {
  try {
    const { area, lat, lng, type, description, reporter, imageBase64 } = req.body;
    if (!area || !description) return res.status(400).json({ success: false, message: 'area and description are required' });
    const newReport = { area, lat: parseFloat(lat) || 12.9716, lng: parseFloat(lng) || 77.5946, type: type || 'General', description, reporter: reporter || 'Anonymous', imageBase64: imageBase64 || null, votes: 0, status: 'Open', timestamp: new Date().toISOString() };
    const result = await fbAdd('communityReports', newReport);
    res.status(201).json({ success: true, data: result, xpAwarded: 35 });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.patch('/api/community/:id/vote', async (req, res) => {
  try {
    const arr = memStore.communityReports;
    const item = arr.find(x => x.id === req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    item.votes = (item.votes || 0) + 1;
    res.json({ success: true, data: item });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── API: Garbage ────────────────────────────────────────────────
app.get('/api/garbage', async (req, res) => {
  let data = await fbGet('garbageReports');
  if (!usingFirebase && (!data || data.length === 0)) data = memStore.garbageReports;
  if (req.query.status) data = data.filter(r => r.status === req.query.status);
  if (req.query.severity) data = data.filter(r => r.severity === req.query.severity);
  res.json({ success: true, data });
});

app.post('/api/garbage', async (req, res) => {
  try {
    const { lat, lng, area, type, severity, description, ward, reporter } = req.body;
    if (!lat || !lng || !area || !type) return res.status(400).json({ success: false, message: 'lat, lng, area, type required' });
    const newReport = { lat: parseFloat(lat), lng: parseFloat(lng), area, type, severity: severity || 'Medium', status: 'Reported', ward: ward || 'Auto-detect', mla: 'Auto-assigned', mp: 'Auto-assigned', description: description || '', timestamp: new Date().toISOString(), reporter: reporter || 'Anonymous' };
    const result = await fbAdd('garbageReports', newReport);
    res.status(201).json({ success: true, data: result, xpAwarded: 30 });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.patch('/api/garbage/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Reported', 'In Progress', 'Resolved'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const result = await fbUpdate('garbageReports', req.params.id, { status });
    if (!result) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── API: Climate ────────────────────────────────────────────────
app.get('/api/climate', async (req, res) => {
  let data = await fbGet('climateAlerts');
  if (!usingFirebase && (!data || data.length === 0)) data = memStore.climateAlerts;
  if (req.query.type) data = data.filter(a => a.type === req.query.type);
  if (req.query.severity) data = data.filter(a => a.severity === req.query.severity);
  res.json({ success: true, data });
});

app.post('/api/climate', async (req, res) => {
  try {
    const { type, severity, area, lat, lng, description, riskScore, affectedAssets } = req.body;
    if (!type || !area || !lat || !lng) return res.status(400).json({ success: false, message: 'type, area, lat, lng required' });
    const newAlert = { type, severity: severity || 'Medium', area, lat: parseFloat(lat), lng: parseFloat(lng), description: description || '', riskScore: parseInt(riskScore) || 50, mitigationStatus: 'Assessment', affectedAssets: parseInt(affectedAssets) || 0, timestamp: new Date().toISOString() };
    const result = await fbAdd('climateAlerts', newAlert);
    res.status(201).json({ success: true, data: result, xpAwarded: 25 });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── API: Analytics ──────────────────────────────────────────────
app.get('/api/analytics/walkability', async (req, res) => {
  const data = await fbGet('walkabilityReports');
  const reports = usingFirebase ? data : (data.length ? data : memStore.walkabilityReports);
  const areaScores = {};
  reports.forEach(r => {
    if (!areaScores[r.area]) areaScores[r.area] = [];
    areaScores[r.area].push(r.score);
  });
  const analytics = Object.entries(areaScores).map(([area, scores]) => ({
    area, avgScore: Math.round(scores.reduce((a,b) => a+b,0) / scores.length), reportCount: scores.length
  }));
  res.json({ success: true, data: analytics });
});

app.get('/api/analytics/heatmap', async (req, res) => {
  const [walk, safety, garbage] = await Promise.all([
    fbGet('walkabilityReports'),
    fbGet('safetyAlerts'),
    fbGet('garbageReports')
  ]);
  const wData = (usingFirebase ? walk : (walk.length ? walk : memStore.walkabilityReports));
  const sData = (usingFirebase ? safety : (safety.length ? safety : memStore.safetyAlerts));
  const gData = (usingFirebase ? garbage : (garbage.length ? garbage : memStore.garbageReports));

  const heatPoints = [
    ...wData.map(r => ({ lat: r.lat, lng: r.lng, intensity: r.score / 100, type: 'walkability', label: r.area, score: r.score })),
    ...sData.filter(s => s.active).map(s => ({ lat: s.lat, lng: s.lng, intensity: s.severity === 'Critical' ? 1.0 : s.severity === 'High' ? 0.75 : 0.5, type: 'hazard', label: s.area, severity: s.severity })),
    ...gData.map(g => ({ lat: g.lat, lng: g.lng, intensity: g.severity === 'Critical' ? 0.9 : g.severity === 'High' ? 0.7 : 0.4, type: 'waste', label: g.area, severity: g.severity }))
  ];
  res.json({ success: true, data: heatPoints });
});

app.get('/api/analytics/garbage', async (req, res) => {
  const data = await fbGet('garbageReports');
  const reports = usingFirebase ? data : (data.length ? data : memStore.garbageReports);
  const byType = {}, byStatus = {};
  reports.forEach(r => {
    byType[r.type] = (byType[r.type] || 0) + 1;
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  });
  res.json({ success: true, data: { byType, byStatus, total: reports.length } });
});

app.get('/api/analytics/climate', async (req, res) => {
  const data = await fbGet('climateAlerts');
  const alerts = usingFirebase ? data : (data.length ? data : memStore.climateAlerts);
  const byType = {}, bySeverity = {};
  alerts.forEach(a => {
    byType[a.type] = (byType[a.type] || 0) + 1;
    bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
  });
  res.json({ success: true, data: { byType, bySeverity, avgRiskScore: alerts.length ? Math.round(alerts.reduce((a,b) => a+b.riskScore,0)/alerts.length) : 0, totalAffectedAssets: alerts.reduce((a,b) => a+(b.affectedAssets||0),0) } });
});

// ─── API: Gamification / Badges ──────────────────────────────────
const BADGES = [
  { id: 'first_walk', name: 'First Steps', icon: '👟', description: 'Submitted first walkability report', xpRequired: 0 },
  { id: 'safe_10', name: 'Safety Scout', icon: '🛡️', description: 'Reported 10 safety hazards', xpRequired: 100 },
  { id: 'walker_250', name: 'Urban Walker', icon: '🚶', description: 'Earned 250 XP', xpRequired: 250 },
  { id: 'pioneer_500', name: 'Civic Pioneer', icon: '🌟', description: 'Earned 500 XP', xpRequired: 500 },
  { id: 'legend_1000', name: 'Urban Legend', icon: '🏆', description: 'Earned 1000 XP', xpRequired: 1000 },
  { id: 'route_master', name: 'Route Master', icon: '🗺️', description: 'Submitted 5 safe routes', xpRequired: 200 },
  { id: 'community_hero', name: 'Community Hero', icon: '❤️', description: 'Received 20 upvotes on reports', xpRequired: 150 },
];

app.get('/api/badges', (req, res) => {
  res.json({ success: true, data: BADGES });
});

app.get('/api/leaderboard', async (req, res) => {
  // In-memory leaderboard based on xpAwarded sums
  const walk = usingFirebase ? await fbGet('walkabilityReports') : memStore.walkabilityReports;
  const leaderMap = {};
  walk.forEach(r => {
    if (!leaderMap[r.reporter]) leaderMap[r.reporter] = 0;
    leaderMap[r.reporter] += r.xpAwarded || 30;
  });
  const leaderboard = Object.entries(leaderMap)
    .map(([name, xp]) => ({ name, xp }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 10);
  res.json({ success: true, data: leaderboard });
});

// ─── API: Feedback ────────────────────────────────────────────────
app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, message, category } = req.body;
    if (!message || !category) return res.status(400).json({ success: false, message: 'message and category are required' });
    const feedback = { name: name || 'Anonymous', email: email || '', message, category, timestamp: new Date().toISOString() };
    await fbAdd('userFeedback', feedback);
    res.status(201).json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── Health ───────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', firebase: usingFirebase, timestamp: new Date().toISOString() });
});

// ─── Serve Frontend ───────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n  🚶 Urban Pulse Walkability App running on http://localhost:${PORT}`);
    console.log(`  🔥 Firebase: ${usingFirebase ? 'Connected' : 'Using in-memory (set FIREBASE_PROJECT_ID to enable)'}\n`);
  });
}

module.exports = app;
