/* ═══════════════════════════════════════════════════
   URBAN PULSE — Walkability App  (app.js)
   Chitragupta · NammaKasa · Resilience360 · Firebase
   ═══════════════════════════════════════════════════ */

const API = 'http://localhost:3000';
let userXP = parseInt(localStorage.getItem('urbanpulse_xp') || '0');
let userLocation = null;
let heatmapMap = null, routeMap = null, safetyMap = null;
let routeLayer = null;

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initLiveClock();
  initForms();
  initRangeSliders();
  initScrollEffects();
  updateXPDisplay();
  loadDashboard();
  loadWalkabilityReports();
  loadGarbageReports();
  loadClimateAlerts();
  loadSafetyAlerts();
  loadCommunityReports();
  loadRoutes();
  loadBadges();
  loadLeaderboard();
  checkFirebaseHealth();
  setTimeout(initHeatmap, 800);
  tryAutoLocation();
});

/* ── Navigation ── */
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const toggle = document.getElementById('nav-toggle');
  const linksContainer = document.getElementById('nav-links');

  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const sectionId = link.dataset.section;
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      document.querySelectorAll('.section').forEach(s => s.classList.remove('section-active'));
      const target = document.getElementById(`section-${sectionId}`);
      if (target) { target.classList.add('section-active'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      linksContainer.classList.remove('open');
      // Lazy-init maps when section is shown
      if (sectionId === 'dashboard' && !heatmapMap) setTimeout(initHeatmap, 300);
      if (sectionId === 'route-planner' && !routeMap) setTimeout(initRoutePlannerMap, 300);
      if (sectionId === 'safety' && !safetyMap) setTimeout(initSafetyMap, 300);
      
      // Force map size refresh when container becomes visible
      setTimeout(() => {
        if (heatmapMap) heatmapMap.invalidateSize();
        if (routeMap) routeMap.invalidateSize();
        if (safetyMap) safetyMap.invalidateSize();
      }, 350);
    });
  });

  toggle.addEventListener('click', () => linksContainer.classList.toggle('open'));

  document.querySelectorAll('.btn-hero').forEach(btn => {
    btn.addEventListener('click', () => {
      const link = document.querySelector(`[data-section="${btn.dataset.target}"]`);
      if (link) link.click();
    });
  });
}

function initLiveClock() {
  const el = document.getElementById('live-time');
  if (!el) return;
  setInterval(() => { el.textContent = new Date().toLocaleTimeString('en-IN'); }, 1000);
}

function initScrollEffects() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 20));
}

/* ── XP / Gamification ── */
function addXP(amount, reason = '') {
  userXP += amount;
  localStorage.setItem('urbanpulse_xp', userXP);
  updateXPDisplay();
  showToast(`+${amount} XP earned! ${reason}`, 'success');
  checkBadgeUnlocks();
}

function updateXPDisplay() {
  document.querySelectorAll('#civic-xp-val, #xp-total-display').forEach(el => { if (el) el.textContent = userXP.toLocaleString(); });
  const fill = document.getElementById('xp-bar-fill');
  const nextLabel = document.getElementById('xp-next-label');
  if (!fill) return;
  const milestones = [100, 250, 500, 1000];
  const next = milestones.find(m => m > userXP) || 1000;
  const prev = milestones[milestones.indexOf(next) - 1] || 0;
  const pct = Math.min(100, ((userXP - prev) / (next - prev)) * 100);
  fill.style.width = pct + '%';
  if (nextLabel) nextLabel.textContent = userXP >= 1000 ? 'Urban Legend! 🏆' : `Next badge at ${next} XP`;
}

const BADGE_DEFS = [
  { id: 'first_walk', name: 'First Steps', icon: '👟', xp: 0 },
  { id: 'walker_100', name: 'Urban Walker', icon: '🚶', xp: 100 },
  { id: 'pioneer_250', name: 'Civic Pioneer', icon: '🌟', xp: 250 },
  { id: 'hero_500', name: 'Safety Hero', icon: '🛡️', xp: 500 },
  { id: 'legend_1000', name: 'Urban Legend', icon: '🏆', xp: 1000 },
];

function checkBadgeUnlocks() {
  const earned = JSON.parse(localStorage.getItem('urbanpulse_badges') || '[]');
  BADGE_DEFS.forEach(b => {
    if (!earned.includes(b.id) && userXP >= b.xp) {
      earned.push(b.id);
      showToast(`🎖️ Badge unlocked: ${b.icon} ${b.name}!`, 'info');
    }
  });
  localStorage.setItem('urbanpulse_badges', JSON.stringify(earned));
  renderBadges();
}

async function loadBadges() {
  renderBadges();
}

