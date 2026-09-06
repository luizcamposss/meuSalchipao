# meu-salchipão

Internal system for the **Semana Farroupilha** school event: students and staff register,
order the Salchipão snack, pay by Pix through Mercado Pago in-app, and get a digital ticket
to redeem at the counter. The event runs in phases — a sales window, then a redemption-only
phase after sales close.

This repository holds the **backend** (ASP.NET Core 8 Web API). The frontend is a separate
React app.

## Requirements

- .NET 8 SDK
- Docker (for the MySQL container)

## Setup

```bash
cd backend
cp .env.example .env          # then fill in the values
docker compose up -d          # start MySQL
dotnet ef database update     # apply migrations
dotnet run                    # http://localhost:5029/swagger
```

Health check: `GET http://localhost:5029/health`.

Run `dotnet ef` and `dotnet run` from `backend/` — the app loads `.env` from the current
directory at startup.

## Tests

```bash
cd backend
dotnet test
```

## More

- `CLAUDE.md` — architecture, configuration, conventions.
- `~/.claude/plans/glowing-petting-tower.md` — full design and milestone plan.
