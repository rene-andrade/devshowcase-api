# DevShowcase API

API RESTful para cadastro e divulgação de perfis de desenvolvedores, seus projetos, as tecnologias utilizadas e feedbacks recebidos. Construída com Node.js, TypeScript, Express, Prisma ORM e validação de dados com Zod.

## Stack

- **Node.js** + **TypeScript**
- **Express 5** — servidor HTTP e roteamento
- **Prisma ORM 7** (com `@prisma/adapter-pg`) — acesso a dados sobre **PostgreSQL**
- **Zod** — validação de payloads das requisições
- **swagger-ui-express** — documentação interativa OpenAPI 3.1
- **cors** / **dotenv** — middlewares e configuração de ambiente
- **tsx** — execução em modo desenvolvimento com hot reload

## Modelo de Dados

O schema (`prisma/schema.prisma`) define quatro entidades. O `id` de `Profile` é um **UUID v7** (tipo nativo `uuid` do Postgres, ordenável por data de criação); os demais modelos usam `id` **inteiro autoincremento**.

- **Profile**: `id`, `name`, `bio` (opcional), `githubUrl`, `email` (único), `createdAt`. Possui muitos `Project`.
- **Project**: `id`, `title`, `description`, `repository`, `upvotes` (curtidas, padrão 0), `averageRating` (nota média dos feedbacks, padrão 0), `profileId`, `createdAt`. Pertence a um `Profile` (cascade on delete), relaciona N:N com `Technology` e possui muitos `Feedback`.
- **Technology**: `id`, `name` (único). Relaciona N:N com `Project`.
- **Feedback**: `id`, `author`, `comment`, `rating`, `projectId`, `createdAt`. Pertence a um `Project` (cascade on delete).

## Estrutura do Projeto

```
src/
├── controllers/        # Lógica de negócio das rotas (profile, project, technology)
├── docs/openapi.ts     # Especificação OpenAPI (schemas de request gerados dos DTOs)
├── dtos/               # Schemas Zod de validação de entrada
├── errors/app-error.ts # Classes de erro da aplicação (400, 404, 409)
├── lib/prisma.ts       # Instância singleton do PrismaClient (via adapter-pg)
├── middlewares/        # Handler global de erros e de rotas inexistentes
├── utils/params.ts     # Validação dos parâmetros :id
├── routes.ts           # Definição das rotas da API
└── server.ts           # Setup do Express, Swagger e middlewares
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

## Documentação interativa (Swagger)

- **Swagger UI:** `http://localhost:3000/api/docs` (em produção: `<url-do-serviço>/api/docs`)
- **Especificação OpenAPI em JSON:** `/api/docs.json`

Os schemas de request são gerados diretamente dos DTOs Zod, então a documentação sempre reflete as mesmas regras de validação da API.

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

| Método | Rota                          | Descrição                                                        |
| ------ | ----------------------------- | ------------------------------------------------------------------ |
| POST   | `/api/projects`               | Cria um novo projeto, vinculado a um perfil e (opcionalmente) tecnologias |
| GET    | `/api/projects`               | Lista projetos (mais recentes primeiro) com filtro por tecnologia e paginação |
| POST   | `/api/projects/:id/feedbacks` | Cadastra um feedback (nota 1 a 5) e recalcula a nota média do projeto |
| PUT    | `/api/projects/:id/upvote`    | Incrementa em 1 as curtidas do projeto |

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

**Listagem — `GET /api/projects`**

| Parâmetro de query | Descrição | Padrão |
| ------------------ | --------- | ------ |
| `technology` | Filtra pelo nome da tecnologia, sem diferenciar maiúsculas/minúsculas | *(sem filtro)* |
| `page` | Página, a partir de 1 | `1` |
| `limit` | Itens por página, de 1 a 50 | `10` |

Exemplo: `GET /api/projects?technology=typescript&page=1&limit=5`

```json
{
  "data": [ { "id": 1, "title": "DevShowcase API", "upvotes": 3, "averageRating": 4.5, "...": "..." } ],
  "meta": { "page": 1, "limit": 5, "total": 12, "totalPages": 3 }
}
```

**Payload — `POST /api/projects/:id/feedbacks`**

```json
{
  "author": "Maria Silva",
  "comment": "Projeto muito bem organizado!",
  "rating": 5
}
```

- `author` / `comment`: obrigatórios, não vazios.
- `rating`: obrigatório, inteiro de 1 a 5.
- O feedback é gravado e a nota média do projeto é recalculada na mesma transação. A resposta `201` traz o feedback criado e `project: { id, averageRating, feedbackCount }`.

