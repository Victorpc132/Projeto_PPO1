const storedUser = JSON.parse(localStorage.getItem('duoplayUser') || 'null');
if (!storedUser) {
  window.location.replace('/login?redirect=main');
}

const user = storedUser || { id: 0, username: 'Jogador', email: '' };
const profile = JSON.parse(localStorage.getItem('duoplayProfile') || '{}');
let players = [];
const $ = (selector) => document.querySelector(selector);

const toast = (text) => {
  const element = $('#toast');
  if (!element) return;
  element.textContent = text;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 2600);
};

const logout = (redirectTo = '/login') => {
  localStorage.removeItem('duoplayUser');
  localStorage.removeItem('duoplayLoggedIn');
  localStorage.removeItem('duoplayProfile');
  window.location.href = redirectTo;
};

$('.logout-link')?.addEventListener('click', (event) => {
  event.preventDefault();
  logout();
});

const setPasswordVisibility = (inputSelector, toggleSelector) => {
  const passwordInput = document.querySelector(inputSelector);
  const toggleButton = document.querySelector(toggleSelector);
  if (!passwordInput || !toggleButton) return;

  toggleButton.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggleButton.textContent = isPassword ? '🙈' : '👁️';
    toggleButton.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
  });
};

setPasswordVisibility('#password', '#password-toggle');
setPasswordVisibility('#password-confirm', '#password-confirm-toggle');

async function loadProfile() {
  const response = await fetch(`/api/profile?userId=${user.id}`);
  const data = await response.json();

  if (data?.profile) {
    Object.assign(profile, data.profile);
    localStorage.setItem('duoplayProfile', JSON.stringify(data.profile));
  }

  fillProfile();
}

async function loadPreferences() {
  const response = await fetch(`/api/preferences?userId=${user.id}`);
  const data = await response.json();

  if (data?.preferences) {
    const pref = data.preferences;
    document.querySelectorAll('.choice').forEach((choice) => {
      const choiceText = choice.textContent.trim();
      if (choiceText === pref.game || choiceText === pref.platform || choiceText === pref.time) {
        choice.classList.add('active');
      }
    });
  }
}

async function loadPlayers(filters = {}) {
  const params = new URLSearchParams({ userId: String(user.id), ...filters });
  const response = await fetch(`/api/players?${params.toString()}`);
  const data = await response.json();
  players = data?.players || [];
  renderPlayers(players);
}

const playerCard = (player) => `<article class="player-card"><div class="player-top"><div class="avatar ${player.color || 'blue'}">${(player.nickname || player.username || 'JD').slice(0, 2).toUpperCase()}</div><span class="compatibility">${Number(player.compatibility ?? 80)}% compatível</span></div><h3>${player.nickname || player.username || 'Jogador'}</h3><p>${player.game || 'Valorant'} · ${player.platform || 'PC'}</p><div class="tags"><span class="tag">${player.level || 'Intermediário'}</span><span class="tag">${player.style || 'Estratégico'}</span><span class="tag">${player.availability || 'Noites'}</span></div><div class="card-actions"><button class="small-button connect" data-id="${player.user_id}" data-name="${player.nickname || player.username || 'Jogador'}">+ Conectar</button><button class="small-button secondary view-profile" data-profile='${JSON.stringify(player).replace(/'/g, '&apos;')}'>Ver perfil</button></div></article>`;

function renderPlayers(list = players) {
  $('#player-grid').innerHTML = list.length ? list.map(playerCard).join('') : '<article class="panel empty-panel"><h3>Nenhum jogador encontrado</h3><p>Ajuste os filtros ou volte mais tarde para ver novas combinações.</p></article>';
  $('#result-count').textContent = `${list.length} jogadores encontrados`;
  document.querySelectorAll('.connect').forEach((button) => button.addEventListener('click', async () => {
    const targetId = Number(button.dataset.id);
    button.textContent = 'Solicitação enviada';
    button.disabled = true;
    toast(`Convite enviado para ${button.dataset.name}`);
    await fetch('/api/friend-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: user.id, receiverId: targetId })
    });
  }));

  document.querySelectorAll('.view-profile').forEach((button) => {
    button.addEventListener('click', () => {
      const raw = button.dataset.profile;
      try {
        const profileData = JSON.parse(raw.replace(/&apos;/g, "'"));
        showProfileModal(profileData);
      } catch (error) {
        toast('Não foi possível abrir o perfil.');
      }
    });
  });
}

