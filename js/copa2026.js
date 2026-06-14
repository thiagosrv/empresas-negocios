(function () {
  'use strict';

  const API_KEY  = window.COPA_API_KEY || '';
  const API_BASE = 'https://api.football-data.org/v4';
  const TABS     = ['hoje', 'proximos', 'resultados', 'grupos'];
  let refreshTimer = null;

  // ─── DATAS ────────────────────────────────────────────────────────────────────
  function isoDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + (offsetDays || 0));
    return d.toISOString().slice(0, 10);
  }

  // ─── UTILITÁRIOS ──────────────────────────────────────────────────────────────
  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  }
  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  function flag(tla) {
    if (!tla) return '';
    return '<img src="https://flagcdn.com/24x18/' + tla.toLowerCase() + '.png" width="24" height="18" alt="' + tla + '" loading="lazy" style="vertical-align:middle;border-radius:2px;flex-shrink:0">';
  }

  // ─── FETCH ────────────────────────────────────────────────────────────────────
  async function apiFetch(path) {
    const res = await fetch(API_BASE + path, {
      headers: API_KEY ? { 'X-Auth-Token': API_KEY } : {}
    });
    if (res.status === 429) throw new Error('Limite de requisições atingido — tente em 1 minuto.');
    if (res.status === 403) throw new Error('Chave da API inválida ou sem acesso à Copa 2026.');
    if (res.status === 404) throw new Error('Competição não encontrada na API.');
    if (!res.ok) throw new Error('Erro ' + res.status);
    return res.json();
  }

  // ─── RENDERIZA LISTA DE JOGOS ─────────────────────────────────────────────────
  function renderMatches(matches, emptyMsg) {
    if (!matches || !matches.length) {
      return '<p style="color:#999;text-align:center;padding:36px 20px;font-size:14px">' + (emptyMsg || 'Nenhum jogo encontrado.') + '</p>';
    }

    // Agrupa por data
    const byDate = {};
    matches.forEach(function (m) {
      var key = fmtDate(m.utcDate);
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(m);
    });

    return Object.entries(byDate).map(function (entry) {
      var date = entry[0], games = entry[1];
      return '<div style="margin-bottom:20px">'
        + '<div style="font-family:monospace;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#888;border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:8px">' + date + '</div>'
        + games.map(function (m) {
            var done  = m.status === 'FINISHED';
            var live  = m.status === 'IN_PLAY' || m.status === 'PAUSED';
            var timed = m.status === 'TIMED' || m.status === 'SCHEDULED';
            var hG = m.score && m.score.fullTime ? m.score.fullTime.home : null;
            var aG = m.score && m.score.fullTime ? m.score.fullTime.away : null;
            // halfTime fallback
            if (hG === null && m.score && m.score.halfTime) { hG = m.score.halfTime.home; aG = m.score.halfTime.away; }

            var scoreHtml;
            if ((done || live) && hG !== null && hG !== undefined) {
              var col = live ? 'color:#c00;' : '';
              scoreHtml = '<span style="font-weight:800;font-size:17px;min-width:54px;text-align:center;display:inline-block;' + col + '">' + hG + ' – ' + aG + '</span>';
            } else {
              scoreHtml = '<span style="font-size:12px;color:#999;min-width:54px;text-align:center;display:inline-block">' + (timed ? fmtTime(m.utcDate) : 'vs') + '</span>';
            }
            var badge = live ? '<div style="background:#e00;color:#fff;font-size:9px;font-weight:700;padding:2px 6px;letter-spacing:.06em;margin-top:3px;display:inline-block">AO VIVO</div>' : '';
            var hName = m.homeTeam && (m.homeTeam.shortName || m.homeTeam.name) || '—';
            var aName = m.awayTeam && (m.awayTeam.shortName || m.awayTeam.name) || '—';
            var hTla  = m.homeTeam && m.homeTeam.tla;
            var aTla  = m.awayTeam && m.awayTeam.tla;

            return '<div style="display:flex;align-items:center;padding:9px 0;border-bottom:1px solid #f5f5f5">'
              + '<div style="flex:1;display:flex;align-items:center;justify-content:flex-end;gap:8px;font-size:13px;font-weight:600;min-width:0">'
              + '<span style="text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + hName + '</span>' + flag(hTla)
              + '</div>'
              + '<div style="padding:0 10px;text-align:center;flex-shrink:0">' + scoreHtml + badge + '</div>'
              + '<div style="flex:1;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;min-width:0">'
              + flag(aTla) + '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + aName + '</span>'
              + '</div>'
              + '</div>';
          }).join('')
        + '</div>';
    }).join('');
  }

  // ─── RENDERIZA GRUPOS ─────────────────────────────────────────────────────────
  function renderGroups(standings) {
    if (!standings || !standings.length) {
      return '<p style="color:#999;text-align:center;padding:36px;font-size:14px">Classificação por grupos indisponível.</p>';
    }

    // Grade de 2 colunas no desktop
    var cols = [[], []];
    standings.forEach(function (g, i) { cols[i % 2].push(g); });

    function groupHtml(group) {
      var name  = group.group || group.stage || '';
      var label = name.replace('GROUP_', 'Grupo ').replace(/_/g, ' ') || 'Classificação';
      return '<div style="margin-bottom:20px">'
        + '<div style="font-family:monospace;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#000;border-bottom:2px solid #000;padding-bottom:5px;margin-bottom:8px">' + label + '</div>'
        + '<table style="width:100%;border-collapse:collapse;font-size:12px">'
        + '<thead><tr style="color:#aaa;font-size:10px;font-family:monospace;text-transform:uppercase">'
        + '<th style="text-align:left;padding:3px 0;width:20px">#</th>'
        + '<th style="text-align:left;padding:3px 4px">Seleção</th>'
        + '<th style="text-align:center;padding:3px 3px" title="Jogos">J</th>'
        + '<th style="text-align:center;padding:3px 3px" title="Vitórias">V</th>'
        + '<th style="text-align:center;padding:3px 3px" title="Empates">E</th>'
        + '<th style="text-align:center;padding:3px 3px" title="Derrotas">D</th>'
        + '<th style="text-align:center;padding:3px 3px" title="Gols">G</th>'
        + '<th style="text-align:center;padding:3px 3px;font-weight:700;color:#555">Pts</th>'
        + '</tr></thead><tbody>'
        + (group.table || []).map(function (row, i) {
            return '<tr style="border-bottom:1px solid #f0f0f0' + (i < 2 ? ';background:#f0fff4' : '') + '">'
              + '<td style="padding:6px 4px 6px 0;color:#ccc;font-size:11px;font-family:monospace">' + row.position + '</td>'
              + '<td style="padding:6px 4px;font-weight:600;display:flex;align-items:center;gap:5px">' + flag(row.team && row.team.tla) + (row.team && (row.team.shortName || row.team.name) || '—') + '</td>'
              + '<td style="text-align:center;padding:6px 3px;color:#555">' + row.playedGames + '</td>'
              + '<td style="text-align:center;padding:6px 3px;color:#555">' + row.won + '</td>'
              + '<td style="text-align:center;padding:6px 3px;color:#555">' + row.draw + '</td>'
              + '<td style="text-align:center;padding:6px 3px;color:#555">' + row.lost + '</td>'
              + '<td style="text-align:center;padding:6px 3px;color:#777;font-size:11px">' + (row.goalsFor || 0) + ':' + (row.goalsAgainst || 0) + '</td>'
              + '<td style="text-align:center;padding:6px 3px;font-weight:800">' + row.points + '</td>'
              + '</tr>';
          }).join('')
        + '</tbody></table></div>';
    }

    // Layout em grid (2 colunas desktop)
    return '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:0 32px">'
      + standings.map(groupHtml).join('')
      + '</div>';
  }

  // ─── ATUALIZA PAINEL "HOJE" ───────────────────────────────────────────────────
  async function refreshHoje() {
    var today = isoDate(0);
    var r = await apiFetch('/competitions/WC/matches?dateFrom=' + today + '&dateTo=' + today).catch(function () { return null; });
    if (!r) return;
    var panel = document.getElementById('copa-panel-hoje');
    if (!panel) return;
    var matches = r.matches || [];
    var hasLive = matches.some(function (m) { return m.status === 'IN_PLAY' || m.status === 'PAUSED'; });
    panel.innerHTML = renderMatches(matches, 'Sem jogos hoje.')
      + (hasLive ? '<p style="font-size:11px;color:#bbb;text-align:right;margin-top:8px;font-family:monospace">Atualiza automaticamente a cada 60s</p>' : '');
    if (!hasLive && refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────────
  async function init() {
    var container = document.getElementById('copa2026-widget');
    if (!container) return;

    if (!API_KEY) {
      container.innerHTML = '<div style="background:#fff3cd;border:1px solid #ffc107;padding:16px 20px;font-size:14px;color:#856404;border-radius:4px">⚠️ Configure <code>window.COPA_API_KEY</code> com sua chave do football-data.org.</div>';
      return;
    }

    // Shell imediato para evitar CLS
    container.innerHTML = ''
      + '<div style="display:flex;flex-wrap:wrap;gap:0;border-bottom:2px solid #000;margin-bottom:20px">'
      + TABS.map(function (t, i) {
          var labels = { hoje: 'Hoje', proximos: 'Próximos', resultados: 'Resultados', grupos: 'Grupos' };
          var active = i === 0;
          return '<button id="copa-tab-' + t + '" onclick="copaSwitchTab(\'' + t + '\')" style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;border:none;background:none;padding:10px 14px;cursor:pointer;color:' + (active ? '#000' : '#999') + ';border-bottom:' + (active ? '2px solid #000;margin-bottom:-2px' : 'none') + '">' + labels[t] + '</button>';
        }).join('')
      + '</div>'
      + TABS.map(function (t, i) {
          return '<div id="copa-panel-' + t + '" style="display:' + (i === 0 ? 'block' : 'none') + '"><div style="text-align:center;padding:36px;color:#ccc;font-size:13px;font-family:monospace">Carregando…</div></div>';
        }).join('')
      + '<div style="text-align:right;margin-top:14px;font-size:10px;color:#ccc;font-family:monospace">dados: <a href="https://www.football-data.org" target="_blank" rel="noopener" style="color:#bbb;text-decoration:underline">football-data.org</a></div>';

    var today    = isoDate(0);
    var tomorrow = isoDate(1);
    var in7d     = isoDate(7);

    // 4 chamadas em paralelo
    var results = await Promise.allSettled([
      apiFetch('/competitions/WC/matches?dateFrom=' + today + '&dateTo=' + today),
      apiFetch('/competitions/WC/matches?dateFrom=' + tomorrow + '&dateTo=' + in7d),
      apiFetch('/competitions/WC/matches?status=FINISHED'),
      apiFetch('/competitions/WC/standings'),
    ]);

    var hojeMatches = results[0].status === 'fulfilled' ? (results[0].value.matches || []) : [];
    var proxMatches = results[1].status === 'fulfilled' ? (results[1].value.matches || []) : [];
    var finishedM   = results[2].status === 'fulfilled' ? (results[2].value.matches || []) : [];
    var standings   = results[3].status === 'fulfilled' ? (results[3].value.standings || []) : [];

    // Ordenar resultados do mais recente para o mais antigo
    finishedM.sort(function (a, b) { return new Date(b.utcDate) - new Date(a.utcDate); });

    // Painel Hoje
    var hasLive = hojeMatches.some(function (m) { return m.status === 'IN_PLAY' || m.status === 'PAUSED'; });
    var panelHoje = document.getElementById('copa-panel-hoje');
    if (panelHoje) {
      panelHoje.innerHTML = renderMatches(hojeMatches, 'Sem jogos hoje.')
        + (hasLive ? '<p style="font-size:11px;color:#bbb;text-align:right;margin-top:8px;font-family:monospace">Atualiza automaticamente a cada 60s</p>' : '');
    }

    // Auto-refresh se jogo ao vivo
    if (hasLive) {
      if (refreshTimer) clearInterval(refreshTimer);
      refreshTimer = setInterval(refreshHoje, 60000);
    }

    // Painel Próximos
    var panelProx = document.getElementById('copa-panel-proximos');
    if (panelProx) {
      panelProx.innerHTML = renderMatches(proxMatches.slice(0, 16), 'Sem jogos nos próximos 7 dias.');
    }

    // Painel Resultados
    var panelRes = document.getElementById('copa-panel-resultados');
    if (panelRes) {
      panelRes.innerHTML = renderMatches(finishedM.slice(0, 20), 'Nenhum resultado ainda.');
    }

    // Painel Grupos
    var panelGrupos = document.getElementById('copa-panel-grupos');
    if (panelGrupos) {
      if (results[3].status === 'rejected') {
        panelGrupos.innerHTML = '<p style="color:#c00;text-align:center;padding:30px;font-size:13px">Erro ao carregar grupos: ' + results[3].reason.message + '</p>';
      } else {
        panelGrupos.innerHTML = renderGroups(standings);
      }
    }

    // Se hoje sem jogos mas tem próximos, abre "Próximos"
    if (!hojeMatches.length && proxMatches.length) {
      copaSwitchTab('proximos');
    }
    // Se hoje sem jogos e sem próximos mas tem resultados, abre "Resultados"
    else if (!hojeMatches.length && !proxMatches.length && finishedM.length) {
      copaSwitchTab('resultados');
    }
  }

  // ─── TROCA DE ABA ─────────────────────────────────────────────────────────────
  window.copaSwitchTab = function (tab) {
    TABS.forEach(function (t) {
      var btn   = document.getElementById('copa-tab-' + t);
      var panel = document.getElementById('copa-panel-' + t);
      var active = t === tab;
      if (btn) {
        btn.style.color        = active ? '#000' : '#999';
        btn.style.borderBottom = active ? '2px solid #000' : 'none';
        btn.style.marginBottom = active ? '-2px' : '0';
      }
      if (panel) panel.style.display = active ? 'block' : 'none';
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
