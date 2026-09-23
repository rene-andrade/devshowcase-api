# DevShowcase API

API RESTful para cadastro e divulgação de perfis de desenvolvedores, seus projetos, as tecnologias utilizadas e feedbacks recebidos. Construída com Node.js, TypeScript, Express, Prisma ORM e validação de dados com Zod.

## Stack

- **Node.js** + **TypeScript**
- **Express 5** — servidor HTTP e roteamento
- **Prisma ORM 7** (com `@prisma/adapter-pg`) — acesso a dados sobre **PostgreSQL**
- **Zod** — validação de payloads das requisições
- **cors** / **dotenv** — middlewares e configuração de ambiente
- **tsx** — execução em modo desenvolvimento com hot reload

## Modelo de Dados

O schema (`prisma/schema.prisma`) define quatro entidades. O `id` de `Profile` é um **UUID v7** (tipo nativo `uuid` do Postgres, ordenável por data de criação); os demais modelos usam `id` **inteiro autoincremento**.

- **Profile**: `id`, `name`, `bio` (opcional), `githubUrl`, `email` (único), `createdAt`. Possui muitos `Project`.
- **Project**: `id`, `title`, `description`, `repository`, `profileId`, `createdAt`. Pertence a um `Profile` (cascade on delete), relaciona N:N com `Technology` e possui muitos `Feedback`.
- **Technology**: `id`, `name` (único). Relaciona N:N com `Project`.
- **Feedback**: `id`, `author`, `comment`, `rating`, `projectId`, `createdAt`. Pertence a um `Project` (cascade on delete).

## Estrutura do Projeto

```
src/
├── controllers/       # Lógica de negócio das rotas (profile, project, technology)
├── dtos/               # Schemas Zod de validação de entrada
├── lib/prisma.ts       # Instância singleton do PrismaClient (via adapter-pg)
├── routes.ts           # Definição das rotas da API
└── server.ts           # Setup do Express, middlewares e tratamento de erros
prisma/
└── schema.prisma       # Modelos e datasource PostgreSQL
```

## Pré-requisitos

- Node.js 18+
- Instância PostgreSQL acessível (local ou remota)

## Configuração

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie o arquivo de exemplo de variáveis de ambiente e ajuste os valores:

   ```bash
   cp .env.example .env
   ```

   | Variável       | Descrição                                    | Padrão                    |
   | -------------- | --------------------------------------------- | -------------------------- |
   | `PORT`         | Porta em que o servidor HTTP é iniciado        | `3000`                     |
   | `DATABASE_URL` | String de conexão PostgreSQL usada pelo Prisma | *(obrigatória)*            |

3. Gere o Prisma Client e sincronize o schema com o banco de dados:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

## Executando o projeto

**Desenvolvimento** (com hot reload via `tsx watch`):

```bash
npm run dev
```

**Build de produção** (compila TypeScript e gera o Prisma Client):

```bash
npm run build
```

**Start** (executa o build gerado em `dist/`):

```bash
npm run start
```

Por padrão, o servidor sobe em `http://localhost:3000`.

## Endpoints

Todas as rotas de negócio são servidas sob o prefixo `/api`.

### Health Check

| Método | Rota          | Descrição                          |
| ------ | ------------- | ----------------------------------- |
| GET    | `/`           | Status geral do serviço             |
| GET    | `/api/health` | Health check simples (`{"status":"healthy"}`) |

### Profiles

| Método | Rota              | Descrição                                                |
| ------ | ----------------- | --------------------------------------------------------- |
| POST   | `/api/profiles`    | Cria um novo perfil de desenvolvedor                       |
| GET    | `/api/profiles/:id`| Busca um perfil por ID, incluindo projetos, tecnologias e feedbacks associados |

**Payload — `POST /api/profiles`**

```json
{
  "name": "Jane Doe",
  "bio": "Full-stack developer",
  "githubUrl": "https://github.com/janedoe",
  "email": "jane@example.com"
}
```

