/* ═══════════════════════════════════════════════════════════════
   URBAN PULSE — Application Logic
   Powered by: Chitragupta · NammaKasa · Resilience360
   ═══════════════════════════════════════════════════════════════ */

const API = '';

// ─── Navigation ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initForms();
  loadDashboard();
  loadWalkabilityReports();
  loadGarbageReports();
  loadClimateAlerts();
  initRangeSliders();
  initScrollEffects();
  initHeroActions();
  initAnimatedCounters();
});

function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const toggle = document.getElementById('nav-toggle');
  const linksContainer = document.getElementById('nav-links');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.dataset.section;

      // Update active nav
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Show section
      document.querySelectorAll('.section').forEach(s => s.classList.remove('section-active'));
      const target = document.getElementById(`section-${sectionId}`);
      if (target) {
        target.classList.add('section-active');
        target.style.animation = 'none';
        void target.offsetHeight;
        target.style.animation = '';
      }

      // Close mobile menu
      linksContainer.classList.remove('open');

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  toggle.addEventListener('click', () => {
    linksContainer.classList.toggle('open');
  });
}

function initScrollEffects() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

function initHeroActions() {
  // Hero CTA buttons navigate to sections
  document.querySelectorAll('.btn-hero').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSection = btn.dataset.target;
      if (targetSection) {
        const navLink = document.querySelector(`[data-section="${targetSection}"]`);
        if (navLink) navLink.click();
      }
    });
  });
}

function initAnimatedCounters() {
  // Animate hero stats on page load
  const heroStats = {
    'hero-stat-areas': 6,
    'hero-stat-wards': 243,  // NammaKasa: 243 wards in Bengaluru
    'hero-stat-events': 5,
    'hero-stat-risk': 83
  };

  Object.entries(heroStats).forEach(([id, target]) => {
    animateValue(id, 0, target, 1800, target > 100);
  });
}

function initRangeSliders() {
  const walkScore = document.getElementById('walk-score');
  const walkDisplay = document.getElementById('walk-score-display');
  if (walkScore && walkDisplay) {
    walkScore.addEventListener('input', () => {
      walkDisplay.textContent = walkScore.value;
    });
  }

  const climRisk = document.getElementById('clim-risk');
  const climDisplay = document.getElementById('clim-risk-display');
  if (climRisk && climDisplay) {
    climRisk.addEventListener('input', () => {
      climDisplay.textContent = climRisk.value;
    });
  }
}

// ─── Toast Notifications ────────────────────────────────────────
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: 'fas fa-check',
    error: 'fas fa-times',
    info: 'fas fa-info'
  };

  toast.innerHTML = `
    <div class="toast-icon"><i class="${icons[type] || icons.info}"></i></div>
    <div class="toast-message">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ─── API Helpers ────────────────────────────────────────────────
async function apiGet(endpoint) {
  try {
    const res = await fetch(`${API}${endpoint}`);
    return await res.json();
  } catch (err) {
    console.error('API Error:', err);
    showToast('Failed to fetch data', 'error');
    return null;
  }
}

async function apiPost(endpoint, data) {
  try {
    const res = await fetch(`${API}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.error('API Error:', err);
    showToast('Failed to submit data', 'error');
    return null;
  }
}

// ─── Dashboard ──────────────────────────────────────────────────
async function loadDashboard() {
  const result = await apiGet('/api/dashboard');
  if (!result || !result.success) return;

  const d = result.data;

  // KPI Cards
  animateValue('kpi-walk-score', 0, d.walkability.avgScore, 1200);
  document.getElementById('kpi-walk-sub').textContent =
    `Best: ${d.walkability.topArea} · Needs work: ${d.walkability.worstArea}`;

  animateValue('kpi-waste-total', 0, d.garbage.totalReports, 1000);
  document.getElementById('kpi-waste-sub').textContent =
    `${d.garbage.unresolved} unresolved · ${d.garbage.resolved} resolved`;

  animateValue('kpi-climate-total', 0, d.climate.totalAlerts, 1000);
  document.getElementById('kpi-climate-sub').textContent =
    `${d.climate.criticalAlerts} critical · Avg risk: ${d.climate.avgRiskScore}`;

  animateValue('kpi-assets-total', 0, d.climate.totalAffectedAssets, 1400, true);
  document.getElementById('kpi-assets-sub').textContent = `Across ${d.climate.totalAlerts} zones · ResSolv™ scored`;

  // Update hero stats
  animateValue('hero-stat-areas', 0, d.walkability.totalReports, 1200);
  animateValue('hero-stat-events', 0, d.climate.totalAlerts, 1000);
  animateValue('hero-stat-risk', 0, d.climate.avgRiskScore, 1400);

  // Activity Feed
  renderActivityFeed(d.recentActivity);

  // Update activity count
  const actCount = document.getElementById('activity-count');
  if (actCount) actCount.textContent = `${d.recentActivity.length} events`;

  // Load Charts
  loadCharts();
}

