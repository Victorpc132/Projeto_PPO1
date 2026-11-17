# DuoPlay — matchmaking para jogadores

Aplicação web de matchmaking com cadastro, perfis específicos por jogo, recomendações e solicitações de amizade. O projeto usa Bun, TypeScript, HTML/CSS/JavaScript e SQLite.

## Executar localmente

Requer Bun 1.4 ou superior.

```bash
bun install
bun run dev
```

Acesse `http://localhost:3000`. Para executar sem hot reload, use `bun start`. O servidor lê `PORT` para configurar a porta e `DUOPLAY_DB_PATH` para escolher o arquivo SQLite; sem essa variável, cria `banco.sqlite` no diretório de execução. O banco local é ignorado pelo Git.

Verificações disponíveis:

```bash
bun run typecheck
bun test
```

## Fluxo e catálogo

Crie uma conta em `/cadastro`, entre em `/login` e configure o perfil antes de buscar jogadores. A tela principal consulta a sessão do servidor; não usa `localStorage` como identidade. Os filtros de jogo, modo, rank e plataforma acompanham o jogo selecionado.

O catálogo central fica em [`Matchmaking_Games/main_page/gameCatalog.ts`](Matchmaking_Games/main_page/gameCatalog.ts). Ele cobre os cinco jogos da aplicação:

- **VALORANT:** ranks Ferro 1 a Imortal 3 e Radiante; lista atual de agentes e funções oficiais traduzidas para pt-BR.
- **League of Legends:** divisões Ferro a Diamante, tiers Mestre/Grão-mestre/Desafiante, filas Solo/Duo e Flex, rota principal e secundária. Campeão principal é texto livre para não sugerir uma lista parcial como elenco completo.
- **Fortnite:** Bronze, Prata, Ouro, Platina, Diamante, Elite, Campeão e Unreal com divisões I–III, além de Unreal Legends. Battle Royale e Zero Build compartilham progresso; o rank de Reload/Reload Zero Build só é comparado dentro da mesma fila.
- **Counter-Strike 2:** Premier usa um campo numérico de CS Rating. Competitivo usa Skill Group por mapa. Mapa e funções são informais; os ranks não são misturados entre Premier e Competitivo.
- **Apex Legends:** ranks Iniciante a Diamante com divisões IV–I, Mestre e Apex Predator; classes oficiais e elenco de Lendas da página oficial da EA.

As fontes e ressalvas de manutenção estão em [`Matchmaking_Games/main_page/GAME_CATALOG_SOURCES.md`](Matchmaking_Games/main_page/GAME_CATALOG_SOURCES.md). Os ranks são autodeclarados; o DuoPlay não verifica contas nem dados diretamente nos serviços dos jogos. O catálogo foi conferido em 28/10/2026. O roadmap da EA anuncia uma reformulação futura para Season 32, então o rank de Apex deve ser revisto quando essa temporada entrar em vigor.

## Como o score funciona

A compatibilidade é determinística, limitada a 100 pontos e não compara elos de jogos diferentes. A pontuação considera jogo em comum (20), modo/fila (10), proximidade de rank (25), horário (20), função/rota (10), agente/personagem/mapa (3), estilo (2) e plataforma (10). Algumas regras respeitam a estrutura do jogo: Solo/Duo e Flex são escalas diferentes no LoL; rank competitivo do CS2 depende do mapa; CS Rating só é comparável no Premier; e Apex exige a mesma plataforma para comparar o rank. Fortnite mantém a proximidade do rank entre modos com progresso compartilhado.

O score é uma estimativa baseada no que os jogadores informam e não garante compatibilidade pessoal nem que uma partida seja possível em todos os modos/plataformas.

## Segurança e dados

- Senhas são armazenadas com o hash de senha fornecido pelo Bun; nunca retornam pela API.
- A sessão usa token aleatório armazenado como hash no banco e cookie `HttpOnly`. Em HTTPS público, a aplicação usa `SameSite=None; Secure` com base na origem encaminhada pelo proxy; em HTTP local, usa `SameSite=Lax`.
- Rotas de perfil, preferências, busca, amizade e exclusão usam a identidade da sessão, não IDs enviados pelo navegador.
- Dados do perfil público podem ser ocultados em Configurações; a disponibilidade também pode ser escondida.
- Há limites simples por IP para cadastro/login e validação de valores do catálogo no servidor.
- O arquivo SQLite local contém dados de contas; não compartilhe o banco nem o inclua em commits. As credenciais e ranks são autodeclarados.

Antes de colocar em produção, configure HTTPS, política de retenção/backup, monitoramento, limites de tentativas distribuídos e revisão de privacidade adequada ao público do serviço.

## Estrutura principal

```text
index.ts                                  entrada do servidor
Matchmaking_Games/main_page/server.ts     rotas HTTP/API, sessão e validação
Matchmaking_Games/main_page/db.ts         schema SQLite e migrações compatíveis
Matchmaking_Games/main_page/gameCatalog.ts ranks e campos por jogo
Matchmaking_Games/main_page/matchmaking.ts cálculo de compatibilidade
Matchmaking_Games/main_page/main.html     aplicação autenticada
Matchmaking_Games/main_page/main.css      interface responsiva
Matchmaking_Games/main_page/main.js       fluxo da interface
Matchmaking_Games/main_page/GAME_CATALOG_SOURCES.md fontes e regras de atualização
```

Não há integração oficial com Riot, Epic, Valve/Steam ou EA, chat em tempo real, notificações push ou verificação automática de rank.
