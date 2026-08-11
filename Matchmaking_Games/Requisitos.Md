# REQUISITOS DO SISTEMA – ESCOPO REDUZIDO

## 1. Objetivo do Sistema

Desenvolver uma plataforma web que permita aos jogadores criar um perfil e encontrar outros jogadores com características semelhantes, utilizando informações como jogos, nível de habilidade, plataforma e disponibilidade.

O sistema terá como foco principal o **matchmaking entre jogadores**, mantendo apenas as funcionalidades essenciais para que o projeto possa ser desenvolvido e entregue até dezembro.

---

# 2. Requisitos Funcionais

### RF01 – Cadastro

O sistema deverá permitir que o usuário crie uma conta informando:

* Nome ou nickname;
* E-mail;
* Senha.

### RF02 – Login

O sistema deverá permitir que usuários cadastrados realizem login utilizando e-mail e senha.

### RF03 – Perfil do jogador

O sistema deverá permitir que o usuário cadastre e edite informações básicas do seu perfil:

* Nickname;
* Jogo principal;
* Plataforma;
* Nível de habilidade;
* Estilo de jogo;
* Disponibilidade.

### RF04 – Preferências de matchmaking

O sistema deverá permitir que o usuário informe suas preferências para encontrar outros jogadores.

As principais preferências serão:

* Jogo;
* Plataforma;
* Nível de habilidade;
* Estilo de jogo;
* Horários disponíveis.

### RF05 – Busca de jogadores

O sistema deverá permitir que o usuário procure outros jogadores utilizando filtros básicos:

* Jogo;
* Plataforma;
* Nível de habilidade.

### RF06 – Matchmaking

O sistema deverá comparar as informações dos jogadores e identificar perfis compatíveis.

A comparação deverá considerar:

* Jogo em comum;
* Plataforma;
* Nível de habilidade;
* Estilo de jogo;
* Disponibilidade.

### RF07 – Resultado do matchmaking

O sistema deverá apresentar uma lista de jogadores compatíveis, mostrando informações básicas do perfil e um indicador de compatibilidade.

Exemplo:

**João – 85% compatível**

* Jogo: Valorant
* Plataforma: PC
* Nível: Diamante
* Estilo: Competitivo

### RF08 – Visualização de perfil

O usuário deverá poder visualizar as informações públicas de outro jogador antes de decidir realizar uma conexão.

### RF09 – Sistema de amizade

O sistema deverá permitir:

* Enviar solicitação de amizade;
* Aceitar solicitação;
* Recusar solicitação;
* Visualizar amigos.

### RF10 – Configurações da conta

O sistema deverá permitir que o usuário altere seus dados básicos e senha.

### RF11 – Logout

O sistema deverá permitir que o usuário encerre sua sessão.

---

# 3. Requisitos Não Funcionais

### RNF01 – Responsividade

O sistema deverá funcionar adequadamente em computadores, tablets e smartphones.

### RNF02 – Usabilidade

A interface deverá ser simples e intuitiva, permitindo que usuários com conhecimento básico de internet utilizem o sistema.

### RNF03 – Compatibilidade

O sistema deverá funcionar nos principais navegadores modernos.

### RNF04 – Segurança

As senhas dos usuários deverão ser armazenadas de forma segura e o acesso às contas deverá exigir autenticação.

### RNF05 – Desempenho

As principais páginas e funções deverão apresentar tempo de resposta adequado.

### RNF06 – Privacidade

O sistema deverá permitir que somente informações definidas como públicas sejam apresentadas aos demais usuários.

### RNF07 – Manutenibilidade

O código deverá ser organizado de forma a facilitar correções e futuras melhorias.

---

# 4. Regras de Negócio

### RN01

O usuário deverá possuir uma conta para utilizar o sistema de matchmaking.

### RN02

O usuário deverá preencher as informações básicas do perfil antes de receber recomendações.

### RN03

O sistema deverá priorizar jogadores que possuam o mesmo jogo.

### RN04

O sistema deverá considerar o nível de habilidade na identificação de jogadores compatíveis.

### RN05

O sistema deverá considerar a disponibilidade informada pelos jogadores.

### RN06

O sistema deverá considerar o estilo de jogo como um dos critérios de compatibilidade.

### RN07