function renderBadges() {
  const grid = document.getElementById('badges-grid');
  if (!grid) return;
  const earned = JSON.parse(localStorage.getItem('urbanpulse_badges') || '[]');
  if (userXP > 0 && !earned.includes('first_walk')) { earned.push('first_walk'); localStorage.setItem('urbanpulse_badges', JSON.stringify(earned)); }
  grid.innerHTML = BADGE_DEFS.map(b => {
    const has = earned.includes(b.id);
    return `<div class="badge-item ${has ? 'earned' : 'locked'}" title="${b.name} (${b.xp} XP)">
      <span class="badge-icon">${b.icon}</span>
      <span class="badge-name">${b.name}</span>
      ${has ? '' : `<span class="badge-req">${b.xp} XP</span>`}
    </div>`;
  }).join('');
}

async function loadLeaderboard() {
  const res = await apiGet('/api/leaderboard');
  const list = document.getElementById('leaderboard-list');
  if (!list || !res?.success) return;
  const medals = ['🥇', '🥈', '🥉'];
  list.innerHTML = res.data.map((u, i) => `
    <div class="activity-item">
      <div class="activity-dot walk"></div>
      <div class="activity-text"><strong>${medals[i] || (i + 1) + '.'} ${u.name}</strong></div>
      <span class="activity-time">${u.xp} XP</span>
    </div>`).join('');
}