function animateValue(elementId, start, end, duration, addCommas = false) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const startTime = performance.now();
  const diff = end - start;

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + diff * eased);

    el.textContent = addCommas ? current.toLocaleString() : current;

    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function renderActivityFeed(activities) {
  const list = document.getElementById('activity-list');
  if (!list || !activities) return;

  list.innerHTML = activities.map(a => {
    const timeAgo = getTimeAgo(a.timestamp);
    const typeLabel = a.type === 'garbage' ? 'Waste Report' : 'Climate Alert';
    const sourceLabel = a.type === 'garbage' ? 'NammaKasa' : 'Resilience360';
    return `
      <div class="activity-item">
        <div class="activity-dot ${a.type}"></div>
        <div class="activity-text">
          <strong>${typeLabel}</strong> — ${a.area || a.description?.slice(0, 60)}
          ${a.severity ? `<span class="status-badge severity-${a.severity.toLowerCase()}">${a.severity}</span>` : ''}
        </div>
        <span class="activity-time">${timeAgo}</span>
      </div>
    `;
  }).join('');
}

function getTimeAgo(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Custom Canvas Charts ───────────────────────────────────────
async function loadCharts() {
  const [walkData, wasteData, climateData] = await Promise.all([
    apiGet('/api/analytics/walkability'),
    apiGet('/api/analytics/garbage'),
    apiGet('/api/analytics/climate')
  ]);

  if (walkData?.success) drawBarChart('canvas-walkability', walkData.data, 'walkability');
  if (wasteData?.success) drawDonutChart('canvas-waste', wasteData.data.byType, 'waste');
  if (climateData?.success) drawRadarChart('canvas-climate', climateData.data, 'climate');
}

function drawBarChart(canvasId, data, theme) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);

  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  if (!data || data.length === 0) return;

  const maxScore = 100;
  const barWidth = Math.min(40, (chartW / data.length) * 0.6);
  const gap = (chartW - barWidth * data.length) / (data.length + 1);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxScore - (maxScore / 4) * i), padding.left - 8, y + 4);
  }

  // Chitragupta-inspired green/blue color palette for walkability
  const colors = [
    { start: '#10b981', end: '#059669' },
    { start: '#6366f1', end: '#4f46e5' },
    { start: '#f59e0b', end: '#d97706' },
    { start: '#ef4444', end: '#dc2626' },
    { start: '#8b5cf6', end: '#7c3aed' },
    { start: '#38bdf8', end: '#0284c7' },
  ];

  data.forEach((item, i) => {
    const x = padding.left + gap + i * (barWidth + gap);
    const barH = (item.avgScore / maxScore) * chartH;
    const y = padding.top + chartH - barH;

    const grad = ctx.createLinearGradient(x, y, x, padding.top + chartH);
    const color = colors[i % colors.length];
    grad.addColorStop(0, color.start);
    grad.addColorStop(1, color.end);

    ctx.shadowColor = color.start;
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = grad;
    ctx.beginPath();
    roundRect(ctx, x, y, barWidth, barH, 6);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Score label
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(item.avgScore, x + barWidth / 2, y - 8);

    // Area label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    const label = item.area.length > 8 ? item.area.slice(0, 7) + '…' : item.area;
    ctx.fillText(label, x + barWidth / 2, padding.top + chartH + 18);
  });

  // Source watermark
  ctx.fillStyle = 'rgba(255,214,0,0.12)';
  ctx.font = '9px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Chitragupta', width - padding.right, height - 4);
}

