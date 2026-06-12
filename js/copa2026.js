(function () {
  'use strict';

  // ─── CHAVE DA API (football-data.org — plano gratuito) ───────────────────────
  const API_KEY = window.COPA_API_KEY || '';
  const API_BASE = 'https://api.football-data.org/v4';

  // ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────
  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }
  function fmtTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  function flag(code) {
    if (!code) return '';
    return `<img src="https://flagcdn.com/24x18/${code.toLowerCase()}.png" width="24" height="18" alt="${code}" style="vertical-align:middle;margin-right:6px;border-radius:2px">`;
  }

  async function apiFetch(path) {
    const res = await fetch(API_BASE + path, {
      headers: API_KEY ? { 'X-Auth-Token': API_KEY } : {}
    });
    if (!res.ok) throw new Error('API ' + res.status);
    return res.json();
  }

  // ─── RENDERIZA JOGOS ──────────────────────────────────────────────────────────
  function renderMatches(matches) {
    if (!matches.length) return '<p style="color:#666;text-align:center;padding:20px">Nenhum jogo encontrado.</p>';

    // Agrupa por data
    const byDate = {};
    matches.forEach(m => {
      const key = fmtDate(m.utcDate);
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(m);
    });

    return Object.entries(byDate).map(([date, games]) => `
      <div style="margin-bottom:20px">
        <div style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#666;border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:10px">${date}</div>
        ${games.map(m => {
          const done    = m.status === 'FINISHED';
          const live    = m.status === 'IN_PLAY' || m.status === 'PAUSED';
          const homeGoals = m.score?.fullTime?.home ?? (m.score?.halfTime?.home ?? '');
          const awayGoals = m.score?.fullTime?.away ?? (m.score?.halfTime?.away ?? '');
          const scoreStr  = done || live ? `<span style="font-weight:800;font-size:17px;min-width:48px;text-align:center;display:inline-block">${homeGoals} – ${awayGoals}</span>` : `<span style="font-size:12px;color:#888;min-width:48px;text-align:center;display:inline-block">${fmtTime(m.utcDate)}</span>`;
          const liveBadge = live ? '<span style="background:#e00;color:#fff;font-size:9px;font-weight:700;padding:2px 5px;border-radius:2px;margin-left:6px;letter-spacing:.05em">AO VIVO</span>' : '';
          return `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f5f5f5">
              <div style="flex:1;text-align:right;font-size:14px;font-weight:600">
                ${flag(m.homeTeam?.tla)} ${m.homeTeam?.shortName || m.homeTeam?.name || '—'}
              </div>
              <div style="padding:0 14px;text-align:center">
                ${scoreStr}${liveBadge}
              </div>
              <div style="flex:1;text-align:left;font-size:14px;font-weight:600">
                ${flag(m.awayTeam?.tla)} ${m.awayTeam?.shortName || m.awayTeam?.name || '—'}
              </div>
            </div>`;
        }).join('')}
      </div>`).join('');
  }

  // ─── RENDERIZA GRUPOS ─────────────────────────────────────────────────────────
  function renderGroups(standings) {
    if (!standings || !standings.length) return '';
    return standings.map(group => {
      const name  = group.group || group.stage || 'Grupo';
      const label = name.replace('GROUP_', 'Grupo ').replace(/_/g, ' ');
      return `
        <div style="margin-bottom:24px">
          <div style="font-family:monospace;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#000;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:8px">${label}</div>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="color:#999;font-size:11px">
                <th style="text-align:left;padding:4px 0;font-weight:500">#</th>
                <th style="text-align:left;padding:4px 0;font-weight:500">Seleção</th>
                <th style="text-align:center;padding:4px 0;font-weight:500">J</th>
                <th style="text-align:center;padding:4px 0;font-weight:500">V</th>
                <th style="text-align:center;padding:4px 0;font-weight:500">E</th>
                <th style="text-align:center;padding:4px 0;font-weight:500">D</th>
                <th style="text-align:center;padding:4px 0;font-weight:500">GP</th>
                <th style="text-align:center;padding:4px 0;font-weight:500">Pts</th>
              </tr>
            </thead>
            <tbody>
              ${(group.table || []).map((row, i) => `
                <tr style="border-bottom:1px solid #f0f0f0${i < 2 ? ';background:#f8fff8' : ''}">
                  <td style="padding:6px 4px 6px 0;color:#999;font-size:12px">${row.position}</td>
                  <td style="padding:6px 4px;font-weight:600">${flag(row.team?.tla)}${row.team?.shortName || row.team?.name || '—'}</td>
                  <td style="text-align:center;padding:6px 4px;color:#555">${row.playedGames}</td>
                  <td style="text-align:center;padding:6px 4px;color:#555">${row.won}</td>
                  <td style="text-align:center;padding:6px 4px;color:#555">${row.draw}</td>
                  <td style="text-align:center;padding:6px 4px;color:#555">${row.lost}</td>
                  <td style="text-align:center;padding:6px 4px;color:#555">${row.goalsFor ?? 0}:${row.goalsAgainst ?? 0}</td>
                  <td style="text-align:center;padding:6px 4px;font-weight:800">${row.points}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    }).join('');
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────────
  async function init() {
    const container = document.getElementById('copa2026-widget');
    if (!container) return;

    if (!API_KEY) {
      container.innerHTML = `
        <div style="background:#fff3cd;border:1px solid #ffc107;padding:16px 20px;font-size:14px;color:#856404;border-radius:4px">
          ⚠️ Adicione sua chave da API em <code>window.COPA_API_KEY</code> para carregar os dados da Copa 2026.
        </div>`;
      return;
    }

    container.innerHTML = '<div style="text-align:center;padding:32px;color:#666;font-size:14px">Carregando dados da Copa 2026…</div>';

    try {
      // Abas
      container.innerHTML = `
        <div style="display:flex;gap:0;border-bottom:2px solid #000;margin-bottom:20px">
          <button id="copa-tab-jogos" onclick="copaSwitchTab('jogos')" style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;border:none;background:none;padding:10px 18px;cursor:pointer;color:#000;border-bottom:2px solid #000;margin-bottom:-2px">Próximos Jogos</button>
          <button id="copa-tab-grupos" onclick="copaSwitchTab('grupos')" style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;border:none;background:none;padding:10px 18px;cursor:pointer;color:#999">Grupos</button>
          <button id="copa-tab-resultados" onclick="copaSwitchTab('resultados')" style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;border:none;background:none;padding:10px 18px;cursor:pointer;color:#999">Resultados</button>
        </div>
        <div id="copa-panel-jogos"></div>
        <div id="copa-panel-grupos"  style="display:none"></div>
        <div id="copa-panel-resultados" style="display:none"></div>`;

      // Busca dados em paralelo
      const [matchData, standData] = await Promise.allSettled([
        apiFetch('/competitions/WC/matches?status=SCHEDULED&limit=20'),
        apiFetch('/competitions/WC/standings'),
      ]);

      const finishedData = await apiFetch('/competitions/WC/matches?status=FINISHED&limit=20').catch(() => ({ matches: [] }));

      // Próximos jogos
      const upcoming = matchData.status === 'fulfilled' ? (matchData.value.matches || []) : [];
      document.getElementById('copa-panel-jogos').innerHTML =
        upcoming.length ? renderMatches(upcoming.slice(0, 15)) : '<p style="color:#666;text-align:center;padding:20px">Nenhum jogo agendado.</p>';

      // Grupos
      const standings = standData.status === 'fulfilled' ? (standData.value.standings || []) : [];
      document.getElementById('copa-panel-grupos').innerHTML =
        standings.length ? renderGroups(standings) : '<p style="color:#666;text-align:center;padding:20px">Tabela de grupos disponível após início da Copa.</p>';

      // Resultados
      const finished = finishedData.matches || [];
      document.getElementById('copa-panel-resultados').innerHTML =
        finished.length ? renderMatches(finished.slice(0, 15)) : '<p style="color:#666;text-align:center;padding:20px">Nenhum resultado ainda.</p>';

    } catch (e) {
      container.innerHTML = `<p style="color:#c00;text-align:center;padding:20px;font-size:14px">Erro ao carregar dados: ${e.message}</p>`;
    }
  }

  // Troca de aba
  window.copaSwitchTab = function (tab) {
    ['jogos', 'grupos', 'resultados'].forEach(t => {
      const btn   = document.getElementById('copa-tab-' + t);
      const panel = document.getElementById('copa-panel-' + t);
      const active = t === tab;
      if (btn)   { btn.style.color = active ? '#000' : '#999'; btn.style.borderBottom = active ? '2px solid #000' : 'none'; }
      if (panel) { panel.style.display = active ? 'block' : 'none'; }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
