# 🎮 Projeto PPO1 — Matchmaking para Jogadores

> **Conectando jogadores compatíveis para partidas mais divertidas, equilibradas e colaborativas.**

O **Projeto PPO1** é uma plataforma web de **matchmaking para jogadores**, desenvolvida como parte da disciplina **Prática Profissionalizante Orientada I (PPO1)**.

A proposta é facilitar a busca por parceiros de jogo através da análise de características como **jogo, plataforma, nível de habilidade, estilo de jogo e disponibilidade**.

Em vez de procurar manualmente por jogadores, o usuário informa suas preferências e recebe recomendações de perfis que apresentam maior compatibilidade.

---

## 🚀 Sobre o Projeto

Encontrar pessoas para jogar pode ser difícil, principalmente quando existem diferenças de nível, horários ou estilo de jogo.

O Projeto PPO1 busca solucionar esse problema criando uma plataforma simples onde jogadores podem:

* 🎮 Informar quais jogos jogam;
* 🧩 Definir seu estilo de jogo;
* 🏆 Informar seu nível de habilidade;
* 💻 Selecionar sua plataforma;
* 🕐 Definir seus horários disponíveis;
* 🔎 Encontrar jogadores compatíveis;
* 🤝 Adicionar outros jogadores como amigos.

O principal diferencial do projeto é o **sistema de compatibilidade**, que utiliza os dados cadastrados pelos usuários para gerar recomendações.

---

## 🎯 Objetivo

Desenvolver uma plataforma capaz de conectar jogadores com características semelhantes, facilitando a formação de amizades e a busca por parceiros para partidas competitivas ou cooperativas.

### Fluxo principal

```text
┌──────────────┐
│    Cadastro  │
└──────┬───────┘
       ↓
┌──────────────┐
│    Login     │
└──────┬───────┘
       ↓
┌──────────────┐
│    Perfil    │
└──────┬───────┘
       ↓
┌──────────────┐
│ Preferências │
└──────┬───────┘
       ↓
┌──────────────┐
│ Matchmaking  │
└──────┬───────┘
       ↓
┌──────────────┐
│  Resultados  │
└──────┬───────┘
       ↓
┌──────────────┐
│   Amizades   │
└──────────────┘
```

---

## ✨ Funcionalidades

### 👤 Usuários

* [] Cadastro de usuário
* [] Login
* [] Logout
* [] Perfil do jogador
* [] Edição de informações
* [] Configuração de preferências

### 🔎 Matchmaking

* [] Busca de jogadores
* [] Filtros por jogo
* [] Filtros por plataforma
* [] Comparação de nível
* [] Comparação de estilo de jogo
* [] Comparação de disponibilidade
* [] Cálculo de compatibilidade
* [] Exibição de jogadores recomendados

### 🤝 Social

* [] Visualização de perfis
* [] Envio de solicitações de amizade
* [] Aceitação de solicitações
* [] Recusa de solicitações
* [] Lista de amigos

---

## 🧠 Sistema de Matchmaking

O sistema calcula uma **pontuação de compatibilidade** entre os jogadores com base em diferentes características.

| Critério               |     Peso |
| ---------------------- | -------: |
| 🎮 Jogo em comum       |  **30%** |
| 🏆 Nível de habilidade |  **25%** |
| 🕐 Disponibilidade     |  **20%** |
| 🎯 Estilo de jogo      |  **15%** |
| 💻 Plataforma          |  **10%** |
| **Total**              | **100%** |

### Exemplo

Imagine dois jogadores:

**Jogador A**

```text
Jogo: Valorant
Plataforma: PC
Nível: Diamante
Estilo: Competitivo
Disponibilidade: Noite
```

**Jogador B**

```text
Jogo: Valorant
Plataforma: PC
Nível: Diamante
Estilo: Competitivo
Disponibilidade: Noite
```

Como existe uma grande quantidade de características em comum, o sistema poderá apresentar algo semelhante a:

```text
╔══════════════════════════════════╗
║     COMPATIBILIDADE: 100%        ║
╠══════════════════════════════════╣
║ 🎮 Jogo          ✓ Compatível    ║
║ 🏆 Nível         ✓ Compatível    ║
║ 🕐 Horário       ✓ Compatível    ║
║ 🎯 Estilo        ✓ Compatível    ║
║ 💻 Plataforma    ✓ Compatível    ║
╚══════════════════════════════════╝
```

> A porcentagem representa uma estimativa baseada nos dados informados pelos usuários e não garante compatibilidade pessoal entre os jogadores.

---

## 🖥️ Telas

O sistema será composto pelas seguintes telas principais:

| Tela                   | Descrição                   |
| ---------------------- | --------------------------- |
| 🏠 Página Inicial      | Apresentação da plataforma  |
| 📝 Cadastro            | Criação da conta            |
| 🔐 Login               | Acesso ao sistema           |
| 👤 Meu Perfil          | Informações do jogador      |
| ⚙️ Preferências        | Configuração do matchmaking |
| 🔎 Encontrar Jogadores | Busca e filtros             |
| 🎯 Resultados          | Jogadores compatíveis       |
| 🤝 Amigos              | Gerenciamento de amizades   |

---

## 🛠️ Tecnologias