function drawDonutChart(canvasId, data, theme) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);

  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;

  ctx.clearRect(0, 0, width, height);

  const entries = Object.entries(data);
  if (entries.length === 0) return;

  const total = entries.reduce((sum, [, val]) => sum + val, 0);
  const cx = width * 0.35;
  const cy = height / 2;
  const outerR = Math.min(cx, cy) - 20;
  const innerR = outerR * 0.6;

  // NammaKasa-inspired colors
  const colors = ['#f59e0b', '#6366f1', '#10b981', '#ef4444', '#8b5cf6', '#38bdf8'];

  let startAngle = -Math.PI / 2;

  entries.forEach(([key, val], i) => {
    const sliceAngle = (val / total) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;
    const color = colors[i % colors.length];

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, endAngle);
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    startAngle = endAngle;
  });

  // Center label
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 24px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total, cx, cy - 6);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Inter, sans-serif';
  ctx.fillText('Total', cx, cy + 14);

  // Legend
  const legendX = width * 0.65;
  let legendY = 30;

  entries.forEach(([key, val], i) => {
    const color = colors[i % colors.length];
    const pct = Math.round((val / total) * 100);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(legendX, legendY + 6, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f1f5f9';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(key, legendX + 14, legendY + 10);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText(`${val} (${pct}%)`, legendX + 14, legendY + 26);

    legendY += 44;
  });

  // Source watermark
  ctx.fillStyle = 'rgba(255,214,0,0.12)';
  ctx.font = '9px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('NammaKasa', width - 10, height - 4);
}

function drawRadarChart(canvasId, data, theme) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);

  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;

  ctx.clearRect(0, 0, width, height);

  // Draw severity breakdown as horizontal bars (Resilience360 style)
  const entries = Object.entries(data.bySeverity || {});
  if (entries.length === 0) return;

  const padding = { top: 20, right: 20, bottom: 20, left: 90 };
  const chartW = width - padding.left - padding.right;
  const barH = 28;
  const gap = 14;
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const maxVal = Math.max(...entries.map(([, v]) => v));

  const severityColors = {
    Critical: '#ef4444',
    High: '#f59e0b',
    Medium: '#6366f1',
    Low: '#10b981'
  };

  entries.forEach(([key, val], i) => {
    const y = padding.top + i * (barH + gap);
    const barW = (val / Math.max(maxVal, 1)) * chartW;
    const color = severityColors[key] || '#6366f1';

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(key, padding.left - 12, y + barH / 2 + 4);

    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    roundRect(ctx, padding.left, y, chartW, barH, 8);
    ctx.fill();

    const grad = ctx.createLinearGradient(padding.left, y, padding.left + barW, y);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + '88');

    ctx.fillStyle = grad;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    roundRect(ctx, padding.left, y, Math.max(barW, 10), barH, 8);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 13px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(val, padding.left + barW + 10, y + barH / 2 + 5);
  });

  // Bottom stats with Resilience360 branding
  const statsY = padding.top + entries.length * (barH + gap) + 20;

  ctx.fillStyle = '#64748b';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`ResSolv™ Avg Risk: ${data.avgRiskScore}`, padding.left, statsY);
  ctx.fillText(`Assets at Risk: ${(data.totalAffectedAssets || 0).toLocaleString()}`, padding.left, statsY + 20);

  // Source watermark
  ctx.fillStyle = 'rgba(255,214,0,0.12)';
  ctx.font = '9px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Resilience360', width - 10, height - 4);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Walkability (Chitragupta) ──────────────────────────────────
async function loadWalkabilityReports() {
  const result = await apiGet('/api/walkability');
  if (!result?.success) return;
  renderWalkabilityList(result.data);
  
  // Update count badge
  const count = document.getElementById('walk-count');
  if (count) count.textContent = `${result.data.length}`;
}

