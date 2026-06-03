const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── In-Memory Data Store ───────────────────────────────────────────────────
const dataStore = {
  walkabilityReports: [],
  garbageReports: [],
  climateAlerts: [],
  userFeedback: []
};

// Seed data
dataStore.walkabilityReports = [
  { id: 1, lat: 12.9716, lng: 77.5946, area: "MG Road", score: 82, sidewalkQuality: "Good", lighting: "Well-lit", greenCover: "Moderate", pedestrianDensity: "High", timestamp: "2026-06-01T10:30:00Z", reporter: "Citizen_01" },
  { id: 2, lat: 12.9352, lng: 77.6245, area: "Koramangala", score: 65, sidewalkQuality: "Fair", lighting: "Moderate", greenCover: "Good", pedestrianDensity: "Medium", timestamp: "2026-06-01T11:00:00Z", reporter: "Citizen_02" },
  { id: 3, lat: 12.9698, lng: 77.7500, area: "Whitefield", score: 45, sidewalkQuality: "Poor", lighting: "Poor", greenCover: "Low", pedestrianDensity: "Low", timestamp: "2026-06-01T12:00:00Z", reporter: "Citizen_03" },
  { id: 4, lat: 12.9767, lng: 77.5713, area: "Malleshwaram", score: 78, sidewalkQuality: "Good", lighting: "Good", greenCover: "Excellent", pedestrianDensity: "High", timestamp: "2026-06-02T09:00:00Z", reporter: "Citizen_04" },
  { id: 5, lat: 12.9850, lng: 77.6050, area: "Rajajinagar", score: 58, sidewalkQuality: "Fair", lighting: "Moderate", greenCover: "Moderate", pedestrianDensity: "Medium", timestamp: "2026-06-02T14:00:00Z", reporter: "Citizen_05" },
  { id: 6, lat: 12.9260, lng: 77.6762, area: "HSR Layout", score: 71, sidewalkQuality: "Good", lighting: "Good", greenCover: "Good", pedestrianDensity: "Medium", timestamp: "2026-06-02T16:00:00Z", reporter: "Citizen_06" },
];

dataStore.garbageReports = [
  { id: 1, lat: 12.9716, lng: 77.5946, area: "MG Road", type: "Mixed Waste", severity: "High", status: "Reported", ward: "Ward 112", mla: "MLA Name A", mp: "MP Name X", imageUrl: null, timestamp: "2026-06-01T08:00:00Z", reporter: "Citizen_01", description: "Large pile of unsorted garbage near bus stop" },
  { id: 2, lat: 12.9352, lng: 77.6245, area: "Koramangala", type: "Plastic", severity: "Medium", status: "In Progress", ward: "Ward 150", mla: "MLA Name B", mp: "MP Name Y", imageUrl: null, timestamp: "2026-06-01T09:30:00Z", reporter: "Citizen_02", description: "Plastic waste scattered along drainage" },
  { id: 3, lat: 12.9850, lng: 77.6050, area: "Rajajinagar", type: "Construction Debris", severity: "Critical", status: "Reported", ward: "Ward 45", mla: "MLA Name C", mp: "MP Name Z", imageUrl: null, timestamp: "2026-06-01T14:00:00Z", reporter: "Citizen_05", description: "Construction debris blocking pedestrian path" },
  { id: 4, lat: 12.9260, lng: 77.6762, area: "HSR Layout", type: "Organic", severity: "Low", status: "Resolved", ward: "Ward 187", mla: "MLA Name D", mp: "MP Name W", imageUrl: null, timestamp: "2026-05-30T10:00:00Z", reporter: "Citizen_06", description: "Food waste near park entrance - cleaned up" },
  { id: 5, lat: 12.9698, lng: 77.7500, area: "Whitefield", type: "E-Waste", severity: "High", status: "Reported", ward: "Ward 83", mla: "MLA Name E", mp: "MP Name V", imageUrl: null, timestamp: "2026-06-02T11:00:00Z", reporter: "Citizen_03", description: "Old electronics dumped near lake" },
];