A porcentagem de compatibilidade será apenas uma estimativa baseada nas informações cadastradas e não representará garantia de afinidade entre os usuários.

### RN08

Uma amizade somente será criada após o aceite da solicitação enviada por outro usuário.

---

# 5. Critérios do Matchmaking

Para simplificar o desenvolvimento, o matchmaking utilizará uma pontuação baseada em cinco critérios:

| Critério            |     Peso |
| ------------------- | -------: |
| Jogo em comum       |      30% |
| Nível de habilidade |      25% |
| Disponibilidade     |      20% |
| Estilo de jogo      |      15% |
| Plataforma          |      10% |
| **Total**           | **100%** |

O sistema calculará uma pontuação de compatibilidade entre os jogadores e apresentará os resultados em ordem decrescente.

### Exemplo

Jogador A:

* Valorant;
* PC;
* Diamante;
* Competitivo;
* Disponível à noite.

Jogador B:

* Valorant;
* PC;
* Diamante;
* Competitivo;
* Disponível à noite.

Nesse caso, os jogadores apresentarão uma alta porcentagem de compatibilidade.

---

# 6. Telas do Sistema

Para reduzir o escopo, o sistema terá **8 telas principais**:

### 1. Página Inicial

Apresentação da plataforma e acesso ao cadastro/login.

### 2. Cadastro

Criação da conta do jogador.

### 3. Login

Acesso à conta.

### 4. Meu Perfil

Visualização e edição das informações do jogador.

### 5. Preferências

Configuração dos critérios utilizados no matchmaking.

### 6. Encontrar Jogadores

Busca e filtragem de jogadores.

### 7. Resultados

Exibição dos jogadores compatíveis e seus respectivos níveis de compatibilidade.

### 8. Amigos

Visualização e gerenciamento das solicitações e amizades.

As configurações da conta poderão ser incorporadas à tela **Meu Perfil**, evitando a criação de uma tela separada.

---

# 7. Funcionalidades que ficarão fora da primeira versão

Para garantir que o sistema seja entregue dentro do prazo, as seguintes funcionalidades não farão parte do escopo principal:

* Chat em tempo real;
* Videochamada;
* Criação de grupos;
* Sistema de equipes;
* Notificações avançadas;
* Sistema de ranking próprio da plataforma;
* Integração com Steam, Xbox, PlayStation ou outras plataformas;
* Integração automática com dados dos jogos;
* Algoritmo de inteligência artificial;
* Sistema complexo de denúncias;
* Painel administrativo completo;
* Aplicativo para celular;
* Sistema de recomendação baseado em aprendizado de máquina.

Essas funcionalidades poderão ser apresentadas como **possíveis melhorias futuras**.

---

# 8. MVP do Projeto

O Produto Mínimo Viável será composto por:

**Cadastro → Login → Perfil → Preferências → Matchmaking → Resultados → Amizade**

Esse fluxo representa o núcleo da proposta do projeto.

O usuário deverá conseguir:

1. Criar uma conta;
2. Fazer login;
3. Montar seu perfil;
4. Informar suas preferências;
5. Procurar jogadores;
6. Receber recomendações;
7. Visualizar perfis;
8. Enviar solicitações de amizade;
9. Gerenciar seus amigos.

---

# 9. Prioridade de Desenvolvimento

## Prioridade 1 – Essencial

* Banco de dados;
* Cadastro;
* Login;
* Perfil;
* Preferências;
* Busca de jogadores;
* Algoritmo de matchmaking;
* Resultados.

## Prioridade 2 – Importante

* Solicitação de amizade;
* Lista de amigos;
* Responsividade;
* Validações;
* Segurança básica.

## Prioridade 3 – Futuro

* Chat;
* Grupos;
* Notificações;
* Integrações com plataformas;
* Recursos avançados de recomendação.

---

# 10. Escopo Final

O sistema será considerado concluído quando um usuário conseguir realizar todo o fluxo principal:

**Criar conta → Fazer login → Configurar perfil → Definir preferências → Encontrar jogadores compatíveis → Visualizar perfil → Enviar solicitação de amizade → Gerenciar amigos.**

O desenvolvimento será concentrado nesse fluxo para garantir um projeto funcional, apresentável e compatível com o prazo de entrega até dezembro.
