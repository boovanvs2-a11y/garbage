const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// ─── In-Memory Data Store ───────────────────────────────────────────────────
const dataStore = {
  walkabilityReports: [],
  garbageReports: [],
  climateAlerts: [],
  userFeedback: []
};

// Seed data
dataStore.walkabilityReports = [
  { id: 1, lat: 12.974950, lng: 77.604100, area: "Church Street", score: 92, sidewalkQuality: "Excellent", lighting: "Well-lit", greenCover: "Moderate", pedestrianDensity: "High", timestamp: "2026-06-03T09:12:00Z", reporter: "Deepak S." },
  { id: 2, lat: 12.978250, lng: 77.640620, area: "100ft Road Indiranagar", score: 68, sidewalkQuality: "Fair", lighting: "Moderate", greenCover: "Good", pedestrianDensity: "High", timestamp: "2026-06-03T10:15:00Z", reporter: "Sruthi K." },
  { id: 3, lat: 12.917230, lng: 77.622610, area: "Silk Board Junction", score: 24, sidewalkQuality: "Poor", lighting: "Poor", greenCover: "Low", pedestrianDensity: "High", timestamp: "2026-06-03T11:45:00Z", reporter: "Prasad M." },
  { id: 4, lat: 13.006840, lng: 77.571400, area: "Malleshwaram 8th Cross", score: 75, sidewalkQuality: "Good", lighting: "Good", greenCover: "Excellent", pedestrianDensity: "High", timestamp: "2026-06-02T16:30:00Z", reporter: "Naveen Raj" },
  { id: 5, lat: 12.929870, lng: 77.581560, area: "Jayanagar 4th Block", score: 85, sidewalkQuality: "Good", lighting: "Well-lit", greenCover: "Excellent", pedestrianDensity: "High", timestamp: "2026-06-02T19:00:00Z", reporter: "Anita Y." },
  { id: 6, lat: 12.956920, lng: 77.701130, area: "Marathahalli Bridge", score: 38, sidewalkQuality: "Poor", lighting: "Moderate", greenCover: "Low", pedestrianDensity: "Medium", timestamp: "2026-06-01T08:20:00Z", reporter: "Kiran V." },
];

dataStore.garbageReports = [
  { id: 1, lat: 12.9274, lng: 77.6833, area: "Bellandur Outer Ring Road", type: "Mixed Waste", severity: "High", status: "Reported", ward: "BBMP Ward 150 (Bellandur)", mla: "Aravind Limbavali (Mahadevapura)", mp: "P. C. Mohan (Bangalore Central)", imageUrl: null, timestamp: "2026-06-03T08:00:00Z", reporter: "Sanjay N.", description: "Open garbage dump piling up near the tech park exit" },
  { id: 2, lat: 12.9080, lng: 77.5927, area: "JP Nagar 6th Phase", type: "Plastic", severity: "Medium", status: "In Progress", ward: "BBMP Ward 177 (JP Nagar)", mla: "Ramalinga Reddy (BTM Layout)", mp: "Tejasvi Surya (Bangalore South)", imageUrl: null, timestamp: "2026-06-02T14:30:00Z", reporter: "Citizen_V", description: "Plastic waste accumulating in the stormwater drain" },
  { id: 3, lat: 13.0285, lng: 77.5197, area: "Peenya Industrial Area", type: "Hazardous", severity: "Critical", status: "Reported", ward: "BBMP Ward 41 (Peenya Industrial)", mla: "R. Manjunath (Dasarahalli)", mp: "D. V. Sadananda Gowda (Bangalore North)", imageUrl: null, timestamp: "2026-06-01T11:20:00Z", reporter: "Anand R.", description: "Chemical waste dumping observed near empty plot" },
  { id: 4, lat: 12.9698, lng: 77.7500, area: "Whitefield Main Road", type: "Construction Debris", severity: "High", status: "Resolved", ward: "BBMP Ward 83 (Kadugodi)", mla: "Aravind Limbavali (Mahadevapura)", mp: "P. C. Mohan (Bangalore Central)", imageUrl: null, timestamp: "2026-05-31T09:45:00Z", reporter: "Priya Menon", description: "Construction debris completely blocking the footpath" },
  { id: 5, lat: 12.8794, lng: 77.5855, area: "Arakere Lake Road", type: "Organic", severity: "Low", status: "Reported", ward: "BBMP Ward 193 (Arakere)", mla: "M. Krishnappa (Bangalore South)", mp: "Tejasvi Surya (Bangalore South)", imageUrl: null, timestamp: "2026-06-02T16:15:00Z", reporter: "Arun K.", description: "Vegetable waste dumped near the lake fencing" },
];

dataStore.climateAlerts = [
  { id: 1, type: "Flood", severity: "Critical", area: "Bellandur Lake & Yemalur", lat: 12.9324, lng: 77.6713, description: "High risk of urban flooding at Yemalur corridor due to rajakaluve (stormwater drain) encroachment. ResSolv™ identifies 14 commercial assets at imminent risk during >60mm downpour.", riskScore: 92, mitigationStatus: "Assessment", affectedAssets: 14, timestamp: "2026-06-03T10:30:00Z" },
  { id: 2, type: "Water Stress", severity: "High", area: "Sarjapur Road / Varthur", lat: 12.9406, lng: 77.7466, description: "Groundwater extraction exceeds recharge rate by 310%. Borewells past 1200ft running dry. ResScore™ Environmental pillar flagged as critical.", riskScore: 84, mitigationStatus: "Emergency Planning", affectedAssets: 35000, timestamp: "2026-06-02T08:15:00Z" },
  { id: 3, type: "Air Quality", severity: "Medium", area: "Hebbal Junction", lat: 13.0354, lng: 77.5971, description: "PM2.5 levels exceeding WHO guidelines by 4x due to severe traffic bottlenecking and elevated highway dust entrapment.", riskScore: 68, mitigationStatus: "Monitoring", affectedAssets: 12000, timestamp: "2026-06-01T14:40:00Z" },
  { id: 4, type: "Heat Wave", severity: "High", area: "Electronic City Phase 1", lat: 12.8452, lng: 77.6601, description: "Urban Heat Island (UHI) effect detected. Surface temperatures reaching 43°C. Loss of green cover due to rapid concrete expansion over the last decade.", riskScore: 78, mitigationStatus: "Planning", affectedAssets: 180, timestamp: "2026-06-03T12:00:00Z" },
  { id: 5, type: "Flood", severity: "Medium", area: "Koramangala 4th Block", lat: 12.9345, lng: 77.6266, description: "Vulnerable to moderate waterlogging near Sony World Junction. ResHub™ recommends urgent drain desilting before upcoming monsoon.", riskScore: 65, mitigationStatus: "In Progress", affectedAssets: 45, timestamp: "2026-06-02T09:30:00Z" },
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

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n  🌍 Urban Pulse Server running on http://localhost:${PORT}\n`);
  });
}

// Export the Express API
module.exports = app;
