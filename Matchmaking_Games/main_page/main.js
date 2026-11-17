const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  user: null,
  profile: null,
  preferences: null,
  settings: null,
  games: [],
  players: [],
};

const toast = (message) => {
  const element = $('#toast');
  if (!element) return;
  element.textContent = message;
  element.classList.add('show');
  window.clearTimeout(toast.timeout);
  toast.timeout = window.setTimeout(() => element.classList.remove('show'), 3200);
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401 && path !== '/api/login') {
    window.location.replace('/login?redirect=%2Fmain');
    throw new Error('Sua sessão expirou. Entre novamente.');
  }
  if (!response.ok) throw new Error(payload.message || 'Não foi possível concluir a solicitação.');
  return payload;
}

const text = (selector, value) => {
  const element = $(selector);
  if (element) element.textContent = value == null || value === '' ? '—' : String(value);
};

function makeOption(label, value = label) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  return option;
}

function setOptions(select, values, placeholder, selected = undefined) {
  if (!select) return;
  select.replaceChildren();
  if (placeholder !== null) select.append(makeOption(placeholder, ''));
  for (const item of values || []) {
    const value = typeof item === 'string' ? item : item.value;
    const label = typeof item === 'string' ? item : item.label;
    select.append(makeOption(label, value));
  }
  if (selected !== undefined) select.value = selected;
  else if (select.options.length > (placeholder === null ? 0 : 1)) select.selectedIndex = placeholder === null ? 0 : 1;
}

function gameByName(name) {
  return state.games.find((game) => game.name === name) || null;
}

function setConditionalField(id, visible) {
  const field = $(id);
  if (field) field.hidden = !visible;
}

function allPlatforms() {
  return [...new Set(state.games.flatMap((game) => game.platforms || []))];
}

function updateFilterPlatform() {
  const selected = $('#filter-platform').value;
  const game = gameByName($('#filter-game').value);
  setOptions($('#filter-platform'), game?.platforms || allPlatforms(), 'Todas', selected);
}

function updatePreferredPlatform() {
  const gameName = $('#preferred-game').value || $('#profile-game').value;
  const game = gameByName(gameName);
  const selected = $('#preferred-platform').value || state.preferences?.platform || '';
  setOptions($('#preferred-platform'), game?.platforms || allPlatforms(), 'Usar a do perfil', selected);
}

function setGameSelects() {
  const names = state.games.map((game) => game.name);
  setOptions($('#profile-game'), names, null, state.profile?.game || names[0]);
  setOptions($('#preferred-game'), names, 'Usar o jogo do perfil', state.preferences?.game || '');
  setOptions($('#filter-game'), names, 'Todos os jogos', '');
  updateGameFields(state.profile?.game || names[0], true);
  updatePreferredPlatform();
  updateFilterPlatform();
  updateRankFilter();
  updateGameFilters(true);
}

