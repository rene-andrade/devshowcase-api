# Walkthrough - DevShowcase API

A estrutura completa da **DevShowcase API** foi gerada, configurada e validada no workspace [devshowcase-api](file:///c:/Users/rene/OneDrive/Documentos/projects/devshowcase-api).

## Estrutura do Projeto Gerada

```text
devshowcase-api/
├── prisma/
│   └── schema.prisma         # Modelagem relacional (Profile, Project, Technology, Feedback)
├── prisma.config.ts          # Configuração de datasource para o Prisma 7
├── src/
│   ├── controllers/
│   │   ├── profile.controller.ts    # POST /api/profiles e GET /api/profiles/:id
│   │   ├── technology.controller.ts # POST /api/technologies e GET /api/technologies
│   │   └── project.controller.ts    # POST /api/projects e GET /api/projects
│   ├── dtos/
│   │   ├── profile.dto.ts           # Validação com Zod (email, githubUrl com regex)
│   │   ├── technology.dto.ts        # Validação de nome de tecnologia com Zod
│   │   └── project.dto.ts           # Validação de projeto e technologyIds UUID
│   ├── lib/
│   │   └── prisma.ts                # PrismaClient singleton com adapter @prisma/adapter-pg
│   ├── routes.ts                    # Roteador central do Express agrupando endpoints
│   └── server.ts                    # Setup do Express, CORS, JSON, Healthcheck e Handler de Erros
├── .env                             # Variáveis de ambiente com DATABASE_URL de exemplo
├── .env.example                     # Modelo de variáveis de ambiente
├── .gitignore                       # Ignorando node_modules, dist, .env, logs
├── package.json                     # Scripts dev, build e start configurados
├── tsconfig.json                    # TypeScript configurado para Node.js
└── render.yaml                      # Blueprint IaC para Web Service + PostgreSQL no Render
```

---

## Entidades do Prisma Criadas

1. **Profile** (`prisma/schema.prisma`):
   - `id`: UUID (chave primária)
   - `name`: String
   - `bio`: String opcional
   - `githubUrl`: String
   - `email`: String (única)
   - `createdAt`: DateTime
   - Relacionamento: `projects Project[]` (1:N)

2. **Project** (`prisma/schema.prisma`):
   - `id`: UUID (chave primária)
   - `title`: String
   - `description`: String
   - `repository`: String
   - `profileId`: String (FK para Profile com `onDelete: Cascade`)
   - `technologies`: Technology[] (relação N:N)
   - `feedbacks`: Feedback[] (relação 1:N)
   - `createdAt`: DateTime

3. **Technology** (`prisma/schema.prisma`):
   - `id`: UUID (chave primária)
   - `name`: String (única)
   - `projects`: Project[] (relação N:N)

4. **Feedback** (`prisma/schema.prisma`):
   - `id`: UUID (chave primária)
   - `author`: String
   - `comment`: String
   - `rating`: Int
   - `projectId`: String (FK para Project com `onDelete: Cascade`)
   - `createdAt`: DateTime

---

## Endpoints Implementados

| Método | Rota | Descrição | Validação |
|---|---|---|---|
| `POST` | `/api/profiles` | Cadastra novo perfil de desenvolvedor | Email válido, GitHub URL válida (`https://github.com/...`) |
| `GET` | `/api/profiles/:id` | Busca perfil por ID incluindo seus projetos, tecnologias e feedbacks | Validação de ID e tratamento de 404 |
| `POST` | `/api/technologies` | Cadastra uma nova tecnologia | Nome obrigatório e tratamento de duplicidade (409) |
| `GET` | `/api/technologies` | Lista todas as tecnologias cadastradas | Ordenadas alfabeticamente por nome |
| `POST` | `/api/projects` | Cadastra projeto vinculado a um perfil existente e associa tecnologias | Validação de dados, verificação de existência do perfil e das tecnologias |
| `GET` | `/api/projects` | Lista todos os projetos cadastrados | Inclui profile, technologies e feedbacks |

---

## Verificação e Testes Realizados

1. **Geração dos tipos do Prisma (`npx prisma generate`):**
   - Executado com sucesso gerando o cliente v7.10.0.
2. **Compilação TypeScript (`npm run build`):**
   - Executou `npx prisma generate && tsc` com código de saída 0, gerando a pasta `dist/`.
3. **Validação dos Schemas Zod:**
   - Testados com sucesso inputs válidos e rejeições de formato inválido (ex: GitHub URL inválida e e-mail inválido).
4. **Carregamento do Servidor Express:**
   - Carregamento do servidor validado sem erros de importação ou conflito de dependências.

---

## Como Executar

### 1. Iniciar em Modo de Desenvolvimento
```bash
npm run dev
```
O servidor inicializa com recarregamento automático via `tsx watch src/server.ts` na porta `3000` (ou a especificada no `.env`).

### 2. Aplicar Migrations no Banco (quando houver PostgreSQL rodando)
```bash
npx prisma migrate dev --name init
```

### 3. Gerar Build de Produção
```bash
npm run build
```

### 4. Iniciar em Produção
```bash
npm run start
```