function renderWalkabilityList(reports) {
  const list = document.getElementById('walkability-list');
  if (!list) return;

  list.innerHTML = reports.map(r => {
    const scoreClass = r.score >= 70 ? 'score-high' : r.score >= 50 ? 'score-medium' : 'score-low';
    return `
      <div class="report-item">
        <div class="report-item-header">
          <span class="report-item-area">${r.area}</span>
          <span class="report-item-score ${scoreClass}">${r.score}/100</span>
        </div>
        <div class="report-item-meta">
          <span class="meta-tag">🛤️ ${r.sidewalkQuality}</span>
          <span class="meta-tag">💡 ${r.lighting}</span>
          <span class="meta-tag">🌿 ${r.greenCover}</span>
          <span class="meta-tag">👥 ${r.pedestrianDensity}</span>
        </div>
        <div class="report-item-meta" style="margin-top: 4px;">
          <span class="meta-tag">📍 ${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}</span>
          <span class="meta-tag">👤 ${r.reporter}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ─── Garbage (NammaKasa) ────────────────────────────────────────
async function loadGarbageReports(filters = {}) {
  let endpoint = '/api/garbage';
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.severity) params.set('severity', filters.severity);
  if (params.toString()) endpoint += `?${params}`;

  const result = await apiGet(endpoint);
  if (!result?.success) return;
  renderGarbageList(result.data);
  
  // Update count badge
  const count = document.getElementById('garb-count');
  if (count) count.textContent = `${result.data.length}`;
}

function renderGarbageList(reports) {
  const list = document.getElementById('garbage-list');
  if (!list) return;

  list.innerHTML = reports.map(r => {
    const statusClass = `status-${r.status.toLowerCase().replace(' ', '-')}`;
    const severityClass = `severity-${r.severity.toLowerCase()}`;
    return `
      <div class="report-item">
        <div class="report-item-header">
          <span class="report-item-area">${r.area}</span>
          <span class="status-badge ${statusClass}">${r.status}</span>
        </div>
        <div class="report-item-meta">
          <span class="status-badge ${severityClass}">${r.severity}</span>
          <span class="meta-tag">🗑️ ${r.type}</span>
          <span class="meta-tag">🏛️ ${r.ward}</span>
        </div>
        ${r.mla && r.mla !== 'Auto-assigned' ? `
        <div class="report-item-meta" style="margin-top: 2px;">
          <span class="meta-tag">👤 MLA: ${r.mla}</span>
          <span class="meta-tag">🏛️ MP: ${r.mp}</span>
        </div>` : ''}
        ${r.description ? `<div class="report-item-desc">${r.description}</div>` : ''}
        <div class="report-item-meta" style="margin-top: 6px;">
          <span class="meta-tag">📍 ${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}</span>
          <span class="meta-tag">👤 ${r.reporter}</span>
          <span class="meta-tag">🕒 ${getTimeAgo(r.timestamp)}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ─── Climate (Resilience360) ────────────────────────────────────
async function loadClimateAlerts() {
  const [alertsResult, analyticsResult] = await Promise.all([
    apiGet('/api/climate'),
    apiGet('/api/analytics/climate')
  ]);

  if (alertsResult?.success) renderClimateGrid(alertsResult.data);
  if (analyticsResult?.success) {
    const d = analyticsResult.data;
    document.getElementById('stat-risk-val').textContent = d.avgRiskScore;
    document.getElementById('stat-critical-val').textContent = d.bySeverity?.Critical || 0;
    document.getElementById('stat-assets-val').textContent = (d.totalAffectedAssets || 0).toLocaleString();
  }
}

function renderClimateGrid(alerts) {
  const grid = document.getElementById('climate-grid');
  if (!grid) return;

  const typeIcons = {
    'Flood': { icon: 'fas fa-water', class: 'flood' },
    'Heat Wave': { icon: 'fas fa-fire', class: 'heat' },
    'Air Quality': { icon: 'fas fa-smog', class: 'air' },
    'Landslide': { icon: 'fas fa-mountain', class: 'landslide' },
    'Water Stress': { icon: 'fas fa-tint-slash', class: 'water' },
    'Storm': { icon: 'fas fa-bolt', class: 'storm' },
    'Drought': { icon: 'fas fa-sun', class: 'drought' }
  };

  grid.innerHTML = alerts.map(a => {
    const typeInfo = typeIcons[a.type] || { icon: 'fas fa-exclamation', class: 'air' };
    return `
      <div class="climate-alert-card alert-${a.severity}">
        <div class="alert-card-header">
          <div class="alert-type">
            <div class="alert-type-icon ${typeInfo.class}"><i class="${typeInfo.icon}"></i></div>
            ${a.type}
          </div>
          <span class="status-badge severity-${a.severity.toLowerCase()}">${a.severity}</span>
        </div>
        <div class="alert-area"><i class="fas fa-map-marker-alt"></i> ${a.area}</div>
        <div class="alert-desc">${a.description}</div>
        <div class="alert-stats">
          <div class="alert-stat">
            <span class="alert-stat-label">ResSolv™ Risk</span>
            <span class="alert-stat-value" style="color: ${a.riskScore >= 80 ? '#ef4444' : a.riskScore >= 60 ? '#f59e0b' : '#10b981'}">${a.riskScore}</span>
          </div>
          <div class="alert-stat">
            <span class="alert-stat-label">Assets</span>
            <span class="alert-stat-value">${a.affectedAssets.toLocaleString()}</span>
          </div>
          <div class="alert-stat">
            <span class="alert-stat-label">Mitigation</span>
            <span class="alert-stat-value" style="font-size: 0.8rem;">${a.mitigationStatus}</span>
          </div>
        </div>
        <div class="alert-source-tag">
          <i class="fas fa-shield-alt"></i> Scored via Resilience360™ methodology
        </div>
      </div>
    `;
  }).join('');
}

// ─── Form Handlers ──────────────────────────────────────────────
function initForms() {
  // Walkability Form (Chitragupta methodology)
  const walkForm = document.getElementById('walkability-form');
  if (walkForm) {
    walkForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        area: document.getElementById('walk-area').value,
        lat: document.getElementById('walk-lat').value,
        lng: document.getElementById('walk-lng').value,
        score: document.getElementById('walk-score').value,
        sidewalkQuality: document.getElementById('walk-sidewalk').value,
        lighting: document.getElementById('walk-lighting').value,
        greenCover: document.getElementById('walk-green').value,
        pedestrianDensity: document.getElementById('walk-density').value,
        reporter: document.getElementById('walk-reporter').value || 'Anonymous'
      };

      const result = await apiPost('/api/walkability', data);
      if (result?.success) {
        showToast('Walkability assessment submitted via Chitragupta methodology!', 'success');
        walkForm.reset();
        document.getElementById('walk-score-display').textContent = '50';
        loadWalkabilityReports();
        loadDashboard();
      }
    });
  }

  // Garbage Form (NammaKasa-style with ward detection)
  const garbForm = document.getElementById('garbage-form');
  if (garbForm) {
    garbForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        area: document.getElementById('garb-area').value,
        lat: document.getElementById('garb-lat').value,
        lng: document.getElementById('garb-lng').value,
        type: document.getElementById('garb-type').value,
        severity: document.getElementById('garb-severity').value,
        ward: document.getElementById('garb-ward').value,
        description: document.getElementById('garb-desc').value,
        reporter: document.getElementById('garb-reporter').value || 'Anonymous'
      };

      const result = await apiPost('/api/garbage', data);
      if (result?.success) {
        showToast('Waste report submitted — NammaKasa ward tracking active!', 'success');
        garbForm.reset();
        loadGarbageReports();
        loadDashboard();
      }
    });
  }

  // Garbage Filters
  const filterBtn = document.getElementById('btn-apply-garbage-filter');
  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      const status = document.getElementById('filter-garbage-status').value;
      const severity = document.getElementById('filter-garbage-severity').value;
      loadGarbageReports({ status, severity });
      showToast('Filters applied', 'info');
    });
  }

  // Climate Form (Resilience360 scoring)
  const climForm = document.getElementById('climate-form');
  if (climForm) {
    climForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        type: document.getElementById('clim-type').value,
        severity: document.getElementById('clim-severity').value,
        area: document.getElementById('clim-area').value,
        lat: document.getElementById('clim-lat').value,
        lng: document.getElementById('clim-lng').value,
        riskScore: document.getElementById('clim-risk').value,
        affectedAssets: document.getElementById('clim-assets').value,
        description: document.getElementById('clim-desc').value
      };

      const result = await apiPost('/api/climate', data);
      if (result?.success) {
        showToast('Climate alert submitted — ResSolv™ risk scored!', 'success');
        climForm.reset();
        document.getElementById('clim-risk-display').textContent = '50';
        loadClimateAlerts();
        loadDashboard();
      }
    });
  }
}

// ─── Resize handler for charts ──────────────────────────────────
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    loadCharts();
  }, 300);
});