function updateGameFields(gameName, keepValues = false) {
  const game = gameByName(gameName);
  if (!game) return;
  const saved = state.profile || {};
  const modeSelect = $('#profile-mode');
  const preserveForm = keepValues && $('#profile-game').value === gameName && modeSelect.options.length > 0;
  const currentModeValue = preserveForm ? modeSelect.value : String(saved.mode || '');
  const previousRenderedMode = modeSelect.dataset.renderedMode || '';
  const modeChanged = preserveForm && previousRenderedMode && currentModeValue !== previousRenderedMode;
  const modesShareRank = currentModeValue === previousRenderedMode || game.rankSharedAcrossModes ||
    game.rankModeGroups?.some((group) => group.includes(currentModeValue) && group.includes(previousRenderedMode));
  const resetRankForMode = Boolean(modeChanged && (game.rankResetOnModeChange || (game.rankModeGroups?.length && !modesShareRank)));
  const currentLevel = $('#profile-rating').disabled ? $('#profile-level').value : $('#profile-rating').value;
  const favoriteValue = game.freeTextFavorite ? $('#profile-favorite-text').value : $('#profile-favorite').value;
  const previous = keepValues ? (preserveForm ? {
    ...saved,
    platform: $('#profile-platform').value,
    mode: currentModeValue,
    role: $('#profile-role').value,
    secondaryRole: $('#profile-secondary-role').value,
    favorite: favoriteValue,
    level: resetRankForMode ? '' : currentLevel,
  } : saved) : {};
  const platformSelect = $('#profile-platform');
  const existingPlatform = platformSelect.value || previous.platform || '';
  setOptions(platformSelect, game.platforms || allPlatforms(), null, existingPlatform);

  const modeOptions = game.modes || [];
  const hasModes = modeOptions.length > 0;
  const currentMode = preserveForm ? currentModeValue : (previous.mode || '');
  $('#game-mode-label').textContent = game.modeLabel || 'Modo de jogo';
  setConditionalField('#field-game-mode', hasModes);
  modeSelect.required = hasModes;
  setOptions(modeSelect, modeOptions, null, currentMode || modeOptions[0] || '');

  const roleOptions = game.roles || [];
  const secondaryOptions = game.secondaryRoles || [];
  const favoriteOptions = game.favorites || [];
  $('#game-role-label').textContent = game.roleLabel || 'Função / posição';
  $('#secondary-role-label').textContent = game.secondaryRoleLabel || 'Função secundária';
  $('#game-specialty-label').textContent = game.favoriteLabel || 'Especialidade';
  setConditionalField('#field-game-role', roleOptions.length > 0);
  setConditionalField('#field-secondary-role', secondaryOptions.length > 0);
  setOptions($('#profile-role'), roleOptions, 'Selecione uma opção', previous.role || '');
  setOptions($('#profile-secondary-role'), secondaryOptions, 'Opcional', previous.secondary_role || previous.secondaryRole || '');

  const favoriteSelect = $('#profile-favorite');
  const favoriteText = $('#profile-favorite-text');
  const freeTextFavorite = Boolean(game.freeTextFavorite);
  const favoriteVisible = freeTextFavorite || favoriteOptions.length > 0;
  const favoriteModeAllowed = !game.favoriteModes || game.favoriteModes.includes(modeSelect.value);
  setConditionalField('#field-game-specialty', favoriteVisible && favoriteModeAllowed);
  if (freeTextFavorite) {
    favoriteSelect.hidden = true; favoriteSelect.disabled = true;
    favoriteText.hidden = false; favoriteText.disabled = !favoriteModeAllowed; favoriteText.value = previous.favorite || '';
    favoriteText.required = Boolean(favoriteModeAllowed && game.rankScope === 'favorite' && modeSelect.value !== game.ratingMode);
    $('#game-specialties').replaceChildren(...favoriteOptions.map((item) => makeOption(item)));
    $('#profile-favorite').parentElement.htmlFor = 'profile-favorite-text';
  } else {
    favoriteSelect.hidden = false; favoriteSelect.disabled = !favoriteModeAllowed; favoriteSelect.required = false;
    favoriteText.hidden = true; favoriteText.disabled = true; favoriteText.required = false; favoriteText.value = '';
    setOptions(favoriteSelect, favoriteOptions, 'Opcional', previous.favorite || '');
    $('#profile-favorite').parentElement.htmlFor = 'profile-favorite';
  }

  $('#profile-level-label').textContent = game.ratingMode && modeSelect.value === game.ratingMode ? (game.ratingLabel || game.rankLabel) : (game.rankLabel || 'Rank');
  $('#rank-help').textContent = game.ratingMode && modeSelect.value === game.ratingMode ? (game.ratingHelp || game.rankHelp || '') : (game.rankHelp || '');
  const usesRating = Boolean(game.ratingMode && modeSelect.value === game.ratingMode);
  const rankSelect = $('#profile-level');
  const ratingInput = $('#profile-rating');
  rankSelect.hidden = usesRating; rankSelect.disabled = usesRating; rankSelect.required = !usesRating;
  ratingInput.hidden = !usesRating; ratingInput.disabled = !usesRating; ratingInput.required = usesRating;
  ratingInput.min = String(game.ratingMin ?? 0); ratingInput.max = String(game.ratingMax ?? 100000);
  ratingInput.value = usesRating && /^\d+$/.test(String(previous.level || '')) ? previous.level : '';
  setOptions(rankSelect, game.rankOptions || [], 'Selecione seu rank', usesRating ? '' : previous.level || '');
  modeSelect.dataset.renderedMode = modeSelect.value;
  updatePreferredPlatform();
}

