if (localStorage.getItem('duoplayLoggedIn') !== 'true') {
  window.location.replace('../login.html?redirect=main');
}

const user = JSON.parse(localStorage.getItem('duoplayUser') || '{"name":"Jogador"}');
const profile = JSON.parse(localStorage.getItem('duoplayProfile') || '{}');
const players = [
  { name: 'Luna Martins', initials: 'LM', game: 'Valorant', platform: 'PC', level: 'Diamante', style: 'Competitivo', time: 'Noites', score: 96, color: 'pink' },
  { name: 'Caio Nunes', initials: 'CN', game: 'Valorant', platform: 'PC', level: 'Avançado', style: 'Estratégico', time: 'Noites', score: 91, color: 'blue' },
  { name: 'Nina Costa', initials: 'NC', game: 'League of Legends', platform: 'PC', level: 'Diamante', style: 'Cooperativo', time: 'Fins de semana', score: 87, color: 'gold' },
  { name: 'Theo Rocha', initials: 'TR', game: 'Fortnite', platform: 'PlayStation', level: 'Intermediário', style: 'Casual', time: 'Tardes', score: 82, color: 'pink' },
  { name: 'Bia Martins', initials: 'BM', game: 'Valorant', platform: 'Xbox', level: 'Avançado', style: 'Competitivo', time: 'Noites', score: 79, color: 'blue' },
  { name: 'Ivo Santos', initials: 'IS', game: 'League of Legends', platform: 'PC', level: 'Intermediário', style: 'Estratégico', time: 'Manhãs', score: 74, color: 'gold' }
];
const $ = (selector) => document.querySelector(selector);
const toast = (text) => { const element = $('#toast'); element.textContent = text; element.classList.add('show'); setTimeout(() => element.classList.remove('show'), 2600); };
const playerCard = (player) => `<article class="player-card"><div class="player-top"><div class="avatar ${player.color}">${player.initials}</div><span class="compatibility">${player.score}% compatível</span></div><h3>${player.name}</h3><p>${player.game} · ${player.platform}</p><div class="tags"><span class="tag">${player.level}</span><span class="tag">${player.style}</span><span class="tag">${player.time}</span></div><button class="small-button connect" data-name="${player.name}">+ Conectar</button></article>`;
function renderPlayers(list = players) { $('#player-grid').innerHTML = list.map(playerCard).join(''); $('#result-count').textContent = `${list.length} jogadores encontrados`; document.querySelectorAll('.connect').forEach((button) => button.addEventListener('click', () => { button.textContent = 'Solicitação enviada'; button.disabled = true; toast(`Convite enviado para ${button.dataset.name}`); })); }
function renderHighlights() { $('#highlight-grid').innerHTML = players.slice(0, 3).map((player) => `<article class="match-card"><div class="card-top"><div class="avatar ${player.color}">${player.initials}</div><span class="compatibility">${player.score}%</span></div><h3>${player.name}</h3><p>${player.game} · ${player.platform}</p><div class="tags"><span class="tag">${player.level}</span><span class="tag">${player.style}</span></div></article>`).join(''); }
function showView(name) { document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === `view-${name}`)); document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === name)); const titles = { inicio: 'Visão geral', perfil: 'Meu perfil', preferencias: 'Preferências', encontrar: 'Encontrar jogadores', amigos: 'Amigos', configuracoes: 'Configurações' }; $('#page-title').textContent = titles[name]; $('.sidebar').classList.remove('open'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function fillProfile() { const nickname = profile.nickname || user.name || 'Jogador'; $('#user-name').textContent = nickname; const initials = nickname.slice(0, 2).toUpperCase(); $('#user-avatar').textContent = initials; $('#profile-avatar').textContent = initials; $('#profile-title').textContent = nickname; $('#nickname').value = nickname; if (profile.game) document.querySelector('[name="game"]').value = profile.game; if (profile.platform) document.querySelector('[name="platform"]').value = profile.platform; if (profile.level) document.querySelector('[name="level"]').value = profile.level; if (profile.style) document.querySelector('[name="style"]').value = profile.style; if (profile.availability) document.querySelector('[name="availability"]').value = profile.availability; }

document.querySelectorAll('[data-view]').forEach((item) => item.addEventListener('click', () => showView(item.dataset.view)));
document.querySelectorAll('[data-go]').forEach((item) => item.addEventListener('click', () => showView(item.dataset.go)));
$('#menu-toggle').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
$('#profile-form').addEventListener('submit', (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); localStorage.setItem('duoplayProfile', JSON.stringify(data)); Object.assign(profile, data); fillProfile(); toast('Perfil atualizado com sucesso'); });
$('#preference-form').addEventListener('submit', (event) => { event.preventDefault(); toast('Preferências salvas. Vamos buscar combinações melhores.'); });
document.querySelectorAll('.choice-group').forEach((group) => group.addEventListener('click', (event) => { if (event.target.classList.contains('choice')) { group.querySelectorAll('.choice').forEach((choice) => choice.classList.remove('active')); event.target.classList.add('active'); } }));
$('#filter-form').addEventListener('submit', (event) => { event.preventDefault(); const game = $('#filter-game').value; const platform = $('#filter-platform').value; const level = $('#filter-level').value; const result = players.filter((player) => (game === 'Todos os jogos' || player.game === game) && (platform === 'Todas' || player.platform === platform) && (level === 'Todos os níveis' || player.level === level)); renderPlayers(result); });
document.querySelectorAll('.accept').forEach((button) => button.addEventListener('click', () => { button.closest('.friend-request').remove(); toast('Solicitação aceita. Marina agora é sua amiga.'); }));
$('#clear-account').addEventListener('click', () => { localStorage.clear(); toast('Dados locais apagados'); setTimeout(() => { window.location.href = '../cadastro.html'; }, 1000); });
renderHighlights(); renderPlayers(); fillProfile();