dataStore.climateAlerts = [
  { id: 1, type: "Flood", severity: "High", area: "Bellandur", lat: 12.9256, lng: 77.6700, description: "Low-lying area prone to urban flooding during monsoon", riskScore: 85, mitigationStatus: "In Progress", affectedAssets: 1200, timestamp: "2026-06-01T06:00:00Z" },
  { id: 2, type: "Heat Wave", severity: "Critical", area: "Whitefield", lat: 12.9698, lng: 77.7500, description: "Urban heat island effect - temperatures 4°C above average", riskScore: 92, mitigationStatus: "Planning", affectedAssets: 3500, timestamp: "2026-06-02T12:00:00Z" },
  { id: 3, type: "Air Quality", severity: "Medium", area: "Peenya Industrial", lat: 13.0305, lng: 77.5190, description: "Industrial emissions exceeding safe levels", riskScore: 68, mitigationStatus: "Monitoring", affectedAssets: 800, timestamp: "2026-06-02T08:00:00Z" },
  { id: 4, type: "Landslide", severity: "High", area: "Nandi Hills", lat: 13.3702, lng: 77.6835, description: "Soil erosion risk due to deforestation and heavy rainfall", riskScore: 78, mitigationStatus: "Assessment", affectedAssets: 450, timestamp: "2026-06-01T15:00:00Z" },
  { id: 5, type: "Water Stress", severity: "Critical", area: "Electronic City", lat: 12.8456, lng: 77.6603, description: "Groundwater depletion - water table dropped 8m in 5 years", riskScore: 95, mitigationStatus: "Emergency", affectedAssets: 5000, timestamp: "2026-06-03T10:00:00Z" },
];

// ─── API ROUTES ─────────────────────────────────────────────────────────────