function updateRankFilter() {
  const game = gameByName($('#filter-game').value);
  const select = $('#filter-level');
  const rating = $('#filter-rating');
  const mode = $('#filter-mode')?.value || '';
  const usesRating = Boolean(game?.ratingMode && mode === game.ratingMode);
  setOptions(select, game?.rankOptions || [], game ? 'Todos os ranks' : 'Escolha um jogo para filtrar rank', '');
  select.hidden = usesRating; select.disabled = !game || usesRating;
  rating.hidden = !usesRating; rating.disabled = !usesRating;
  rating.min = String(game?.ratingMin ?? 0); rating.max = String(game?.ratingMax ?? 100000);
  if (!usesRating) rating.value = '';
  $('#filter-rank-help').textContent = usesRating ? (game.ratingHelp || 'Informe o CS Rating mínimo.') : '';
}

function updateGameFilters(reset = false) {
  const game = gameByName($('#filter-game').value);
  const mode = $('#filter-mode')?.value || '';
  const roleSelect = $('#filter-role');
  const favoriteSelect = $('#filter-specialty');
  const favoriteText = $('#filter-specialty-text');
  const selectedRole = reset ? '' : roleSelect.value;
  const selectedFavorite = reset ? '' : favoriteSelect.value;
  const selectedText = reset ? '' : favoriteText.value;
  const roleOptions = game?.roles || [];
  const favoriteOptions = game?.favorites || [];
  $('#filter-role-label').textContent = game?.roleLabel || 'Função / rota';
  $('#filter-specialty-label').textContent = game?.favoriteLabel || 'Agente / personagem / mapa';
  setConditionalField('#filter-role-field', Boolean(game && roleOptions.length));
  setOptions(roleSelect, roleOptions, 'Todas as funções', selectedRole);
  roleSelect.disabled = !game || !roleOptions.length;

  const freeTextFavorite = Boolean(game?.freeTextFavorite);
  const favoriteModeAllowed = !game?.favoriteModes || !mode || game.favoriteModes.includes(mode);
  const favoriteVisible = Boolean(game && (favoriteOptions.length || freeTextFavorite) && favoriteModeAllowed);
  setConditionalField('#filter-specialty-field', favoriteVisible);
  if (freeTextFavorite) {
    favoriteSelect.hidden = true; favoriteSelect.disabled = true;
    favoriteText.hidden = false; favoriteText.disabled = !favoriteVisible; favoriteText.value = selectedText;
    $('#filter-specialty-field').htmlFor = 'filter-specialty-text';
    $('#filter-specialties').replaceChildren(...favoriteOptions.map((item) => makeOption(item)));
  } else {
    favoriteSelect.hidden = false; favoriteSelect.disabled = !favoriteVisible;
    favoriteText.hidden = true; favoriteText.disabled = true; favoriteText.value = '';
    $('#filter-specialty-field').htmlFor = 'filter-specialty';
    setOptions(favoriteSelect, favoriteOptions, 'Todas as opções', selectedFavorite);
  }
}

function formatInitials(value) {
  return String(value || 'DU').trim().slice(0, 2).toLocaleUpperCase('pt-BR');
}

function fillProfile() {
  const profile = state.profile || {};
  const nickname = profile.nickname || state.user?.username || 'Jogador';
  text('#user-name', nickname);
  text('#profile-title', nickname);
  text('#user-avatar', formatInitials(nickname));
  text('#profile-avatar', formatInitials(nickname));
  $('#nickname').value = nickname;
  $('#profile-game').value = profile.game || state.games[0]?.name || '';
  $('#profile-platform').value = profile.platform || 'PC';
  $('#profile-style').value = profile.style || 'Casual';
  $('#profile-availability').value = profile.availability || 'Noites';
  updateGameFields(profile.game || state.games[0]?.name, true);
  $('#preferred-game').value = state.preferences?.game || '';
  $('#preferred-platform').value = state.preferences?.platform || '';
  $('#preferred-time').value = state.preferences?.time || '';
}

function createTag(label, value) {
  if (!value) return null;
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = `${label}: ${value}`;
  return tag;
}

