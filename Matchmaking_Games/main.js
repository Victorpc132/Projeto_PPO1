const GAME_METADATA = {
  Valorant: {
    specialtyLabel: 'Agente favorito',
    roleLabel: 'Função',
    specialties: ['Jett', 'Raze', 'Sova', 'Fade', 'Viper', 'Omen', 'Killjoy', 'Phoenix', 'Sage', 'Astra', 'Reyna', 'Chamber', 'Neon', 'Yoru', 'Breach', 'Skye', 'Brimstone', 'KAY/O', 'Iso', 'Clove'],
    roles: ['Duelista', 'Controlador', 'Iniciador', 'Sentinela']
  },
  'League of Legends': {
    specialtyLabel: 'Campeão favorito',
    roleLabel: 'Função',
    specialties: ['Ahri', 'Garen', 'Yasuo', 'Ezreal', 'Thresh', 'LeBlanc', 'Jinx', 'Lee Sin', 'Riven', 'Lux', 'Darius', 'Nautilus', 'Zed', 'Seraphine', 'Sett'],
    roles: ['Topo', 'Caçador', 'Meio', 'Atirador', 'Suporte']
  },
  Fortnite: {
    specialtyLabel: 'Estilo favorito',
    roleLabel: 'Papel',
    specialties: ['Builder', 'Skirmisher', 'Controller', 'Rusher', 'Flex'],
    roles: ['Frente', 'Suporte', 'Flex', 'Atirador', 'Controle']
  },
  'Counter-Strike 2': {
    specialtyLabel: 'Especialidade',
    roleLabel: 'Papel',
    specialties: ['AWP', 'Entry', 'Lurker', 'IGL', 'Anchor', 'Support'],
    roles: ['Entry', 'AWP', 'Support', 'IGL', 'Lurker']
  },
  'Apex Legends': {
    specialtyLabel: 'Legenda favorita',
    roleLabel: 'Papel',
    specialties: ['Wraith', 'Bangalore', 'Octane', 'Lifeline', 'Pathfinder', 'Gibraltar', 'Caustic', 'Valkyrie', 'Ash', 'Bloodhound', 'Mirage'],
    roles: ['Frente', 'Furtivo', 'Suporte', 'Controle', 'Flex']
  }
};

const updateGameSpecificFields = () => {
  const gameSelect = document.querySelector('#profile-game');
  const favoriteSelect = document.querySelector('#favorite');
  const roleSelect = document.querySelector('#role');
  const favoriteField = document.querySelector('#field-game-specialty');
  const roleField = document.querySelector('#field-game-role');
  if (!gameSelect || !favoriteSelect || !roleSelect || !favoriteField || !roleField) return;

  const game = gameSelect.value;
  const config = GAME_METADATA[game] ?? GAME_METADATA.Valorant;
  document.querySelector('#game-specialty-label').textContent = config.specialtyLabel;
  document.querySelector('#game-role-label').textContent = config.roleLabel;

  favoriteSelect.innerHTML = config.specialties.map((item) => `<option value="${item}">${item}</option>`).join('');
  roleSelect.innerHTML = config.roles.map((item) => `<option value="${item}">${item}</option>`).join('');

  if (profile.favorite) favoriteSelect.value = profile.favorite;
  if (profile.role) roleSelect.value = profile.role;

  favoriteField.classList.add('visible');
  roleField.classList.add('visible');
};

const applyProfileFormValues = () => {
  if (profile.game) {
    const gameSelect = document.querySelector('#profile-game');
    if (gameSelect) gameSelect.value = profile.game;
  }

  if (profile.favorite) {
    const favoriteSelect = document.querySelector('#favorite');
    if (favoriteSelect) favoriteSelect.value = profile.favorite;
  }

  if (profile.role) {
    const roleSelect = document.querySelector('#role');
    if (roleSelect) roleSelect.value = profile.role;
  }

  updateGameSpecificFields();
};

document.querySelector('#profile-game')?.addEventListener('change', updateGameSpecificFields);