> Tecnologias utilizadas no desenvolvimento do projeto.

### Front-end

```text
HTML5
CSS3
JavaScript
```

### Back-end

```text
[Definir tecnologia]
```

### Banco de Dados

```text
[Definir banco de dados]
```

### Ferramentas

```text
Git
GitHub
Visual Studio Code
```

> As tecnologias de back-end e banco de dados serão definidas durante o desenvolvimento do projeto.

---

## 🗂️ Estrutura do Projeto

A estrutura poderá seguir uma organização semelhante a:

```text
Projeto_PPO1/
│
├── frontend/
│   ├── css/
│   ├── js/
│   ├── images/
│   └── pages/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── services/
│
├── database/
│   └── scripts/
│
├── docs/
│   ├── requisitos/
│   ├── diagramas/
│   └── prototipos/
│
├── README.md
└── .gitignore
```

A estrutura poderá ser modificada conforme a arquitetura escolhida pela equipe.

---

## 📋 Requisitos do Sistema

### Requisitos funcionais

* Cadastro e autenticação de usuários;
* Gerenciamento de perfil;
* Cadastro de jogos e preferências;
* Busca de jogadores;
* Sistema de matchmaking;
* Exibição de compatibilidade;
* Visualização de perfis;
* Sistema de amizade.

### Requisitos não funcionais

* Interface responsiva;
* Boa usabilidade;
* Compatibilidade com navegadores modernos;
* Segurança básica das contas;
* Proteção das informações dos usuários;
* Código organizado e de fácil manutenção.

---

## 📌 Escopo do MVP

Para manter o projeto viável dentro do período de desenvolvimento, a primeira versão será focada no funcionamento do **matchmaking**.

### O que entra no MVP

```text
✓ Cadastro
✓ Login
✓ Perfil
✓ Preferências
✓ Busca
✓ Matchmaking
✓ Resultados
✓ Sistema de amizade
```

### O que ficará para versões futuras

```text
○ Chat em tempo real
○ Criação de grupos
○ Sistema de equipes
○ Notificações avançadas
○ Integração com Steam
○ Integração com PlayStation/Xbox
○ Integração automática com jogos
○ Inteligência artificial
○ Aplicativo mobile
```

---

## 📈 Roadmap

### 🟢 Fase 1 — Planejamento

* [x] Definição do tema
* [x] Definição do público-alvo
* [x] Levantamento de requisitos
* [x] Definição do MVP

### 🟡 Fase 2 — Design

* [ ] Protótipo das telas
* [ ] Identidade visual
* [ ] Modelagem do banco de dados
* [ ] Diagramas do sistema

### 🟠 Fase 3 — Desenvolvimento

* [ ] Estrutura inicial
* [ ] Cadastro e login
* [ ] Perfil
* [ ] Preferências
* [ ] Busca de jogadores
* [ ] Algoritmo de matchmaking
* [ ] Sistema de amizade

### 🔵 Fase 4 — Testes

* [ ] Testes das funcionalidades
* [ ] Testes de responsividade
* [ ] Correção de bugs
* [ ] Validação do matchmaking

### 🟣 Fase 5 — Entrega

* [ ] Documentação final
* [ ] Apresentação
* [ ] Deploy
* [ ] Entrega do projeto

---

## 🔒 Privacidade e Segurança

A plataforma trabalhará com informações fornecidas pelos próprios usuários.

Entre os cuidados previstos estão:

* Armazenamento seguro de senhas;
* Autenticação de usuários;
* Controle das informações públicas do perfil;
* Proteção dos dados pessoais;
* Possibilidade de exclusão da conta.

O tratamento dos dados deverá considerar a **Lei Geral de Proteção de Dados (LGPD)** e as boas práticas de segurança.

---

## 👥 Público-Alvo

O projeto é direcionado principalmente a jogadores que procuram:

* 🎮 Parceiros para jogar;
* 🏆 Jogadores de nível semelhante;
* 🤝 Novas amizades;
* 👥 Equipes e parceiros para partidas;
* 🕐 Pessoas disponíveis nos mesmos horários.

---

## 🎓 Projeto Acadêmico

Este projeto está sendo desenvolvido para a disciplina:

**Prática Profissionalizante Orientada I — PPO1**

O objetivo acadêmico é aplicar conhecimentos de análise, levantamento de requisitos, desenvolvimento de sistemas, banco de dados, interfaces e engenharia de software na construção de uma solução funcional.

---

## 🚧 Status

```text
🟡 Em desenvolvimento
```

O projeto está em fase de planejamento e desenvolvimento.

---

## 🔮 Futuras Melhorias

Após a conclusão do MVP, algumas funcionalidades poderão ser adicionadas:

* Sistema de chat;
* Grupos e equipes;
* Notificações;
* Sistema de reputação;
* Avaliação entre jogadores;
* Integração com plataformas de jogos;
* Matchmaking mais avançado;
* Aplicativo mobile;
* Sistema de denúncias e moderação.

---

## 👨‍💻 Equipe

Projeto desenvolvido pelos alunos da disciplina **PPO1**.

> **Projeto PPO1 — Matchmaking para Jogadores 🎮**

**Conecte-se. Encontre seu duo. Monte sua equipe. Jogue melhor.**
