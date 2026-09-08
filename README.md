# meu-salchipão — Backend

Sistema interno para a **Semana Farroupilha** (evento escolar, RS). Digitaliza a compra do
lanche "Salchipão": aluno ou funcionário se cadastra, faz o pedido, **paga por Pix via Mercado
Pago dentro do app**, e recebe um **ticket digital** que é resgatado no balcão.

O evento roda em **fases**: uma janela de venda, e depois de uma data de corte as vendas
fecham e passa a valer só o resgate. A API expõe a fase atual — o frontend e as regras de
negócio reagem a ela **sem redeploy**.

Este repositório é **só o backend** (ASP.NET Core 8 Web API). O frontend é um app React
separado, fora deste repo.

---

## Índice

- [Status](#status)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Modelo de domínio](#modelo-de-domínio)
- [Ciclo de vida do evento](#ciclo-de-vida-do-evento)
- [Autenticação](#autenticação)
- [Pagamento Pix + Webhook](#pagamento-pix--webhook)
- [Referência da API](#referência-da-api)
- [Configuração](#configuração)
- [Como rodar](#como-rodar)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Decisões e tradeoffs](#decisões-e-tradeoffs)
- [Lacunas conhecidas / próximos passos](#lacunas-conhecidas--próximos-passos)

---

## Status

Funcionalmente completo. Marcos M0–M8:

| Marco | Entrega |
|---|---|
| M0 | Fundação: `.env` + DotNetEnv, EF Core + Pomelo/MySQL, `AppDbContext`, ProblemDetails + handler global de exceções, `/health`. |
| M1 | Auth: cadastro, login, refresh com rotação, logout, `/auth/me`. JWT em cookie `HttpOnly` + refresh token opaco. |
| M2 | Catálogo: `Product` + seed do Salchipão, leitura pública. |
| M3 | Fase do evento: `EventSettings` (linha única) + `EventPhaseService` (usa `TimeProvider`), `GET/PUT /event`. |
| M4 | Pedidos: criação com snapshot de preço, total calculado no servidor, guard de fase. |
| M5 | Pix + Webhook: `MercadoPagoClient` (HTTP tipado), `POST /orders/{id}/payment`, `POST /webhooks/mercadopago` (assinatura HMAC + idempotência), `SalesCutoffWorker`. |
| M6 | Ticket digital + resgate (`redeem` com update atômico). |
| M7 | SAC: chamados de suporte com thread de mensagens. |
| M8 | Endurecimento: enums como string no JSON, rate limiting, CORS, Docker. |

**Não incluído:** testes automatizados, CI, health-check com ping ao banco, logging estruturado
avançado, o `IExceptionHandler` custom por tipo já existe mas sem cobertura de teste. Ver
[lacunas](#lacunas-conhecidas--próximos-passos).

---

## Stack

| Camada | Escolha |
|---|---|
| Runtime | .NET 8 / ASP.NET Core Web API (controllers) |
| Banco | MySQL 8.4 |
| ORM | EF Core 8 + **Pomelo.EntityFrameworkCore.MySql** (Code-First + Migrations) |
| Auth | `Microsoft.AspNetCore.Authentication.JwtBearer` + `PasswordHasher<T>` (só o hasher do Identity, não o framework) |
| Mapeamento | AutoMapper (um `Profile` por módulo) |
| HTTP externo | `HttpClient` tipado (`AddHttpClient<T>`) + `Microsoft.Extensions.Http.Resilience` |
| Config | `.env` na raiz, carregado por **DotNetEnv** antes do `builder` |
| Container | Dockerfile multi-stage + `docker-compose` (API + MySQL) |

---

## Arquitetura

**Monólito modular.** Um único projeto, um deploy, um `AppDbContext`, um banco — mas dividido
em módulos de fronteira clara:

```
Auth · Catalog · Event · Orders · Payments · Sac
```

Cada módulo tem a mesma estrutura interna:

| Pasta | Papel |
|---|---|
| `Domain/` | entidades e enums — sem referência a EF ou HTTP |
| `Persistence/` | `IEntityTypeConfiguration<T>` (mapeamento fluent) — descoberto por `ApplyConfigurationsFromAssembly`, sem registro manual |
| `Contracts/` | DTOs de request/response (`record`) — nunca se expõe entidade |
| `Services/` | lógica de aplicação (interface + implementação, registrada no `Program.cs`) |
| `Endpoints/` | controllers |
| `Mapping/` | `XMappingProfile : Profile` — descoberto pelo scan do AutoMapper |

As dependências apontam **para dentro**, para o `Domain`. É o espírito de Clean/Onion
Architecture sem a cerimônia de projetos separados.

### Ciclo de uma requisição

```
HTTP  →  Middleware pipeline  →  Controller  →  Service  →  AppDbContext / gateway externo
                                    │              │
                            (identidade do JWT)  (regras de negócio, exceções de domínio)
```

**Pipeline** (`Program.cs`, em ordem):
`UseExceptionHandler` → Swagger (dev) → `UseHttpsRedirection` (prod) → `UseCors` →
`UseAuthentication` → `UseAuthorization` → `UseRateLimiter` → `MapControllers`.

**Erros:** os services lançam exceções de domínio (`ConflictException`, `NotFoundException`,
`ValidationException`, `AuthenticationException`, `MercadoPagoException`). O
`GlobalExceptionHandler` (`IExceptionHandler`, roda dentro do `UseExceptionHandler`) mapeia o
**tipo** para o status code e devolve **ProblemDetails** (RFC 7807):

| Exceção | Status |
|---|---|
| `ValidationException` | 400 |
| `AuthenticationException` | 401 |
| `NotFoundException` | 404 |
| `ConflictException` | 409 |
| `MercadoPagoException` | 502 |
| qualquer outra | 500 (pipeline padrão) |

---

## Modelo de domínio

### Entidades

| Tabela | Campos-chave | Observação |
|---|---|---|
| `users` | `Email` (único), `Enrollment` (único), `Shift`, `PasswordHash`, `Role`, `Active` | `email VARCHAR(191)` — limite de índice do InnoDB com utf8mb4 |
| `sessions` | `UserId`, `TokenHash` (SHA-256 hex, único), `ExpiresAt`, `LastUsedAt` | guarda **refresh tokens** (hash), não o access token |
| `products` | `Name`, `Description`, `Price` (`DECIMAL(10,2)`), `ImageUrl?`, `Available` | seeded: `0b8a3f6e-1c2d-4e5f-8a9b-000000000001` = "Salchipão" |
| `event_settings` | `SalesOpenAt`, `SalesCloseAt`, `RedemptionOpensAt`, `ForcedPhase`, `UpdatedBy?` | **linha única** (id fixo `11111111-0000-0000-0000-000000000001`) |
| `orders` | `UserId`, `Total`, `Status`, `PaymentStatus`, `RedeemedAt?`, `RedeemedBy?` | `Total` sempre calculado no servidor; `RedeemedBy` não usado |
| `order_items` | `OrderId`, `ProductId`, `ProductName` (**snapshot**), `UnitPrice` (**snapshot**), `Quantity` | preço/nome congelados no momento do pedido |
| `payments` | `OrderId`, `ExternalId?` (id no MP, único), `Status`, `Amount`, `PixCode?`, `PixQrCodeBase64?`, `ExpiresAt`, `ApprovedAt?`, `LastWebhookAt?` | `ExternalId` nulável — a linha nasce como *stub* antes da chamada ao MP |
| `payment_webhook_events` | `EventId` (id da notificação, único), `PaymentId`, `Action`, `ProcessedAt` | chave de idempotência do webhook |
| `sac_tickets` | `UserId`, `OrderId?`, `Subject`, `Description`, `Status`, `Priority` | |
| `sac_messages` | `TicketId`, `SenderId`, `FromStaff`, `Message`, `CreatedAt` | `FromStaff` = snapshot do papel do remetente |

Todo enum é gravado como **string** no banco (`.HasConversion<string>()`) e serializado como
**nome** no JSON. Todos começam em `1` — o valor `0` (`Undefined`) é um sentinela detectável de
"não setado".

### Enums

```
Role                 : Student | Staff                         (Undefined = 0, inválido)
Shift                : Morning | Afternoon | Evening            (Undefined = 0, inválido)
OrderStatus          : AwaitingPayment → Paid → Redeemed | Cancelled
PaymentStatus        : Pending → Approved | Rejected | Expired | Refunded
ForcedPhase          : Auto | SalesOnly | RedemptionOnly | Closed
SacTicketStatus      : Open → InProgress → Resolved → Closed
SacTicketPriority    : Low | Normal | High
```

### Máquinas de estado

**`Order.Status`** (ciclo do ticket):

```
AwaitingPayment ──(webhook: pagamento approved)──▶ Paid ──(POST /redeem)──▶ Redeemed
       │
       └──(webhook: rejected/expired · ou SalesCutoffWorker no fechamento)──▶ Cancelled
```

**`Order.PaymentStatus` / `Payment.Status`** seguem o status do Mercado Pago
(`Pending → Approved / Rejected / Expired / Refunded`), mapeados por
`MercadoPagoStatusMap`.

---

## Ciclo de vida do evento

`EventSettings` é uma linha única com três datas e um override manual. `EventPhaseService`
calcula, a partir do `TimeProvider` (injetável → testável):

| Campo | Verdade quando |
|---|---|
| `salesOpen` | `SalesOpenAt <= agora < SalesCloseAt` |
| `redemptionOpen` | `agora >= RedemptionOpensAt` |

`ForcedPhase` (setado pelo Staff via `PUT /event`) **sobrepõe** o cálculo por data:

| ForcedPhase | salesOpen | redemptionOpen |
|---|---|---|
| `Auto` | segue as datas | segue as datas |
| `SalesOnly` | `true` | `false` |
| `RedemptionOnly` | `false` | `true` |
| `Closed` | `false` | `false` |

**Guards** que consomem isso:

- `POST /orders` e `POST /orders/{id}/payment` → exigem `salesOpen`, senão **409**.
- `POST /orders/{id}/redeem` → exige `redemptionOpen`, senão **409**.

**Seed da migration:** `SalesOpenAt = 2026-09-08`, `SalesCloseAt = 2026-09-14 23:59`,
`RedemptionOpensAt = 2026-09-17`, `ForcedPhase = Auto`. Ajuste com `PUT /event` ou SQL direto.

`GET /event` devolve `serverTime` — o frontend faz o *countdown* contra o relógio do servidor,
não o do cliente.

---

## Autenticação

**Dois tokens, papéis diferentes:**

| | Access token (JWT) | Refresh token (opaco) |
|---|---|---|
| Formato | JWT assinado (HMAC-SHA256), claims `sub`/`name`/`role`/`iss`/`aud`/`exp` | 32 bytes aleatórios, base64url |
| Vida | ~15 min | ~30 dias |
| Validação | assinatura + `exp`, **sem ir ao banco** | hash SHA-256 confere com a linha em `sessions` |
| Revogável | não (vale até expirar) | sim (apaga a linha) |
| Transporte | cookie `access_token` (`HttpOnly; Secure; SameSite=Lax`) | cookie `refresh_token` (mesmo + `Path=/auth/refresh`) |

**Fluxo:**

1. `POST /auth/login` — valida credenciais + `user.Active`, emite os dois tokens, seta os dois cookies.
2. Cada request autenticado → o `JwtBearer` lê o JWT **do cookie** (evento `OnMessageReceived`), valida offline.
3. Access token expira → o cliente chama `POST /auth/refresh` (sozinho, em background). O servidor acha a `session` pelo hash, **rotaciona** (apaga a linha antiga, cria uma nova, emite novo JWT), reescreve os cookies.
4. `POST /auth/logout` — apaga a `session` e limpa os cookies.

**Falha de credencial** (email inexistente, senha errada, conta inativa) → **um único 401
genérico**, para não vazar quais emails existem.

**CSRF:** coberto por `SameSite=Lax` (barra POST cross-site) + allowlist estrita de CORS
(`Cors:AllowedOrigins` + `AllowCredentials`). Sem fluxo de token antiforgery — decisão
deliberada para o escopo deste app.

**Rate limiting:**

| Policy | Limite | Onde |
|---|---|---|
| `auth` | 10 req / min por IP | `POST /auth/register`, `POST /auth/login` |
| `payment` | 5 req / min por usuário | `POST /orders/{id}/payment` |

Atrás de um proxy reverso (nginx/Caddy/ngrok), configure `UseForwardedHeaders` para que
`RemoteIpAddress` seja o cliente real.

---

## Pagamento Pix + Webhook

Integração **direta** com o Mercado Pago (Checkout Transparente / Pix), sem o SDK. Duas
chamadas: `POST /v1/payments` e `GET /v1/payments/{id}`. **Sem estorno** ("pagou não volta").

### Criar a cobrança — `POST /orders/{id}/payment`

1. Pedido tem que ser do usuário e estar `AwaitingPayment`.
2. Já existe cobrança `Pending` viva do pedido? Devolve **essa** (nunca cria uma segunda).
3. Guard `salesOpen`.
4. `date_of_expiration = min(agora + 30min, SalesCloseAt)` — a cobrança **não sobrevive** ao
   fechamento das vendas. É isso que dispensa o estorno.
5. Persiste um **stub** `Payment` (`ExternalId = null`) **antes** de chamar o MP. O `Id` do stub
   é o `X-Idempotency-Key` — se a chamada ou o save falharem, o retry reutiliza o stub e
   re-chama o MP com a mesma chave (o MP devolve a mesma cobrança, não duplica).
6. Chama o MP, preenche `ExternalId` + `PixCode` + `PixQrCodeBase64` + status, salva.
7. Devolve `{ paymentId, status, pixCode, pixQrCodeBase64, expiresAt, amount }`. O cliente
   renderiza o QR e faz *polling* em `GET /payments/{paymentId}`.

### Webhook — `POST /webhooks/mercadopago`

`[AllowAnonymous]` — o MP não manda JWT; a **assinatura é a autenticação**.

1. **Valida a assinatura** — header `x-signature` (`ts=...,v1=...`) + `x-request-id`. Reconstrói
   o manifesto `id:{data.id};request-id:{x-request-id};ts:{ts};`, HMAC-SHA256 com
   `MercadoPago:WebhookSecret`, compara com `v1` em tempo constante. Não bate → **401**.
2. Não é evento de `payment` → **200** e ignora.
3. **Idempotência** — o `EventId` (id da notificação) já está em `payment_webhook_events`? → **200** e sai.
4. **Busca o pagamento no MP** (`GET /v1/payments/{data.id}`) — o corpo do webhook **nunca**
   traz o status, só o id.
5. Atualiza o `Payment` e, se o pedido está `AwaitingPayment`:
   - MP `approved` → `Order.Status = Paid` (**o ticket vira válido**).
   - MP `rejected` / `expired` → `Order.Status = Cancelled`.
   - Se o pedido já estava `Cancelled` e veio `approved` → só log de alerta, Staff resolve na
     mão (raríssimo por causa do cap de expiração).
6. Grava o `PaymentWebhookEvent` + as mudanças **numa transação**. Retry concorrente que
   colide no índice único do `EventId` → capturado (a outra retentativa fez trabalho idêntico).
7. **200** rápido.

### `SalesCutoffWorker` (BackgroundService)

Roda a cada 2 min. Limpa pedidos que ninguém vai retomar:

- `Payment` `Pending` cujo `ExpiresAt` já passou → `Expired`, pedido → `Cancelled` (a qualquer momento).
- Quando `agora >= SalesCloseAt` → **todo** pedido ainda `AwaitingPayment` → `Cancelled`.

Cria um `IServiceScope` a cada tick (o worker é singleton, o `DbContext` é scoped).

---

## Referência da API

Base: `http://localhost:5029` (ou `API_PORT`). Swagger em `/swagger` (dev).
Auth = cookie `access_token`. **Aluno** = qualquer usuário logado; **Staff** = `Role = Staff`.

### Auth — `/auth`

| Método | Rota | Auth | Corpo / Query | Respostas |
|---|---|---|---|---|
| POST | `/auth/register` | — (rate: `auth`) | `{ name, email, enrollment, shift, password }` | `201` + user · `400` validação · `409` email/matrícula em uso |
| POST | `/auth/login` | — (rate: `auth`) | `{ email, password }` | `200` + user + **cookies** · `401` credenciais |
| POST | `/auth/refresh` | cookie `refresh_token` | — | `200` + user + cookies novos · `401` (limpa cookies) |
| POST | `/auth/logout` | — | — | `204` (idempotente) |
| GET | `/auth/me` | aluno | — | `200` `{ id, name, role }` · `401` |

### Catálogo — `/products`

| Método | Rota | Auth | Respostas |
|---|---|---|---|
| GET | `/products` | público | `200` lista (só `Available == true`) |
| GET | `/products/{id}` | público | `200` · `404` |

### Fase do evento — `/event`

| Método | Rota | Auth | Corpo | Respostas |
|---|---|---|---|---|
| GET | `/event` | público | — | `200` `{ salesOpen, redemptionOpen, phase, salesOpenAt, salesCloseAt, redemptionOpensAt, serverTime }` |
| PUT | `/event` | **Staff** | `{ salesOpenAt, salesCloseAt, redemptionOpensAt, forcedPhase }` | `200` snapshot · `400` (`SalesOpenAt >= SalesCloseAt`) · `403` |

### Pedidos — `/orders`

| Método | Rota | Auth | Corpo | Respostas |
|---|---|---|---|---|
| POST | `/orders` | aluno | `{ items: [{ productId, quantity }] }` | `201` + pedido · `400` (vazio / qtd inválida / >4 itens / produto inexistente) · `409` (venda fechada / produto indisponível) |
| GET | `/orders` | aluno | — | `200` — só os meus |
| GET | `/orders/{id}` | aluno (meu) / Staff (qualquer) | — | `200` · `404` |
| GET | `/orders/{id}/ticket` | dono / Staff | — | `200` `{ orderId, status, total, redeemedAt?, qrValue, items }` · `404` (não pago ainda) |
| POST | `/orders/{id}/redeem` | **o próprio aluno** | — | `200` ticket resgatado · `409` (resgate não aberto / não pago / já resgatado — com a data) · `404` |

O `redeem` é autenticado como o **próprio aluno** — o operador do balcão faz o gesto de
"arrastar para confirmar" no celular do cliente. A transição é um `UPDATE ... WHERE
Status = 'Paid'` atômico (à prova de dois scans simultâneos).

### Pagamento — `/orders/{id}/payment`, `/payments`

| Método | Rota | Auth | Respostas |
|---|---|---|---|
| POST | `/orders/{orderId}/payment` | aluno (dono) (rate: `payment`) | `201` `{ paymentId, status, pixCode, pixQrCodeBase64, expiresAt, amount }` · `409` (não `AwaitingPayment` / venda fechada) · `404` · `502` (MP falhou) |
| GET | `/payments/{id}` | aluno (dono) / Staff | `200` (para *polling* do status) · `404` |
| POST | `/webhooks/mercadopago` | assinatura MP | `200` sempre (menos `401` assinatura inválida) |

### SAC — `/sac/tickets`

| Método | Rota | Auth | Corpo / Query | Respostas |
|---|---|---|---|---|
| POST | `/sac/tickets` | aluno | `{ subject, description, orderId? }` | `201` · `400` (orderId não é do usuário) |
| GET | `/sac/tickets` | aluno | — | `200` — só os meus |
| GET | `/sac/tickets/all` | **Staff** | `?status=` | `200` — fila (High primeiro, mais antigo dentro da prioridade) |
| GET | `/sac/tickets/{id}` | dono / Staff | — | `200` com a thread de mensagens · `404` |
| POST | `/sac/tickets/{id}/messages` | dono / Staff | `{ message }` | `200` · `409` (ticket `Closed`) · `404` |
| PATCH | `/sac/tickets/{id}` | **Staff** | `{ status?, priority? }` | `200` · `404` |

Auto-transições: staff responde num `Open` → `InProgress`; aluno responde num `Resolved` → `Open`.

### Infra

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | `200 { status: "ok" }` |
| GET | `/swagger` | Swagger UI (só em Development) |

---

## Configuração

Todos os segredos vêm do `.env` na raiz do `backend/` (gitignored). `.env.example` é o modelo
versionado. Carregado por `DotNetEnv` **antes** do `WebApplication.CreateBuilder`, exposto via
`AddEnvironmentVariables()`. O **mesmo `.env`** alimenta o Docker Compose.

| Chave | Para quê |
|---|---|
| `DB_NAME`, `DB_USER`, `DB_USER_PASSWORD`, `DB_ROOT_PASSWORD`, `DB_PORT` | usadas pelo Docker Compose para subir o MySQL |
| `ConnectionStrings__DefaultConnection` | string de conexão que a API lê (`__` vira `:` na config do .NET) |
| `Jwt__SigningKey` | chave HMAC do JWT (≥ 32 chars) |
| `Jwt__Issuer`, `Jwt__Audience` | validados em todo request |
| `MercadoPago__AccessToken` | `TEST-...` no sandbox, token de produção em prod (**mesmo código**) |
| `MercadoPago__WebhookSecret` | segredo para validar a assinatura do webhook |
| `MercadoPago__NotificationBaseUrl` | URL pública (ngrok em dev, domínio em prod); a API monta `{base}/webhooks/mercadopago` |
| `Cors__AllowedOrigins` | origens do frontend, separadas por vírgula |
| `API_PORT` | porta do host quando a API roda no container (default 5029) |

---

## Como rodar

### Requisitos
- .NET 8 SDK
- Docker

### Local (API no host, MySQL no container)

```bash
cd backend
cp .env.example .env          # preencha os valores
docker compose up -d meuSalchipao   # só o MySQL
dotnet run                    # a API aplica as migrations pendentes no startup
```

Swagger: `http://localhost:5029/swagger` · Health: `GET /health`.

Rode `dotnet run` e o `dotnet ef` **de dentro de `backend/`** — a app carrega o `.env` do
diretório atual.

### Tudo em container

```bash
cd backend
docker compose up --build     # MySQL + API; a API espera o healthcheck do MySQL e migra sozinha
```

### Webhook do Mercado Pago em dev

O MP precisa alcançar `POST /webhooks/mercadopago`. Localmente:

```bash
ngrok http 5029
# copie a URL https e coloque em MercadoPago__NotificationBaseUrl no .env
```

Em produção: nginx/Caddy + TLS na frente do Kestrel; `MercadoPago__NotificationBaseUrl` = o
domínio real.

### Migrations

```bash
cd backend
dotnet ef migrations add <Nome> -o Migrations
dotnet ef database update
```

A app também roda `Database.Migrate()` no startup (ok para uma instância; num deploy
multi-instância você rodaria migrations como passo separado).

---

## Estrutura de pastas

```
backend/
  Program.cs                       # composition root: DI, pipeline, hosted services
  Dockerfile · .dockerignore · docker-compose.yaml
  Migrations/
  Shared/
    Persistence/AppDbContext.cs    # 1 DbContext, ApplyConfigurationsFromAssembly
    Exceptions/                    # ConflictException, NotFoundException, MercadoPagoException, GlobalExceptionHandler
  Modules/
    Auth/      Domain(User, Session, Role, Shift) · Services(AuthService, JwtTokenService) · Contracts · Endpoints · Mapping
    Catalog/   Domain(Product) · Services · Contracts · Endpoints · Mapping
    Event/     Domain(EventSettings, ForcedPhase) · Services(EventPhaseService) · Contracts · Endpoints
    Orders/    Domain(Order, OrderItem, OrderStatus, PaymentStatus) · Services(OrderService, RedemptionService) · Contracts · Endpoints · Mapping
    Payments/  Domain(Payment, PaymentWebhookEvent)
               Gateway(MercadoPagoClient, MercadoPagoModels, MercadoPagoSignatureValidator, MercadoPagoStatusMap, MpWebhookNotification)
               Services(PaymentService) · BackgroundJobs(SalesCutoffWorker) · Contracts · Endpoints
    Sac/       Domain(SacTicket, SacMessage, SacTicketStatus, SacTicketPriority) · Services · Contracts · Endpoints · Mapping
```

---

## Decisões e tradeoffs

| Decisão | Por quê |
|---|---|
| **Monólito modular**, não microserviços | 1 produto, 1 evento, poucos endpoints. Microserviços adicionariam transações distribuídas, mensageria, orquestração — sem ganho. Os módulos já são as linhas de corte se um dia precisar. |
| **`.env` + DotNetEnv**, não `user-secrets` | O `user-secrets` é só do .NET. O Docker Compose lê `.env` nativamente. Um arquivo é fonte única para a API **e** o container. |
| **`PasswordHasher<T>` sozinho**, não ASP.NET Identity | Só precisamos do hasher (PBKDF2). O Identity imporia seu schema (`AspNetUsers` com ~15 colunas) e seu modelo de sessão, que brigaria com o JWT-em-cookie custom. |
| **JWT em cookie `HttpOnly`**, não no header `Authorization` | O JS nunca toca o token → XSS não rouba. Custo: CSRF (mitigado por `SameSite=Lax` + CORS). |
| **Refresh token opaco no banco**, JWT stateless | Combina revogabilidade (apaga a linha = logout) com validação rápida por request (só assinatura). |
| **`MercadoPagoClient` HTTP tipado**, não o SDK `mercadopago` | O SDK usa config estática global, cria o próprio `HttpClient` (perde `IHttpClientFactory` + resiliência), e é difícil de fakear. A superfície do MP que usamos são 2 chamadas. |
| **Sem estorno automático** | "Pagou não volta." O `date_of_expiration` limitado ao `SalesCloseAt` torna "pagamento aprovado depois do fechamento" praticamente impossível. |
| **Sem token antiforgery** | `SameSite=Lax` + allowlist de CORS fecham os vetores práticos de CSRF para um SPA de origem conhecida. |
| **Snapshot de nome/preço em `OrderItem`** | O pedido é registro histórico. Se o preço mudar semana que vem, o pedido antigo ainda reflete o que foi pago (e o que o MP recebeu). |
| **`Total` calculado no servidor** | O `CreateOrderRequest` não tem campo `total`. Senão alguém pediria 50 salchipões e mandaria `total: 0.01`. |
| **`TimeProvider` injetado** | Decisões de fase e expiração dependem de "agora" — injetável = testável ("finja que é dia 20"). |
| **Auto-migrate no startup** | `docker compose up` de um banco limpo simplesmente funciona. |

---

## Lacunas conhecidas / próximos passos

- **Testes automatizados + CI** — não existem. Prioridade: `EventPhaseService` (fronteiras de
  data com `FakeTimeProvider`), `MercadoPagoStatusMap`, idempotência do webhook (fake do
  `MercadoPagoClient`), cálculo de total, transições do `redeem`, `AssertConfigurationIsValid`
  dos profiles do AutoMapper. Integração com `WebApplicationFactory` + `Testcontainers.MySql`.
- **Caminho `approved` do webhook** — validado só até `payment.created` no sandbox (o simulador
  de Pix do MP não estava disponível). O código do `approved → Paid` é determinístico; um teste
  com fake do client cobre isso.
- **`UseForwardedHeaders`** — necessário antes de prod para o rate-limit por IP funcionar atrás
  do nginx/Caddy.
- **Reconciliação com o MP no `SalesCutoffWorker`** — varrer `Payment` `Pending` e consultar o
  MP, caso um webhook `approved` se perca.
- **Health-check com ping ao banco** (`AddDbContextCheck`), **Swagger com auth**, **logging
  estruturado** (Serilog).
- **`AddXModule(IServiceCollection)` por módulo** — hoje o `Program.cs` é uma lista plana.
- **`SaveChangesInterceptor` de auditoria** — hoje cada service seta `CreatedAt`/`UpdatedAt` na mão.
- **`payments.PreferenceId` / `CheckoutUrl`** — colunas do diagrama original, não usadas (Pix transparente).