function renderHighlights() {
  $('#highlight-grid').innerHTML = '<article class="panel empty-panel"><h3>Sem destaques agora</h3><p>Depois que o sistema tiver perfis cadastrados, os matches aparecerão aqui.</p></article>';
}

function showView(name) {
  document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === `view-${name}`));
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === name));
  const titles = { inicio: 'Visão geral', perfil: 'Meu perfil', encontrar: 'Encontrar jogadores', amigos: 'Amigos', configuracoes: 'Configurações' };
  $('#page-title').textContent = titles[name];
  $('.sidebar').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function fillProfile() {
  const nickname = profile.nickname || user.username || 'Jogador';
  $('#user-name').textContent = nickname;
  const initials = nickname.slice(0, 2).toUpperCase();
  $('#user-avatar').textContent = initials;
  $('#profile-avatar').textContent = initials;
  $('#profile-title').textContent = nickname;
  $('#nickname').value = nickname;
  if (profile.game) document.querySelector('[name="game"]').value = profile.game;
  if (profile.platform) document.querySelector('[name="platform"]').value = profile.platform;
  if (profile.level) document.querySelector('[name="level"]').value = profile.level;
  if (profile.style) document.querySelector('[name="style"]').value = profile.style;
  if (profile.availability) document.querySelector('[name="availability"]').value = profile.availability;

  document.querySelectorAll('.choice').forEach((choice) => {
    const text = choice.textContent.trim();
    const isMatching = [profile.game, profile.platform, profile.availability].includes(text)
      || (text === profile.game || text === profile.platform || text === profile.availability);
    choice.classList.toggle('active', isMatching);
  });
}

async function loadFriends() {
  const response = await fetch(`/api/friends?userId=${user.id}`);
  const data = await response.json();
  const requests = data?.requests || [];
  const friends = data?.friends || [];

  const list = document.querySelector('.friend-list');
  if (!list) return;

  if (!requests.length && !friends.length) {
    list.innerHTML = `
      <div class="friend-request empty-state">
        <div class="avatar pink">+</div>
        <div>
          <strong>Nenhuma solicitação no momento</strong>
          <p>Quando alguém mandar convite, ele aparecerá aqui.</p>
        </div>
      </div>
    `;
    return;
  }

  const requestsMarkup = requests.map((request) => `
    <div class="friend-request">
      <div class="avatar blue">${String(request.sender_name || 'JD').slice(0, 2).toUpperCase()}</div>
      <div>
        <strong>${request.sender_name || 'Jogador'}</strong>
        <p>Solicitação pendente</p>
      </div>
      <button class="small-button accept" data-action="accept" data-request-id="${request.id}">Aceitar</button>
      <button class="small-button decline" data-action="decline" data-request-id="${request.id}">Recusar</button>
    </div>
  `).join('');

  const friendsMarkup = friends.map((friend) => `
    <div class="friend-row">
      <div class="avatar gold">${String(friend.nickname || friend.username || 'JD').slice(0, 2).toUpperCase()}</div>
      <div>
        <strong>${friend.nickname || friend.username || 'Jogador'}</strong>
        <p>${friend.game || 'Valorant'} · ${friend.platform || 'PC'}</p>
      </div>
      <span class="online-dot"></span>
      <button class="small-button secondary view-profile" data-profile='${JSON.stringify(friend).replace(/'/g, '&apos;')}'>Ver perfil</button>
    </div>
  `).join('');

  list.innerHTML = `${requestsMarkup}${friendsMarkup}`;

  document.querySelectorAll('.view-profile').forEach((button) => {
    button.addEventListener('click', () => {
      const raw = button.dataset.profile;
      try {
        const profileData = JSON.parse(raw.replace(/&apos;/g, "'"));
        showProfileModal(profileData);
      } catch (error) {
        toast('Não foi possível abrir o perfil.');
      }
    });
  });

  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', async () => {
      const requestId = Number(button.dataset.requestId);
      const action = button.dataset.action;
      const endpoint = action === 'accept' ? '/api/friends/accept' : '/api/friends/decline';

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, userId: user.id })
      });

      toast(action === 'accept' ? 'Solicitação aceita.' : 'Solicitação recusada.');
      loadFriends();
    });
  });
}