**`PUT /api/projects/:id/upvote`** não tem corpo. O incremento é atômico no banco, então requisições simultâneas não perdem votos. A resposta `200` traz `{ "id": 1, "upvotes": 4 }`.

Nas rotas com `:id` de projeto, um id que não seja inteiro positivo retorna `400` e um projeto inexistente retorna `404`.

## Tratamento de Erros

Um middleware global (`src/middlewares/error-handler.ts`) padroniza todas as respostas de erro:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [{ "field": "rating", "message": "Rating must be between 1 and 5" }],
  "path": "/api/projects/1/feedbacks",
  "timestamp": "2026-09-23T13:05:34.570Z"
}
```

`details` só aparece em erros de validação.

| Situação | Status |
| -------- | ------ |
| Validação de body/query falhou (Zod), com `details` por campo | `400` |
| JSON malformado no corpo da requisição | `400` |
| Parâmetro `:id` inválido, ou identificador em formato inválido (Prisma `P2023`) | `400` |
| Referência a registro inexistente (Prisma `P2003`) | `400` |
| Recurso não encontrado, ou rota inexistente | `404` |
| Registro duplicado (e-mail ou tecnologia já cadastrados, Prisma `P2002`) | `409` |
| Erro não tratado (em produção, com mensagem genérica) | `500` |

## Deploy

O projeto inclui um blueprint (`render.yaml`) pronto para deploy no [Render](https://render.com/):

- **Web Service** (`devshowcase-api`): runtime Node, build via `npm install --include=dev && npx prisma db push && npm run build`, start via `npm run start`, health check em `/api/health`.
  - `--include=dev` é necessário porque `NODE_ENV=production` faz o `npm install` ignorar `devDependencies` por padrão — e o build depende de `typescript`, `prisma` e dos pacotes `@types/*` para compilar.
  - `npx prisma db push` sincroniza o schema (`prisma/schema.prisma`) com o banco de produção a cada deploy, criando/atualizando as tabelas automaticamente. O projeto não usa `prisma migrate` (sem pasta `prisma/migrations`), então esse passo é obrigatório — sem ele as tabelas nunca são criadas no banco.
- **PostgreSQL** (`devshowcase-db`): banco gerenciado, com `DATABASE_URL` injetada automaticamente no serviço web.

Basta conectar o repositório ao Render e aplicar o blueprint.

### Segundo serviço: branch `advanced`

A versão com feedbacks, upvotes, paginação e Swagger roda num **segundo web service** no Render. Ele faz deploy do branch `advanced` e usa o **mesmo banco** `devshowcase-db`. O serviço do `main` e o `render.yaml` não mudam.

**Por que dá para usar o mesmo banco:** o schema do `advanced` só **adiciona** as colunas `upvotes` e `averageRating`, ambas com valor padrão. O `prisma db push` aplica isso sem perder dados, e o serviço do `main` ignora colunas que não conhece.

**Configuração no painel do Render:**

1. **New → Web Service**, escolha o mesmo repositório do GitHub e o branch **`advanced`**.
2. **Runtime:** Node.
   - **Build Command:** `npm install --include=dev && npx prisma db push && npm run build`
   - **Start Command:** `npm run start`
3. Em **Settings**:
   - **Auto-Deploy:** `On Commit`. Cada push no `advanced` gera um novo deploy (deploy contínuo).
   - **Health Check Path:** `/api/health`.
4. Em **Environment**, cadastre as variáveis de produção:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = a **Internal Database URL** do `devshowcase-db` (painel do banco → *Connections*)

   `PORT` é definido pelo próprio Render.

**Credenciais:** nenhuma credencial fica no código. O `.env` está no `.gitignore`, e em produção tudo vem das variáveis de ambiente do serviço. Use a *Internal* Database URL, que só é acessível dentro da rede do Render.

> ⚠ **Atenção com o banco compartilhado**
> - Depois que o serviço `advanced` rodar o `db push`, um novo deploy do **`main`** (que ainda tem o schema antigo) vai tentar remover `upvotes` e `averageRating`. O Prisma recusa essa perda de dados e **o build do `main` falha**. Evite commits no `main` até fazer o merge do `advanced`.
> - O PostgreSQL gratuito do Render expira depois de um período limitado a partir da criação. Confira a data de expiração no painel do banco.

## Scripts disponíveis

| Comando         | Descrição                                            |
| --------------- | ------------------------------------------------------ |
| `npm run dev`   | Inicia o servidor em modo desenvolvimento (hot reload)  |
| `npm run build` | Gera o Prisma Client e compila o TypeScript para `dist/`|
| `npm run start` | Executa o servidor a partir do build (`dist/server.js`) |