- `name`: obrigatório, não vazio.
- `bio`: opcional.
- `githubUrl`: obrigatório, precisa ser uma URL válida no formato `https://github.com/<usuario>`.
- `email`: obrigatório, formato de e-mail válido e único (retorna `409 Conflict` se já cadastrado).

Em `GET /api/profiles/:id`, um `id` que não seja UUID retorna `400`; um UUID inexistente retorna `404`.

### Technologies

| Método | Rota                | Descrição                              |
| ------ | ------------------- | ---------------------------------------- |
| POST   | `/api/technologies` | Cadastra uma nova tecnologia              |
| GET    | `/api/technologies` | Lista todas as tecnologias (ordem alfabética) |

**Payload — `POST /api/technologies`**

```json
{
  "name": "TypeScript"
}
```

- `name`: obrigatório, não vazio e único (retorna `409 Conflict` se já existir).

### Projects

| Método | Rota            | Descrição                                                        |
| ------ | --------------- | ------------------------------------------------------------------ |
| POST   | `/api/projects` | Cria um novo projeto, vinculado a um perfil e (opcionalmente) tecnologias |
| GET    | `/api/projects` | Lista todos os projetos (mais recentes primeiro), incluindo perfil, tecnologias e feedbacks |

**Payload — `POST /api/projects`**

```json
{
  "title": "DevShowcase API",
  "description": "API RESTful para divulgação de projetos",
  "repository": "https://github.com/janedoe/devshowcase-api",
  "profileId": "01992f4a-8c3e-7b21-9d4f-3a6e5c1b2d7f",
  "technologyIds": [1, 2]
}
```

- `title` / `description`: obrigatórios, não vazios.
- `repository`: obrigatório, URL válida.
- `profileId`: obrigatório, UUID de um perfil existente (retorna `404` se não encontrado).
- `technologyIds`: opcional, array de ids inteiros de tecnologias existentes (retorna `400` se algum ID não existir).

## Tratamento de Erros

A API possui um middleware centralizado de erros (`src/server.ts`) que padroniza as respostas:

| Situação                                    | Status | Corpo da resposta                                      |
| -------------------------------------------- | ------ | -------------------------------------------------------- |
| Falha de validação (Zod)                     | `400`  | `{ "error": "Validation Error", "issues": [...] }`       |
| Violação de chave única (Prisma `P2002`)     | `409`  | `{ "error": "Conflict", "message": "..." }`               |
| Registro não encontrado (Prisma `P2025`)     | `404`  | `{ "error": "Not Found", "message": "..." }`               |
| Chave estrangeira inválida (Prisma `P2003`)  | `400`  | `{ "error": "Foreign Key Constraint Failed", "message": "..." }` |
| Erro não tratado                             | `500`  | `{ "error": "Internal Server Error", "message": "..." }`   |

## Deploy

O projeto inclui um blueprint (`render.yaml`) pronto para deploy no [Render](https://render.com/):

- **Web Service** (`devshowcase-api`): runtime Node, build via `npm install --include=dev && npx prisma db push && npm run build`, start via `npm run start`, health check em `/api/health`.
  - `--include=dev` é necessário porque `NODE_ENV=production` faz o `npm install` ignorar `devDependencies` por padrão — e o build depende de `typescript`, `prisma` e dos pacotes `@types/*` para compilar.
  - `npx prisma db push` sincroniza o schema (`prisma/schema.prisma`) com o banco de produção a cada deploy, criando/atualizando as tabelas automaticamente. O projeto não usa `prisma migrate` (sem pasta `prisma/migrations`), então esse passo é obrigatório — sem ele as tabelas nunca são criadas no banco.
- **PostgreSQL** (`devshowcase-db`): banco gerenciado, com `DATABASE_URL` injetada automaticamente no serviço web.

Basta conectar o repositório ao Render e aplicar o blueprint.

## Scripts disponíveis

| Comando         | Descrição                                            |
| --------------- | ------------------------------------------------------ |
| `npm run dev`   | Inicia o servidor em modo desenvolvimento (hot reload)  |
| `npm run build` | Gera o Prisma Client e compila o TypeScript para `dist/`|
| `npm run start` | Executa o servidor a partir do build (`dist/server.js`) |