let selectedProfile = null;

const showProfileModal = (profileData) => {
  const modal = $('#profile-modal');
  if (!modal || !profileData) return;

  selectedProfile = profileData;
  $('#modal-profile-name').textContent = profileData.nickname || profileData.username || 'Jogador';
  $('#modal-profile-avatar').textContent = String(profileData.nickname || profileData.username || 'JD').slice(0, 2).toUpperCase();
  $('#modal-profile-game').textContent = profileData.game || 'Valorant';
  $('#modal-profile-platform').textContent = profileData.platform || 'PC';
  $('#modal-profile-level').textContent = profileData.level || 'Intermediário';
  $('#modal-profile-style').textContent = profileData.style || 'Estratégico';
  $('#modal-profile-availability').textContent = profileData.availability || 'Noites';
  $('#modal-profile-compatibility').textContent = `${Number(profileData.compatibility ?? 92)}%`;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
};

const closeProfileModal = () => {
  const modal = $('#profile-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
};

$('#close-profile-modal')?.addEventListener('click', closeProfileModal);
$('#profile-modal')?.addEventListener('click', (event) => {
  if (event.target === $('#profile-modal')) closeProfileModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !$('#profile-modal')?.classList.contains('hidden')) {
    closeProfileModal();
  }
});

document.querySelectorAll('[data-view]').forEach((item) => item.addEventListener('click', () => showView(item.dataset.view)));
document.querySelectorAll('[data-go]').forEach((item) => item.addEventListener('click', () => showView(item.dataset.go)));
$('#menu-toggle').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
$('#profile-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());
  const payload = { userId: user.id, ...data };

  await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const selected = {};
  document.querySelectorAll('.choice-group').forEach((group) => {
    const active = group.querySelector('.choice.active');
    if (active) {
      selected[group.dataset.choice] = active.textContent.trim();
    }
  });

  await fetch('/api/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id, ...selected })
  });

  localStorage.setItem('duoplayProfile', JSON.stringify(data));
  Object.assign(profile, data, selected);
  fillProfile();
  toast('Perfil e preferências salvos com sucesso');
});

document.querySelectorAll('.choice-group').forEach((group) => group.addEventListener('click', (event) => {
  if (event.target.classList.contains('choice')) {
    group.querySelectorAll('.choice').forEach((choice) => choice.classList.remove('active'));
    event.target.classList.add('active');
  }
}));
$('#filter-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const game = $('#filter-game').value;
  const platform = $('#filter-platform').value;
  const level = $('#filter-level').value;
  await loadPlayers({ game, platform, level });
});

const setupDeleteAccount = () => {
  const button = $('#clear-account');
  if (!button) return;

  let timer = null;

  button.addEventListener('click', async () => {
    if (!button.dataset.confirming) {
      button.dataset.confirming = 'true';
      button.classList.add('danger-active');
      button.textContent = 'Confirmar exclusão em 5';

      let remaining = 5;
      timer = setInterval(() => {
        remaining -= 1;
        button.textContent = remaining > 0 ? `Confirmar exclusão em ${remaining}` : 'Confirmar exclusão agora';
        if (remaining <= 0) {
          clearInterval(timer);
          timer = null;
          button.dataset.confirming = 'true';
          button.textContent = 'Confirmar exclusão agora';
        }
      }, 1000);
      return;
    }

    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    const currentUser = JSON.parse(localStorage.getItem('duoplayUser') || 'null');
    try {
      const response = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id })
      });

      const payload = await response.json();
      if (response.ok) {
        localStorage.clear();
        toast(payload.message || 'Conta excluída com sucesso.');
        setTimeout(() => { window.location.href = '/cadastro'; }, 1000);
        return;
      }

      toast(payload.message || 'Não foi possível excluir a conta.');
    } catch (error) {
      toast('Não foi possível excluir a conta neste momento.');
    }
  });
};

setupDeleteAccount();
renderHighlights(); fillProfile(); loadProfile(); loadPreferences(); loadPlayers(); loadFriends();

const hoje = new Date();
const dataFormatada = hoje.toLocaleDateString('pt-br', { weekday: 'long', day: 'numeric', month: 'long' });
document.getElementById('dia_mes').innerText = dataFormatada;