function createPlayerCard(player) {
  const article = document.createElement('article');
  article.className = 'player-card panel';
  const top = document.createElement('div');
  top.className = 'player-top';
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = formatInitials(player.nickname || player.username);
  const score = document.createElement('span');
  score.className = 'compatibility';
  score.textContent = `${Number(player.compatibility || 0)}% compatível`;
  top.append(avatar, score);
  const title = document.createElement('h3');
  title.textContent = player.nickname || player.username || 'Jogador';
  const subtitle = document.createElement('p');
  subtitle.textContent = [player.game, player.platform].filter(Boolean).join(' · ');
  const tags = document.createElement('div');
  tags.className = 'tags';
  [
    createTag('Rank', player.level),
    createTag('Modo', player.mode),
    createTag(player.roleLabel || 'Função', player.role),
    createTag('Secundária', player.secondary_role),
    createTag(player.favoriteLabel || 'Principal', player.favorite),
    createTag('Estilo', player.style),
    player.availability ? createTag('Disponibilidade', player.availability) : null,
  ].filter(Boolean).forEach((tag) => tags.append(tag));
  const actions = document.createElement('div');
  actions.className = 'card-actions';
  const connect = document.createElement('button');
  connect.type = 'button';
  connect.className = 'small-button connect';
  connect.dataset.id = String(player.user_id);
  connect.textContent = '＋ Conectar';
  const view = document.createElement('button');
  view.type = 'button';
  view.className = 'small-button secondary view-profile';
  view.textContent = 'Ver perfil';
  view.addEventListener('click', () => showProfileModal(player));
  actions.append(connect, view);
  article.append(top, title, subtitle, tags, actions);
  connect.addEventListener('click', async () => {
    connect.disabled = true;
    try {
      const result = await api('/api/friend-request', { method: 'POST', body: JSON.stringify({ receiverId: Number(player.user_id) }) });
      const friendshipCreated = result.message === 'Amizade criada.' || result.message === 'Amizade aceita.';
      connect.textContent = friendshipCreated ? 'Amizade feita' : 'Solicitação enviada';
      toast(result.message || 'Solicitação enviada.');
      if (friendshipCreated) await loadFriends();
    } catch (error) {
      connect.disabled = false;
      toast(error.message);
    }
  });
  return article;
}

function renderPlayers(players, target = $('#player-grid')) {
  target.replaceChildren();
  if (!players.length) {
    const empty = document.createElement('article');
    empty.className = 'panel empty-panel';
    const title = document.createElement('h3');
    title.textContent = 'Nenhum jogador encontrado';
    const message = document.createElement('p');
    message.textContent = 'Ajuste os filtros ou volte mais tarde para novas combinações.';
    empty.append(title, message);
    target.append(empty);
  } else {
    players.forEach((player) => target.append(createPlayerCard(player)));
  }
  if (target.id === 'player-grid') text('#result-count', `${players.length} ${players.length === 1 ? 'jogador encontrado' : 'jogadores encontrados'}`);
}

async function loadPlayers(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== '' && value != null) params.set(key, String(value)); });
  const result = await api(`/api/players${params.size ? `?${params}` : ''}`);
  state.players = result.players || [];
  renderPlayers(state.players);
  renderPlayers(state.players.slice(0, 3), $('#highlight-grid'));
}

function showView(name) {
  $$('.view').forEach((view) => view.classList.toggle('active', view.id === `view-${name}`));
  $$('.nav-item[data-view]').forEach((item) => item.classList.toggle('active', item.dataset.view === name));
  const titles = { inicio: 'Visão geral', perfil: 'Meu perfil', encontrar: 'Encontrar jogadores', amigos: 'Amigos', configuracoes: 'Configurações' };
  text('#page-title', titles[name] || 'DuoPlay');
  $('.sidebar').classList.remove('open');
  $('#menu-toggle').setAttribute('aria-expanded', 'false');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (name === 'amigos') loadFriends().catch((error) => toast(error.message));
  if (name === 'encontrar') loadPlayers().catch((error) => toast(error.message));
}

function showProfileModal(profile) {
  const modal = $('#profile-modal');
  text('#modal-profile-name', profile.nickname || profile.username || 'Jogador');
  text('#modal-profile-avatar', formatInitials(profile.nickname || profile.username));
  text('#modal-profile-game', profile.game);
  text('#modal-profile-platform', profile.platform);
  text('#modal-profile-level', profile.level);
  text('#modal-profile-mode', profile.mode);
  text('#modal-profile-role', profile.role);
  text('#modal-profile-secondary-role', profile.secondary_role);
  text('#modal-profile-favorite', profile.favorite);
  text('#modal-profile-availability', profile.availability);
  text('#modal-profile-compatibility', profile.compatibility == null ? '' : `${profile.compatibility}%`);
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  $('#close-profile-modal').focus();
}