/* ── Toast ── */
function showToast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  const icons = { success: 'fa-check', error: 'fa-times', info: 'fa-info' };
  t.innerHTML = `<div class="toast-icon"><i class="fas ${icons[type] || 'fa-info'}"></i></div><div class="toast-message">${msg}</div>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 300); }, 3500);
}

/* ── API Helpers ── */
async function apiGet(ep) {
  try { const r = await fetch(API + ep); return await r.json(); }
  catch (e) { console.error('GET', ep, e); return null; }
}
async function apiPost(ep, data) {
  try {
    const r = await fetch(API + ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return await r.json();
  } catch (e) { console.error('POST', ep, e); return null; }
}

/* ── Firebase Health ── */
async function checkFirebaseHealth() {
  const res = await apiGet('/api/health');
  const el = document.getElementById('firebase-status-text');
  if (!el) return;
  if (res?.firebase) { el.textContent = 'Firebase Connected'; document.getElementById('firebase-hud').style.color = '#10b981'; }
  else { el.textContent = 'In-Memory Mode'; }
}

/* ── GPS ── */
function tryAutoLocation() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(pos => {
    userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    const el = document.getElementById('gps-status');
    if (el) el.textContent = `📍 ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`;
  }, () => {});
}
window.getUserLocation = function() {
  if (!navigator.geolocation) { showToast('Geolocation not supported', 'error'); return; }
  const btn = document.getElementById('btn-get-location');
  if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Locating...';
  navigator.geolocation.getCurrentPosition(pos => {
    userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    const el = document.getElementById('gps-status');
    if (el) el.textContent = `📍 ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`;
    if (btn) btn.innerHTML = '<i class="fas fa-check"></i> Location Found';
    showToast('GPS location acquired!', 'success');
    if (routeMap) routeMap.setView([userLocation.lat, userLocation.lng], 14);
  }, () => { showToast('Could not get location', 'error'); if (btn) btn.innerHTML = '<i class="fas fa-crosshairs"></i> Use My Location'; });
};
window.fillGPSWalk = function() { if (userLocation) { document.getElementById('walk-lat').value = userLocation.lat; document.getElementById('walk-lng').value = userLocation.lng; showToast('GPS coordinates filled!', 'info'); } else { getUserLocation(); } };
window.fillGPSSafety = function() { if (userLocation) { document.getElementById('safe-lat').value = userLocation.lat; document.getElementById('safe-lng').value = userLocation.lng; showToast('GPS coordinates filled!', 'info'); } else { getUserLocation(); } };
window.fillGPSCommunity = function() { if (userLocation) { document.getElementById('comm-lat').value = userLocation.lat; document.getElementById('comm-lng').value = userLocation.lng; showToast('GPS coordinates filled!', 'info'); } else { getUserLocation(); } };

/* ── Dashboard ── */
async function loadDashboard() {
  const res = await apiGet('/api/dashboard');
  if (!res?.success) return;
  const d = res.data;
  animateValue('kpi-walk-score', 0, d.walkability.avgScore, 1200);
  document.getElementById('kpi-walk-sub').textContent = `Best: ${d.walkability.topArea || 'N/A'} · Worst: ${d.walkability.worstArea || 'N/A'}`;
  animateValue('kpi-safety-total', 0, d.safety?.activeSafety || 5, 800);
  document.getElementById('kpi-safety-sub').textContent = 'Active pedestrian hazard alerts';
  animateValue('kpi-waste-total', 0, d.garbage.totalReports, 1000);
  document.getElementById('kpi-waste-sub').textContent = `${d.garbage.unresolved} unresolved · ${d.garbage.resolved} resolved`;
  animateValue('kpi-climate-total', 0, d.climate.totalAlerts, 1000);
  document.getElementById('kpi-climate-sub').textContent = `${d.climate.criticalAlerts} critical · Avg risk: ${d.climate.avgRiskScore}`;
  animateValue('hero-stat-areas', 0, d.walkability.totalReports, 1200);
  animateValue('hero-stat-events', 0, d.climate.totalAlerts, 1000);
  animateValue('hero-stat-risk', 0, d.climate.avgRiskScore, 1400);
  animateValue('hero-stat-safety', 0, d.safety?.activeSafety || 5, 800);
  renderActivityFeed(d.recentActivity);
  const ac = document.getElementById('activity-count');
  if (ac) ac.textContent = `${d.recentActivity.length} events`;
  loadCharts();
}

function animateValue(id, start, end, dur, commas = false) {
  const el = document.getElementById(id);
  if (!el) return;
  const t0 = performance.now();
  function step(t) {
    const p = Math.min((t - t0) / dur, 1);
    const v = Math.round(start + (end - start) * (1 - Math.pow(1 - p, 3)));
    el.textContent = commas ? v.toLocaleString() : v;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function renderActivityFeed(acts) {
  const list = document.getElementById('activity-list');
  if (!list || !acts) return;
  list.innerHTML = acts.map(a => `
    <div class="activity-item">
      <div class="activity-dot ${a.type}"></div>
      <div class="activity-text"><strong>${a.type === 'garbage' ? 'Waste' : 'Climate'}</strong> — ${a.area || a.description?.slice(0, 50) || ''}
        ${a.severity ? `<span class="status-badge severity-${a.severity.toLowerCase()}">${a.severity}</span>` : ''}
      </div>
      <span class="activity-time">${getTimeAgo(a.timestamp)}</span>
    </div>`).join('');
}

function getTimeAgo(ts) {
  const m = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

/* ── Charts ── */
async function loadCharts() {
  const [wk, wa, cl] = await Promise.all([apiGet('/api/analytics/walkability'), apiGet('/api/analytics/garbage'), apiGet('/api/analytics/climate')]);
  if (wk?.success) drawBarChart('canvas-walkability', wk.data);
  if (wa?.success) drawDonutChart('canvas-waste', wa.data.byType);
  if (cl?.success) drawHorizBars('canvas-climate', cl.data);
}

function drawBarChart(id, data) {
  const canvas = document.getElementById(id);
  if (!canvas || !data?.length) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);
  const W = canvas.offsetWidth, H = canvas.offsetHeight;
  const pad = { t: 20, r: 20, b: 40, l: 50 };
  const cW = W - pad.l - pad.r, cH = H - pad.t - pad.b;
  ctx.clearRect(0, 0, W, H);
  const bW = Math.min(40, (cW / data.length) * 0.6);
  const gap = (cW - bW * data.length) / (data.length + 1);
  const colors = ['#10b981','#6366f1','#f59e0b','#ef4444','#8b5cf6','#38bdf8'];
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (cH / 4) * i;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = '#64748b'; ctx.font = '11px monospace'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(100 - (100 / 4) * i), pad.l - 8, y + 4);
  }
  data.forEach((item, i) => {
    const x = pad.l + gap + i * (bW + gap);
    const bH = (item.avgScore / 100) * cH;
    const y = pad.t + cH - bH;
    const g = ctx.createLinearGradient(x, y, x, pad.t + cH);
    const c = colors[i % colors.length]; g.addColorStop(0, c); g.addColorStop(1, c + '88');
    ctx.shadowColor = c; ctx.shadowBlur = 10;
    ctx.fillStyle = g; ctx.beginPath(); rrect(ctx, x, y, bW, bH, 5); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
    ctx.fillText(item.avgScore, x + bW / 2, y - 6);
    ctx.fillStyle = '#94a3b8'; ctx.font = '9px sans-serif';
    const lbl = item.area.length > 9 ? item.area.slice(0, 8) + '…' : item.area;
    ctx.fillText(lbl, x + bW / 2, pad.t + cH + 16);
  });
  ctx.fillStyle = 'rgba(255,214,0,0.15)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
  ctx.fillText('Chitragupta', W - pad.r, H - 4);
}

function drawDonutChart(id, data) {
  const canvas = document.getElementById(id);
  if (!canvas || !data) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);
  const W = canvas.offsetWidth, H = canvas.offsetHeight;
  ctx.clearRect(0, 0, W, H);
  const entries = Object.entries(data);
  if (!entries.length) return;
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const cx = W * 0.35, cy = H / 2, oR = Math.min(cx, cy) - 20, iR = oR * 0.6;
  const colors = ['#f59e0b','#6366f1','#10b981','#ef4444','#8b5cf6','#38bdf8'];
  let angle = -Math.PI / 2;
  entries.forEach(([, v], i) => {
    const sa = angle, ea = angle + (v / total) * Math.PI * 2;
    const c = colors[i % colors.length];
    ctx.beginPath(); ctx.arc(cx, cy, oR, sa, ea); ctx.arc(cx, cy, iR, ea, sa, true); ctx.closePath();
    ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0;
    angle = ea;
  });
  ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(total, cx, cy - 6);
  ctx.fillStyle = '#94a3b8'; ctx.font = '10px sans-serif'; ctx.fillText('Total', cx, cy + 14);
  let ly = 28; const lx = W * 0.65;
  entries.slice(0, 5).forEach(([k, v], i) => {
    const c = colors[i % colors.length];
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(lx, ly + 5, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f1f5f9'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(k, lx + 12, ly + 9);
    ctx.fillStyle = '#64748b'; ctx.font = '10px monospace';
    ctx.fillText(`${v} (${Math.round(v / total * 100)}%)`, lx + 12, ly + 22);
    ly += 40;
  });
}

function drawHorizBars(id, data) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);
  const W = canvas.offsetWidth, H = canvas.offsetHeight;
  ctx.clearRect(0, 0, W, H);
  const entries = Object.entries(data.bySeverity || {});
  if (!entries.length) return;
  const pad = { t: 20, r: 20, b: 20, l: 90 };
  const cW = W - pad.l - pad.r;
  const bH = 26, gap = 14;
  const maxV = Math.max(...entries.map(([, v]) => v));
  const sc = { Critical: '#ef4444', High: '#f59e0b', Medium: '#6366f1', Low: '#10b981' };
  entries.forEach(([k, v], i) => {
    const y = pad.t + i * (bH + gap);
    const bW = (v / Math.max(maxV, 1)) * cW;
    const c = sc[k] || '#6366f1';
    ctx.fillStyle = '#94a3b8'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(k, pad.l - 10, y + bH / 2 + 4);
    const g = ctx.createLinearGradient(pad.l, y, pad.l + bW, y);
    g.addColorStop(0, c); g.addColorStop(1, c + '77');
    ctx.fillStyle = g; ctx.shadowColor = c; ctx.shadowBlur = 6;
    ctx.beginPath(); rrect(ctx, pad.l, y, Math.max(bW, 8), bH, 6); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'left';
    ctx.fillText(v, pad.l + bW + 8, y + bH / 2 + 5);
  });
  ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif'; ctx.textAlign = 'left';
  if (data.avgRiskScore) ctx.fillText(`ResSolv™ Avg Risk: ${data.avgRiskScore}`, pad.l, H - 10);
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

/* ── Heatmap / Dashboard Map ── */
function initHeatmap() {
  const el = document.getElementById('heatmap-container');
  if (!el || heatmapMap) return;
  heatmapMap = L.map('heatmap-container', { zoomControl: true, scrollWheelZoom: false }).setView([12.9716, 77.5946], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 18 }).addTo(heatmapMap);
  loadHeatmapData();
}

async function loadHeatmapData() {
  if (!heatmapMap) return;
  const res = await apiGet('/api/analytics/heatmap');
  if (!res?.success) return;
  res.data.forEach(p => {
    const color = p.type === 'walkability' ? (p.intensity > 0.7 ? '#10b981' : p.intensity > 0.5 ? '#f59e0b' : '#ef4444')
      : p.type === 'hazard' ? '#ef4444' : '#f59e0b';
    const radius = p.type === 'walkability' ? 18 : 12;
    L.circleMarker([p.lat, p.lng], { radius, color, fillColor: color, fillOpacity: 0.7 * p.intensity + 0.2, weight: 1 })
      .bindPopup(`<b>${p.label}</b><br>Type: ${p.type}<br>${p.score ? 'Score: ' + p.score : 'Severity: ' + (p.severity || 'N/A')}`)
      .addTo(heatmapMap);
  });
}

/* ── Route Planner Map ── */
function initRoutePlannerMap() {
  const el = document.getElementById('route-map');
  if (!el || routeMap) return;
  const center = userLocation ? [userLocation.lat, userLocation.lng] : [12.9716, 77.5946];
  routeMap = L.map('route-map', { zoomControl: true }).setView(center, 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 18 }).addTo(routeMap);
  // Add existing routes
  loadRouteMarkers();
}

async function loadRouteMarkers() {
  if (!routeMap) return;
  const res = await apiGet('/api/routes');
  if (!res?.success) return;
  res.data.forEach(r => {
    if (r.waypoints?.length) {
      const color = r.safetyScore >= 80 ? '#10b981' : r.safetyScore >= 60 ? '#f59e0b' : '#ef4444';
      L.polyline(r.waypoints, { color, weight: 4, opacity: 0.8 }).addTo(routeMap)
        .bindPopup(`<b>${r.name}</b><br>Safety: ${r.safetyScore}/100<br>${r.distance}km · ${r.duration}min<br>${r.accessibility ? '♿ Accessible' : ''}`);
      if (r.waypoints[0]) L.marker(r.waypoints[0], { icon: createIcon('🟢') }).addTo(routeMap).bindPopup(`Start: ${r.from}`);
      if (r.waypoints[r.waypoints.length - 1]) L.marker(r.waypoints[r.waypoints.length - 1], { icon: createIcon('🔴') }).addTo(routeMap).bindPopup(`End: ${r.to}`);
    }
  });
}

function createIcon(emoji) {
  return L.divIcon({ html: `<span style="font-size:20px">${emoji}</span>`, className: '', iconSize: [24, 24] });
}

/* ── Route Planning ── */
window.planRoute = async function() {
  const from = document.getElementById('route-from').value.trim();
  const to = document.getElementById('route-to').value.trim();
  if (!from || !to) { showToast('Please enter From and To locations', 'error'); return; }
  const accessible = document.getElementById('pref-accessible').checked;
  const safe = document.getElementById('pref-safe').checked;
  const lit = document.getElementById('pref-lit').checked;

  showToast('Finding safest routes...', 'info');
  const res = await apiGet('/api/routes');
  const allRoutes = res?.data || [];

  // Score routes by preferences
  let scored = allRoutes.map(r => ({
    ...r,
    matchScore: (r.safetyScore || 0) + (accessible && r.accessibility ? 20 : 0) + (lit && r.features?.includes('Well-lit') ? 15 : 0)
  })).sort((a, b) => b.matchScore - a.matchScore);

  const resultsDiv = document.getElementById('route-results');
  const listDiv = document.getElementById('route-list');
  resultsDiv.style.display = 'block';

  if (!scored.length) {
    listDiv.innerHTML = '<p style="color:#94a3b8;padding:16px">No saved routes found. Be the first to share one!</p>';
    return;
  }

  listDiv.innerHTML = scored.slice(0, 5).map((r, i) => {
    const sColor = r.safetyScore >= 80 ? '#10b981' : r.safetyScore >= 60 ? '#f59e0b' : '#ef4444';
    return `<div class="route-result-item" onclick="showRouteOnMap(${JSON.stringify(r).replace(/"/g, '&quot;')})">
      <div class="route-result-header">
        <span class="route-rank">#${i + 1}</span>
        <span class="route-name">${r.name}</span>
        <span class="route-score" style="color:${sColor}">${r.safetyScore}/100</span>
      </div>
      <div class="route-result-meta">
        <span><i class="fas fa-ruler"></i> ${r.distance}km</span>
        <span><i class="fas fa-clock"></i> ${r.duration}min</span>
        ${r.accessibility ? '<span><i class="fas fa-wheelchair"></i> Accessible</span>' : ''}
      </div>
      <div class="route-result-tags">${(r.features || []).slice(0, 3).map(f => `<span class="meta-tag">${f}</span>`).join('')}</div>
    </div>`;
  }).join('');
};

window.showRouteOnMap = function(route) {
  if (!routeMap || !route.waypoints?.length) return;
  if (routeLayer) routeMap.removeLayer(routeLayer);
  const color = route.safetyScore >= 80 ? '#10b981' : route.safetyScore >= 60 ? '#f59e0b' : '#ef4444';
  routeLayer = L.polyline(route.waypoints, { color, weight: 6, opacity: 0.9 }).addTo(routeMap);
  routeMap.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });
  const ov = document.getElementById('route-info-overlay');
  const oc = document.getElementById('route-info-content');
  if (ov && oc) {
    ov.style.display = 'block';
    oc.innerHTML = `<strong>${route.name}</strong> · ${route.distance}km · ${route.duration}min · Safety: ${route.safetyScore}/100`;
  }
};

/* ── Routes List ── */
async function loadRoutes() {
  const res = await apiGet('/api/routes');
  const grid = document.getElementById('routes-grid');
  if (!grid || !res?.success) return;
  if (!res.data.length) { grid.innerHTML = '<p style="color:#94a3b8;padding:24px">No routes yet. Be the first to share a safe walking route!</p>'; return; }
  grid.innerHTML = res.data.map(r => {
    const sColor = r.safetyScore >= 80 ? '#10b981' : r.safetyScore >= 60 ? '#f59e0b' : '#ef4444';
    return `<div class="route-card glass-card">
      <div class="route-card-header">
        <span class="route-card-name">${r.name}</span>
        <span class="route-card-score" style="color:${sColor}">${r.safetyScore}<small>/100</small></span>
      </div>
      <div class="route-card-path"><i class="fas fa-map-pin" style="color:#10b981"></i> ${r.from}<i class="fas fa-arrow-right" style="margin:0 8px;color:#64748b"></i><i class="fas fa-flag" style="color:#ef4444"></i> ${r.to}</div>
      <div class="route-card-meta">
        <span><i class="fas fa-ruler"></i> ${r.distance}km</span>
        <span><i class="fas fa-clock"></i> ${r.duration}min</span>
        ${r.accessibility ? '<span><i class="fas fa-wheelchair"></i> Accessible</span>' : ''}
      </div>
      <div class="route-card-tags">${(r.features || []).slice(0, 3).map(f => `<span class="tag">${f}</span>`).join('')}</div>
    </div>`;
  }).join('');
}

/* ── Safety Map ── */
function initSafetyMap() {
  const el = document.getElementById('safety-map');
  if (!el || safetyMap) return;
  safetyMap = L.map('safety-map', { zoomControl: true, scrollWheelZoom: false }).setView([12.9716, 77.5946], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 18 }).addTo(safetyMap);
  plotSafetyAlerts();
}

async function plotSafetyAlerts() {
  if (!safetyMap) return;
  const res = await apiGet('/api/safety-alerts?active=true');
  if (!res?.success) return;
  const colors = { Critical: '#ef4444', High: '#f59e0b', Medium: '#6366f1', Low: '#10b981' };
  res.data.forEach(a => {
    const c = colors[a.severity] || '#6366f1';
    L.circleMarker([a.lat, a.lng], { radius: 14, color: c, fillColor: c, fillOpacity: 0.5, weight: 2 })
      .bindPopup(`<b>⚠️ ${a.type}</b><br><b>${a.area}</b><br>${a.message}<br><small>Severity: ${a.severity}</small>`)
      .addTo(safetyMap);
  });
}

/* ── Safety Alerts ── */
async function loadSafetyAlerts() {
  const res = await apiGet('/api/safety-alerts?active=true');
  if (!res?.success) return;
  const alerts = res.data;
  const list = document.getElementById('safety-list');
  const count = document.getElementById('safety-count');
  if (count) count.textContent = `${alerts.length}`;

  let critical = 0, high = 0, medium = 0;
  alerts.forEach(a => { if (a.severity === 'Critical') critical++; else if (a.severity === 'High') high++; else if (a.severity === 'Medium') medium++; });
  const ec = document.getElementById('s-critical'), eh = document.getElementById('s-high'), em = document.getElementById('s-medium'), ea = document.getElementById('s-active');
  if (ec) ec.textContent = critical; if (eh) eh.textContent = high; if (em) em.textContent = medium; if (ea) ea.textContent = alerts.length;

  if (critical > 0) {
    const banner = document.getElementById('safety-banner');
    const text = document.getElementById('safety-banner-text');
    if (banner && text) { text.textContent = `⚠️ ${critical} critical safety alert${critical > 1 ? 's' : ''} active in Bengaluru! Stay cautious.`; banner.style.display = 'block'; }
  }

  if (!list) return;
  const typeIcons = { 'Heavy Traffic': '🚗', 'Poor Lighting': '💡', 'Construction': '🔨', 'Waterlogging': '💧', 'Event': '🎪', 'Missing Footpath': '🚧', 'Stray Animals': '🐕', 'Other': '⚠️' };
  list.innerHTML = alerts.map(a => `
    <div class="report-item alert-item-${a.severity.toLowerCase()}">
      <div class="report-item-header">
        <span class="report-item-area">${typeIcons[a.type] || '⚠️'} ${a.area}</span>
        <span class="status-badge severity-${a.severity.toLowerCase()}">${a.severity}</span>
      </div>
      <div class="alert-msg">${a.message}</div>
      <div class="report-item-meta">
        <span class="meta-tag">🏷️ ${a.type}</span>
        <span class="meta-tag">🕒 ${getTimeAgo(a.timestamp)}</span>
        ${a.active ? '<span class="meta-tag live-tag">● LIVE</span>' : ''}
      </div>
    </div>`).join('');
  plotSafetyAlerts();
}

/* ── Walkability ── */
async function loadWalkabilityReports() {
  const res = await apiGet('/api/walkability');
  if (!res?.success) return;
  renderWalkabilityList(res.data);
  const c = document.getElementById('walk-count'); if (c) c.textContent = res.data.length;
}

function renderWalkabilityList(reports) {
  const list = document.getElementById('walkability-list');
  if (!list) return;
  list.innerHTML = reports.map(r => {
    const cls = r.score >= 70 ? 'score-high' : r.score >= 50 ? 'score-medium' : 'score-low';
    const hazardHtml = r.hazards?.length ? `<div class="report-item-meta"><span class="meta-tag" style="color:#f59e0b">⚠️ ${r.hazards.join(' · ')}</span></div>` : '';
    return `<div class="report-item">
      <div class="report-item-header">
        <span class="report-item-area">${r.area}</span>
        <span class="report-item-score ${cls}">${r.score}/100</span>
      </div>
      <div class="report-item-meta">
        <span class="meta-tag">🛤️ ${r.sidewalkQuality}</span>
        <span class="meta-tag">💡 ${r.lighting}</span>
        <span class="meta-tag">🌿 ${r.greenCover}</span>
        <span class="meta-tag">♿ ${r.accessibility || 'N/A'}</span>
      </div>
      ${hazardHtml}
      <div class="report-item-meta" style="margin-top:4px">
        <span class="meta-tag">📍 ${r.lat?.toFixed(4)}, ${r.lng?.toFixed(4)}</span>
        <span class="meta-tag">👤 ${r.reporter}</span>
      </div>
    </div>`;
  }).join('');
}

/* ── Community ── */
async function loadCommunityReports() {
  const res = await apiGet('/api/community');
  if (!res?.success) return;
  renderCommunityList(res.data);
  const c = document.getElementById('comm-count'); if (c) c.textContent = res.data.length;
}

function renderCommunityList(reports) {
  const list = document.getElementById('community-list');
  if (!list) return;
  if (!reports.length) { list.innerHTML = '<p style="color:#94a3b8;padding:16px">No community reports yet. Be the first to report!</p>'; return; }
  list.innerHTML = reports.map(r => `
    <div class="report-item">
      <div class="report-item-header">
        <span class="report-item-area">📍 ${r.area}</span>
        <span class="status-badge status-${r.status?.toLowerCase().replace(' ', '-') || 'open'}">${r.status || 'Open'}</span>
      </div>
      <div class="report-item-meta"><span class="meta-tag">🏷️ ${r.type}</span><span class="meta-tag">👤 ${r.reporter}</span><span class="meta-tag">🕒 ${getTimeAgo(r.timestamp)}</span></div>
      <div class="report-item-desc">${r.description}</div>
      <div class="report-item-meta" style="margin-top:6px">
        <button class="btn-vote" onclick="voteReport('${r.id}', this)"><i class="fas fa-thumbs-up"></i> ${r.votes || 0} Upvotes</button>
      </div>
    </div>`).join('');
}

window.voteReport = async function(id, btn) {
  const res = await fetch(`/api/community/${id}/vote`, { method: 'PATCH' });
  if (res.ok) { const d = await res.json(); if (btn) btn.innerHTML = `<i class="fas fa-thumbs-up"></i> ${d.data.votes} Upvotes`; }
};

/* ── Garbage ── */
async function loadGarbageReports(filters = {}) {
  let ep = '/api/garbage';
  const p = new URLSearchParams();
  if (filters.status) p.set('status', filters.status);
  if (filters.severity) p.set('severity', filters.severity);
  if (p.toString()) ep += '?' + p;
  const res = await apiGet(ep);
  if (!res?.success) return;
  const list = document.getElementById('garbage-list');
  const c = document.getElementById('garb-count');
  if (c) c.textContent = res.data.length;
  if (!list) return;
  list.innerHTML = res.data.map(r => `
    <div class="report-item">
      <div class="report-item-header">
        <span class="report-item-area">${r.area}</span>
        <span class="status-badge status-${r.status.toLowerCase().replace(' ', '-')}">${r.status}</span>
      </div>
      <div class="report-item-meta">
        <span class="status-badge severity-${r.severity.toLowerCase()}">${r.severity}</span>
        <span class="meta-tag">🗑️ ${r.type}</span>
        <span class="meta-tag">🏛️ ${r.ward}</span>
      </div>
      ${r.mla && r.mla !== 'Auto-assigned' ? `<div class="report-item-meta"><span class="meta-tag">👤 MLA: ${r.mla}</span></div>` : ''}
      ${r.description ? `<div class="report-item-desc">${r.description}</div>` : ''}
    </div>`).join('');
}

/* ── Climate ── */
async function loadClimateAlerts() {
  const [alertsRes, analyticsRes] = await Promise.all([apiGet('/api/climate'), apiGet('/api/analytics/climate')]);
  if (alertsRes?.success) renderClimateGrid(alertsRes.data);
  if (analyticsRes?.success) {
    const d = analyticsRes.data;
    const rv = document.getElementById('stat-risk-val'), cv = document.getElementById('stat-critical-val'), av = document.getElementById('stat-assets-val');
    if (rv) rv.textContent = d.avgRiskScore;
    if (cv) cv.textContent = d.bySeverity?.Critical || 0;
    if (av) av.textContent = (d.totalAffectedAssets || 0).toLocaleString();
  }
}

function renderClimateGrid(alerts) {
  const grid = document.getElementById('climate-grid');
  if (!grid) return;
  const icons = { Flood: 'fa-water', 'Heat Wave': 'fa-fire', 'Air Quality': 'fa-smog', Landslide: 'fa-mountain', 'Water Stress': 'fa-tint', Storm: 'fa-bolt', Drought: 'fa-sun' };
  grid.innerHTML = alerts.map(a => `
    <div class="climate-alert-card alert-${a.severity}">
      <div class="alert-card-header">
        <div class="alert-type"><div class="alert-type-icon"><i class="fas ${icons[a.type] || 'fa-exclamation'}"></i></div> ${a.type}</div>
        <span class="status-badge severity-${a.severity.toLowerCase()}">${a.severity}</span>
      </div>
      <div class="alert-area"><i class="fas fa-map-marker-alt"></i> ${a.area}</div>
      <div class="alert-desc">${a.description}</div>
      <div class="alert-stats">
        <div class="alert-stat"><span class="alert-stat-label">ResSolv™ Risk</span><span class="alert-stat-value" style="color:${a.riskScore>=80?'#ef4444':a.riskScore>=60?'#f59e0b':'#10b981'}">${a.riskScore}</span></div>
        <div class="alert-stat"><span class="alert-stat-label">Assets</span><span class="alert-stat-value">${(a.affectedAssets||0).toLocaleString()}</span></div>
        <div class="alert-stat"><span class="alert-stat-label">Status</span><span class="alert-stat-value" style="font-size:.8rem">${a.mitigationStatus}</span></div>
      </div>
      <div class="alert-source-tag"><i class="fas fa-shield-alt"></i> Resilience360™ methodology</div>
    </div>`).join('');
}

/* ── Forms ── */
function initForms() {
  // Walkability
  document.getElementById('walkability-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const hazards = [...document.querySelectorAll('.hazard-cb:checked')].map(cb => cb.value);
    const data = { area: document.getElementById('walk-area').value, lat: document.getElementById('walk-lat').value, lng: document.getElementById('walk-lng').value, score: document.getElementById('walk-score').value, sidewalkQuality: document.getElementById('walk-sidewalk').value, lighting: document.getElementById('walk-lighting').value, greenCover: document.getElementById('walk-green').value, pedestrianDensity: document.getElementById('walk-density').value, accessibility: document.getElementById('walk-access').value, hazards, reporter: document.getElementById('walk-reporter').value };
    const res = await apiPost('/api/walkability', data);
    if (res?.success) { showToast(`Assessment submitted! +${res.xpAwarded} XP`, 'success'); addXP(res.xpAwarded || 30, ''); e.target.reset(); document.getElementById('walk-score-display').textContent = '50'; loadWalkabilityReports(); loadDashboard(); }
  });

  // Safety Alert
  document.getElementById('safety-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const data = { area: document.getElementById('safe-area').value, lat: document.getElementById('safe-lat').value, lng: document.getElementById('safe-lng').value, type: document.getElementById('safe-type').value, severity: document.getElementById('safe-severity').value, message: document.getElementById('safe-msg').value };
    const res = await apiPost('/api/safety-alerts', data);
    if (res?.success) { showToast('Safety alert broadcast! +25 XP', 'success'); addXP(25, ''); e.target.reset(); loadSafetyAlerts(); }
  });

  // Community
  document.getElementById('community-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const data = { area: document.getElementById('comm-area').value, lat: document.getElementById('comm-lat').value, lng: document.getElementById('comm-lng').value, type: document.getElementById('comm-type').value, description: document.getElementById('comm-desc').value, reporter: document.getElementById('comm-reporter').value };
    const res = await apiPost('/api/community', data);
    if (res?.success) { showToast('Report submitted! +35 XP', 'success'); addXP(35, ''); e.target.reset(); loadCommunityReports(); }
  });

  // Route share form
  document.getElementById('route-submit-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const data = { name: document.getElementById('r-name').value, from: document.getElementById('r-from').value, to: document.getElementById('r-to').value, distance: document.getElementById('r-dist').value, duration: document.getElementById('r-dur').value, safetyScore: document.getElementById('r-safety').value, accessibility: document.getElementById('r-accessible').checked };
    const res = await apiPost('/api/routes', data);
    if (res?.success) { showToast('Route shared! +40 XP', 'success'); addXP(40, ''); e.target.reset(); document.getElementById('r-safety-display').textContent = '75'; loadRoutes(); loadRouteMarkers(); }
  });

  // Garbage
  document.getElementById('garbage-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const data = { area: document.getElementById('garb-area').value, lat: document.getElementById('garb-lat').value, lng: document.getElementById('garb-lng').value, type: document.getElementById('garb-type').value, severity: document.getElementById('garb-severity').value, ward: document.getElementById('garb-ward').value, description: document.getElementById('garb-desc').value, reporter: document.getElementById('garb-reporter').value };
    const res = await apiPost('/api/garbage', data);
    if (res?.success) { showToast('Waste reported! +30 XP', 'success'); addXP(30, ''); e.target.reset(); loadGarbageReports(); loadDashboard(); }
  });

  // Garbage filter
  document.getElementById('btn-apply-garbage-filter')?.addEventListener('click', () => {
    loadGarbageReports({ status: document.getElementById('filter-garbage-status').value, severity: document.getElementById('filter-garbage-severity').value });
  });

  // Climate
  document.getElementById('climate-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const data = { type: document.getElementById('clim-type').value, severity: document.getElementById('clim-severity').value, area: document.getElementById('clim-area').value, lat: document.getElementById('clim-lat').value, lng: document.getElementById('clim-lng').value, riskScore: document.getElementById('clim-risk').value, affectedAssets: document.getElementById('clim-assets').value, description: document.getElementById('clim-desc').value };
    const res = await apiPost('/api/climate', data);
    if (res?.success) { showToast('Climate alert submitted!', 'success'); addXP(25, ''); e.target.reset(); document.getElementById('clim-risk-display').textContent = '50'; loadClimateAlerts(); loadDashboard(); }
  });
}

function initRangeSliders() {
  [['walk-score', 'walk-score-display'], ['clim-risk', 'clim-risk-display'], ['r-safety', 'r-safety-display']].forEach(([inp, disp]) => {
    const el = document.getElementById(inp), d = document.getElementById(disp);
    if (el && d) el.addEventListener('input', () => { d.textContent = el.value; });
  });
}

// Auto-refresh every 60s
setInterval(() => { loadDashboard(); loadSafetyAlerts(); }, 60000);
