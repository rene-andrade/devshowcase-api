# Plano de Implementação - DevShowcase API

Estruturação completa da API RESTful **DevShowcase** com Node.js, TypeScript, Express, Prisma ORM e Zod, seguindo boas práticas de arquitetura em camadas e deploy no Render.

## User Review Required

> [!NOTE]
> As dependências fundamentais (`@prisma/client`, `express`, `zod`, `dotenv`, `cors`, `prisma`, `tsx`, `typescript`) já estão instaladas no `package.json` do repositório. O plano inclui a criação dos arquivos de código-fonte, esquemas do banco e configuração do deploy.

## Proposed Changes

### Banco de Dados & ORM (Prisma)

#### [NEW] [schema.prisma](file:///c:/Users/rene/OneDrive/Documentos/projects/devshowcase-api/prisma/schema.prisma)
- Configuração do datasource PostgreSQL (`env("DATABASE_URL")`) e generator `prisma-client-js`.
- Definição dos modelos:
  - **`Profile`**: `id` (UUID), `name`, `bio` (opcional), `githubUrl`, `email` (único), `createdAt`, relação 1:N com `Project`.
  - **`Project`**: `id` (UUID), `title`, `description`, `repository`, `profileId`, `createdAt`, relação N:1 com `Profile`, N:N com `Technology`, 1:N com `Feedback`.
  - **`Technology`**: `id` (UUID), `name` (único), relação N:N com `Project`.
  - **`Feedback`**: `id` (UUID), `author`, `comment`, `rating` (Int), `projectId`, `createdAt`, relação N:1 com `Project`.

#### [NEW] [prisma.ts](file:///c:/Users/rene/OneDrive/Documentos/projects/devshowcase-api/src/lib/prisma.ts)
- Instanciação e exportação do singleton do cliente Prisma (`PrismaClient`).

---

### Validação de Dados (DTOs com Zod)

#### [NEW] [profile.dto.ts](file:///c:/Users/rene/OneDrive/Documentos/projects/devshowcase-api/src/dtos/profile.dto.ts)
- `createProfileSchema`:
  - `name`: string não vazia
  - `bio`: string opcional
  - `githubUrl`: url válida e compatível com perfis do GitHub
  - `email`: e-mail válido

#### [NEW] [technology.dto.ts](file:///c:/Users/rene/OneDrive/Documentos/projects/devshowcase-api/src/dtos/technology.dto.ts)
- `createTechnologySchema`:
  - `name`: string não vazia

#### [NEW] [project.dto.ts](file:///c:/Users/rene/OneDrive/Documentos/projects/devshowcase-api/src/dtos/project.dto.ts)
- `createProjectSchema`:
  - `title`: string não vazia
  - `description`: string não vazia
  - `repository`: url ou caminho válido
  - `profileId`: string uuid
  - `technologyIds`: array opcional de UUIDs

---

### Controladores (Controllers)

#### [NEW] [profile.controller.ts](file:///c:/Users/rene/OneDrive/Documentos/projects/devshowcase-api/src/controllers/profile.controller.ts)
- `createProfile`: validação de entrada, verificação de e-mail duplicado, criação e resposta HTTP 201.
- `getProfileById`: busca por ID com include dos projetos associados, resposta HTTP 200 ou 404.

#### [NEW] [technology.controller.ts](file:///c:/Users/rene/OneDrive/Documentos/projects/devshowcase-api/src/controllers/technology.controller.ts)
- `createTechnology`: validação de entrada, tratamento de tecnologia já cadastrada, criação e resposta HTTP 201.
- `listTechnologies`: listagem de todas as tecnologias cadastradas (HTTP 200).

#### [NEW] [project.controller.ts](file:///c:/Users/rene/OneDrive/Documentos/projects/devshowcase-api/src/controllers/project.controller.ts)
- `createProject`: validação de entrada, verificação de existência do perfil, vinculação das tecnologias informadas via `connect`, resposta HTTP 201.
- `listProjects`: listagem de projetos trazendo os dados do `profile`, `technologies` e `feedbacks` (HTTP 200).

---

### Roteamento e Inicialização

#### [NEW] [routes.ts](file:///c:/Users/rene/OneDrive/Documentos/projects/devshowcase-api/src/routes.ts)
- Router do Express agrupando todos os endpoints solicitados:
  - `POST /profiles`
  - `GET /profiles/:id`
  - `POST /technologies`
  - `GET /technologies`
  - `POST /projects`
  - `GET /projects`

#### [NEW] [server.ts](file:///c:/Users/rene/OneDrive/Documentos/projects/devshowcase-api/src/server.ts)
- Configuração do Express, middlewares de CORS e JSON, montagem do roteador no prefixo `/api`.
- Middleware centralizado para tratamento de erros (erros de validação Zod formatados com status 400, erros de violação de chave única do Prisma e erros 500 genéricos).
- Inicialização do servidor na porta definida em `PORT` (padrão `3000`).

---

### Configurações de Ambiente e Infraestrutura

#### [NEW] [.env](file:///c:/Users/rene/OneDrive/Documentos/projects/devshowcase-api/.env) e [.env.example](file:///c:/Users/rene/OneDrive/Documentos/projects/devshowcase-api/.env.example)
- Definição de `PORT` e `DATABASE_URL` contendo URL de conexão PostgreSQL de exemplo.

#### [NEW] [render.yaml](file:///c:/Users/rene/OneDrive/Documentos/projects/devshowcase-api/render.yaml)
- Blueprint do Render definindo:
  - Serviço Web Node.js com comandos de build (`npm install && npm run build`) e start (`npm run start`).
  - Instância de banco gerenciado PostgreSQL (`devshowcase-db`) com injeção automática de `DATABASE_URL`.

#### [MODIFY] [tsconfig.json](file:///c:/Users/rene/OneDrive/Documentos/projects/devshowcase-api/tsconfig.json)
- Ajustar `moduleResolution` e opções para compatibilidade máxima com Node.js e TypeScript CommonJS (`module: "commonjs"`, `moduleResolution: "node"`), garantindo build sem atritos de extensões de arquivo.

## Verification Plan

### Automated Tests & Compilação
- Executar `npx prisma generate` para gerar os tipos do Prisma Client a partir do novo schema.
- Executar `npm run build` (`tsc && npx prisma generate`) para validar se a compilação TypeScript ocorre sem erros de tipagem.

### Manual Verification
- Teste de inicialização do servidor com `npm run dev` ou `node dist/server.js` em modo rápido para garantir que o Express inicializa e escuta na porta configurada.