// Dashboard summary
app.get('/api/dashboard', (req, res) => {
  const avgWalkability = dataStore.walkabilityReports.reduce((a, b) => a + b.score, 0) / dataStore.walkabilityReports.length;
  const totalGarbageReports = dataStore.garbageReports.length;
  const unresolvedGarbage = dataStore.garbageReports.filter(r => r.status !== 'Resolved').length;
  const criticalAlerts = dataStore.climateAlerts.filter(a => a.severity === 'Critical').length;
  const totalAffectedAssets = dataStore.climateAlerts.reduce((a, b) => a + b.affectedAssets, 0);

  res.json({
    success: true,
    data: {
      walkability: {
        avgScore: Math.round(avgWalkability),
        totalReports: dataStore.walkabilityReports.length,
        topArea: dataStore.walkabilityReports.sort((a, b) => b.score - a.score)[0]?.area,
        worstArea: dataStore.walkabilityReports.sort((a, b) => a.score - b.score)[0]?.area
      },
      garbage: {
        totalReports: totalGarbageReports,
        unresolved: unresolvedGarbage,
        resolved: totalGarbageReports - unresolvedGarbage,
        bySeverity: {
          critical: dataStore.garbageReports.filter(r => r.severity === 'Critical').length,
          high: dataStore.garbageReports.filter(r => r.severity === 'High').length,
          medium: dataStore.garbageReports.filter(r => r.severity === 'Medium').length,
          low: dataStore.garbageReports.filter(r => r.severity === 'Low').length,
        }
      },
      climate: {
        totalAlerts: dataStore.climateAlerts.length,
        criticalAlerts,
        totalAffectedAssets,
        avgRiskScore: Math.round(dataStore.climateAlerts.reduce((a, b) => a + b.riskScore, 0) / dataStore.climateAlerts.length)
      },
      recentActivity: [
        ...dataStore.garbageReports.slice(-3).map(r => ({ type: 'garbage', ...r })),
        ...dataStore.climateAlerts.slice(-2).map(a => ({ type: 'climate', ...a })),
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    }
  });
});

// ── Walkability ──
app.get('/api/walkability', (req, res) => {
  res.json({ success: true, data: dataStore.walkabilityReports });
});

app.get('/api/walkability/:id', (req, res) => {
  const report = dataStore.walkabilityReports.find(r => r.id === parseInt(req.params.id));
  if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
  res.json({ success: true, data: report });
});

app.post('/api/walkability', (req, res) => {
  const { lat, lng, area, score, sidewalkQuality, lighting, greenCover, pedestrianDensity, reporter } = req.body;
  if (!lat || !lng || !area || !score) {
    return res.status(400).json({ success: false, message: 'lat, lng, area, and score are required' });
  }
  const newReport = {
    id: dataStore.walkabilityReports.length + 1,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    area,
    score: parseInt(score),
    sidewalkQuality: sidewalkQuality || 'Not Assessed',
    lighting: lighting || 'Not Assessed',
    greenCover: greenCover || 'Not Assessed',
    pedestrianDensity: pedestrianDensity || 'Not Assessed',
    timestamp: new Date().toISOString(),
    reporter: reporter || 'Anonymous'
  };
  dataStore.walkabilityReports.push(newReport);
  res.status(201).json({ success: true, data: newReport });
});

// ── Garbage ──
app.get('/api/garbage', (req, res) => {
  let reports = [...dataStore.garbageReports];
  if (req.query.status) reports = reports.filter(r => r.status === req.query.status);
  if (req.query.severity) reports = reports.filter(r => r.severity === req.query.severity);
  if (req.query.ward) reports = reports.filter(r => r.ward === req.query.ward);
  res.json({ success: true, data: reports });
});

app.get('/api/garbage/:id', (req, res) => {
  const report = dataStore.garbageReports.find(r => r.id === parseInt(req.params.id));
  if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
  res.json({ success: true, data: report });
});

app.post('/api/garbage', (req, res) => {
  const { lat, lng, area, type, severity, description, ward, reporter } = req.body;
  if (!lat || !lng || !area || !type) {
    return res.status(400).json({ success: false, message: 'lat, lng, area, and type are required' });
  }
  const newReport = {
    id: dataStore.garbageReports.length + 1,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    area,
    type,
    severity: severity || 'Medium',
    status: 'Reported',
    ward: ward || 'Auto-detect',
    mla: 'Auto-assigned',
    mp: 'Auto-assigned',
    imageUrl: null,
    timestamp: new Date().toISOString(),
    reporter: reporter || 'Anonymous',
    description: description || ''
  };
  dataStore.garbageReports.push(newReport);
  res.status(201).json({ success: true, data: newReport });
});

app.patch('/api/garbage/:id/status', (req, res) => {
  const report = dataStore.garbageReports.find(r => r.id === parseInt(req.params.id));
  if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
  const { status } = req.body;
  if (!['Reported', 'In Progress', 'Resolved'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  report.status = status;
  res.json({ success: true, data: report });
});

// ── Climate ──
app.get('/api/climate', (req, res) => {
  let alerts = [...dataStore.climateAlerts];
  if (req.query.type) alerts = alerts.filter(a => a.type === req.query.type);
  if (req.query.severity) alerts = alerts.filter(a => a.severity === req.query.severity);
  res.json({ success: true, data: alerts });
});

app.get('/api/climate/:id', (req, res) => {
  const alert = dataStore.climateAlerts.find(a => a.id === parseInt(req.params.id));
  if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
  res.json({ success: true, data: alert });
});

app.post('/api/climate', (req, res) => {
  const { type, severity, area, lat, lng, description, riskScore, affectedAssets } = req.body;
  if (!type || !area || !lat || !lng) {
    return res.status(400).json({ success: false, message: 'type, area, lat, and lng are required' });
  }
  const newAlert = {
    id: dataStore.climateAlerts.length + 1,
    type,
    severity: severity || 'Medium',
    area,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    description: description || '',
    riskScore: parseInt(riskScore) || 50,
    mitigationStatus: 'Assessment',
    affectedAssets: parseInt(affectedAssets) || 0,
    timestamp: new Date().toISOString()
  };
  dataStore.climateAlerts.push(newAlert);
  res.status(201).json({ success: true, data: newAlert });
});

// ── Analytics ──
app.get('/api/analytics/walkability', (req, res) => {
  const areaScores = {};
  dataStore.walkabilityReports.forEach(r => {
    if (!areaScores[r.area]) areaScores[r.area] = [];
    areaScores[r.area].push(r.score);
  });
  const analytics = Object.entries(areaScores).map(([area, scores]) => ({
    area,
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    reportCount: scores.length
  }));
  res.json({ success: true, data: analytics });
});

app.get('/api/analytics/garbage', (req, res) => {
  const byType = {};
  const byStatus = {};
  dataStore.garbageReports.forEach(r => {
    byType[r.type] = (byType[r.type] || 0) + 1;
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  });
  res.json({ success: true, data: { byType, byStatus, total: dataStore.garbageReports.length } });
});

app.get('/api/analytics/climate', (req, res) => {
  const byType = {};
  const bySeverity = {};
  dataStore.climateAlerts.forEach(a => {
    byType[a.type] = (byType[a.type] || 0) + 1;
    bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
  });
  res.json({
    success: true,
    data: {
      byType,
      bySeverity,
      avgRiskScore: Math.round(dataStore.climateAlerts.reduce((a, b) => a + b.riskScore, 0) / dataStore.climateAlerts.length),
      totalAffectedAssets: dataStore.climateAlerts.reduce((a, b) => a + b.affectedAssets, 0)
    }
  });
});

// ── Feedback ──
app.post('/api/feedback', (req, res) => {
  const { name, email, message, category } = req.body;
  if (!message || !category) {
    return res.status(400).json({ success: false, message: 'message and category are required' });
  }
  const feedback = {
    id: dataStore.userFeedback.length + 1,
    name: name || 'Anonymous',
    email: email || '',
    message,
    category,
    timestamp: new Date().toISOString()
  };
  dataStore.userFeedback.push(feedback);
  res.status(201).json({ success: true, data: feedback });
});

// ── Serve Frontend ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  🌍 Urban Pulse Server running on http://localhost:${PORT}\n`);
});