function closeProfileModal() {
  const modal = $('#profile-modal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function renderFriends(data) {
  const list = $('#friend-list');
  list.replaceChildren();
  const requests = data.requests || [];
  const friends = data.friends || [];
  if (!requests.length && !friends.length) {
    const empty = document.createElement('div');
    empty.className = 'friend-request empty-state';
    const plus = document.createElement('div');
    plus.className = 'avatar'; plus.textContent = '+';
    const content = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = 'Sua lista ainda está vazia';
    const message = document.createElement('p'); message.textContent = 'Quando alguém enviar um convite, ele aparecerá aqui.';
    content.append(title, message); empty.append(plus, content); list.append(empty); return;
  }
  for (const request of requests) {
    const row = document.createElement('div'); row.className = 'friend-request';
    const avatar = document.createElement('div'); avatar.className = 'avatar'; avatar.textContent = formatInitials(request.sender_name);
    const identity = document.createElement('div');
    const name = document.createElement('strong'); name.textContent = request.sender_name || 'Jogador';
    const label = document.createElement('p'); label.textContent = 'Solicitação pendente'; identity.append(name, label);
    const accept = document.createElement('button'); accept.type = 'button'; accept.className = 'small-button accept'; accept.dataset.action = 'accept'; accept.dataset.id = String(request.id); accept.textContent = 'Aceitar';
    const decline = document.createElement('button'); decline.type = 'button'; decline.className = 'small-button decline'; decline.dataset.action = 'decline'; decline.dataset.id = String(request.id); decline.textContent = 'Recusar';
    row.append(avatar, identity, accept, decline); list.append(row);
  }
  for (const friend of friends) {
    const row = document.createElement('div'); row.className = 'friend-row';
    const avatar = document.createElement('div'); avatar.className = 'avatar'; avatar.textContent = formatInitials(friend.nickname || friend.username);
    const identity = document.createElement('div');
    const name = document.createElement('strong'); name.textContent = friend.nickname || friend.username || 'Jogador';
    const info = document.createElement('p'); info.textContent = [friend.game, friend.platform].filter(Boolean).join(' · '); identity.append(name, info);
    const view = document.createElement('button'); view.type = 'button'; view.className = 'small-button secondary'; view.textContent = 'Ver perfil';
    view.addEventListener('click', () => showProfileModal(friend));
    row.append(avatar, identity, view); list.append(row);
  }
}

async function loadFriends() {
  const result = await api('/api/friends');
  renderFriends(result);
}

async function loadSettings() {
  const { settings } = await api('/api/settings');
  state.settings = settings;
  $('#setting-public').checked = Boolean(settings.profile_public);
  $('#setting-availability').checked = Boolean(settings.show_availability);
}

function applyProfileData(profile) {
  state.profile = profile || {};
  fillProfile();
}

async function initialize() {
  try {
    const [me, catalog] = await Promise.all([api('/api/me'), api('/api/games')]);
    state.user = me.user;
    state.profile = me.profile || {};
    state.preferences = me.preferences || {};
    state.settings = me.settings || {};
    state.games = catalog.games || [];
    if (!state.games.length) throw new Error('O catálogo de jogos não foi carregado.');
    const today = new Date();
    text('#dia_mes', today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }));
    setGameSelects();
    fillProfile();
    $('#filter-game').addEventListener('change', () => {
      const game = gameByName($('#filter-game').value);
      const modeField = $('#filter-mode');
      const modeWrapper = $('#filter-mode-field');
      if (modeField && modeWrapper) {
        setOptions(modeField, game?.modes || [], 'Todos os modos', '');
        modeWrapper.hidden = !game?.modes?.length;
      }
      updateFilterPlatform();
      updateRankFilter();
      updateGameFilters(true);
    });
    $('#filter-mode')?.addEventListener('change', () => { updateRankFilter(); updateGameFilters(); });
    $('#profile-game').addEventListener('change', () => updateGameFields($('#profile-game').value));
    $('#profile-mode').addEventListener('change', () => updateGameFields($('#profile-game').value, true));
    $('#preferred-game').addEventListener('change', updatePreferredPlatform);
    $$('.nav-item[data-view]').forEach((item) => item.addEventListener('click', () => showView(item.dataset.view)));
    $$('[data-go]').forEach((item) => item.addEventListener('click', () => showView(item.dataset.go)));
    $('#menu-toggle').addEventListener('click', () => {
      const open = $('.sidebar').classList.toggle('open');
      $('#menu-toggle').setAttribute('aria-expanded', String(open));
    });
    $('#logout-button').addEventListener('click', async () => {
      try { await api('/api/logout', { method: 'POST' }); } catch { /* Continua para o login mesmo se a rede cair. */ }
      window.location.replace('/login');
    });
    $('#close-profile-modal').addEventListener('click', closeProfileModal);
    $('#profile-modal').addEventListener('click', (event) => { if (event.target === $('#profile-modal')) closeProfileModal(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeProfileModal(); });
    $('#profile-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector('[type="submit"]');
      const status = $('#profile-status');
      button.disabled = true; status.textContent = 'Salvando…';
      const formData = new FormData(event.currentTarget);
      const profile = Object.fromEntries(formData.entries());
      profile.level = $('#profile-rating').disabled ? $('#profile-level').value : $('#profile-rating').value;
      const preferences = {
        game: $('#preferred-game').value,
        platform: $('#preferred-platform').value,
        time: $('#preferred-time').value,
      };
      try {
        await api('/api/profile', { method: 'PUT', body: JSON.stringify(profile) });
        await api('/api/preferences', { method: 'PUT', body: JSON.stringify(preferences) });
        state.profile = profile; state.preferences = preferences;
        fillProfile(); status.textContent = 'Perfil e preferências salvos.'; toast('Seu perfil foi atualizado.');
        await loadPlayers();
      } catch (error) {
        status.textContent = error.message; toast(error.message);
      } finally { button.disabled = false; }
    });
    $('#filter-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const game = $('#filter-game').value;
      const filters = {
        game,
        platform: $('#filter-platform').value,
        level: $('#filter-level').disabled ? '' : $('#filter-level').value,
        mode: $('#filter-mode')?.disabled ? '' : $('#filter-mode')?.value,
        role: $('#filter-role').disabled ? '' : $('#filter-role').value,
        favorite: $('#filter-specialty-text').disabled ? ($('#filter-specialty').disabled ? '' : $('#filter-specialty').value) : $('#filter-specialty-text').value.trim(),
        minRating: $('#filter-rating')?.disabled ? '' : $('#filter-rating').value,
      };
      try { await loadPlayers(filters); } catch (error) { toast(error.message); }
    });
    $('#clear-filters').addEventListener('click', () => {
      $('#filter-form').reset();
      $('#filter-game').value = '';
      $('#filter-mode-field').hidden = true;
      updateFilterPlatform();
      updateRankFilter();
      updateGameFilters(true);
      loadPlayers().catch((error) => toast(error.message));
    });
    $('#friend-list').addEventListener('click', async (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      button.disabled = true;
      try {
        const action = button.dataset.action;
        await api(`/api/friends/${action}`, { method: 'POST', body: JSON.stringify({ requestId: Number(button.dataset.id) }) });
        toast(action === 'accept' ? 'Solicitação aceita.' : 'Solicitação recusada.');
        await loadFriends();
        await loadPlayers();
      } catch (error) { button.disabled = false; toast(error.message); }
    });
    $('#settings-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
        const settings = { profile_public: $('#setting-public').checked, show_availability: $('#setting-availability').checked };
        const result = await api('/api/settings', { method: 'PUT', body: JSON.stringify(settings) });
        state.settings = result.settings; toast('Configurações salvas.');
      } catch (error) { toast(error.message); }
    });
    $('#clear-account').addEventListener('click', async () => {
      if (!window.confirm('Tem certeza que deseja excluir sua conta? Esta ação é permanente.')) return;
      try {
        await api('/api/account', { method: 'DELETE' });
        window.location.replace('/cadastro');
      } catch (error) { toast(error.message); }
    });
    renderFriends({ requests: [], friends: [] });
    await Promise.all([loadSettings(), loadPlayers()]);
  } catch (error) {
    if (error.message !== 'Sua sessão expirou. Entre novamente.') toast(error.message || 'Não foi possível carregar a aplicação.');
  }
}

initialize();
