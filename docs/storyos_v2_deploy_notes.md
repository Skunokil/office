# Story OS v2 — Deployment Notes (Task 11)

## Что изменено

| Файл | Изменение |
|------|-----------|
| `backend/storyos_api_v2/Dockerfile` | **Создан** — production-like образ для v2 API |
| `~/bot_factory/docker-compose.yml` | **Добавлен** сервис `storyos-api-v2` |
| `~/bot_factory/Caddyfile` | **Добавлен** host-блок `storyos.transformatornaya.ru` |

v1 (`office.transformatornaya.ru`, `storyos-api`) — не затронут.

---

## Маршрутизация после Task 11

```
office.transformatornaya.ru      → v1 (без изменений)
  /api/*         → storyos-api:8000
  /planka*       → planka:1337
  /dashboard*    → storyos-site:80
  /secret/ws*    → 172.18.0.1:8443 (Xray VPN)
  /              → office-site:80

storyos.transformatornaya.ru     → v2 (новый)
  /api/v2/*      → storyos-api-v2:8002
  /              → respond-заглушка (текст)
```

---

## Как поднять

```bash
cd ~/bot_factory

# Собрать и поднять только v2, не трогая остальных
docker compose up -d --build storyos-api-v2

# Перезагрузить Caddy для применения нового host-блока
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

---

## Проверка

```bash
# Healthcheck v2
curl -I https://storyos.transformatornaya.ru/api/v2/health

# Ожидаемый ответ: HTTP/2 200
# Body: {"status": "ok", "version": "0.1.0", "mode": "mock"}

# Корень (заглушка)
curl https://storyos.transformatornaya.ru/
# Body: Story OS v2 deployment skeleton is alive. API health: /api/v2/health

# Убедиться, что v1 жив
curl -I https://office.transformatornaya.ru/api/health
```

---

## Откат изменений

```bash
# Удалить только v2-сервис
cd ~/bot_factory
docker compose stop storyos-api-v2
docker compose rm -f storyos-api-v2

# Откатить Caddyfile и docker-compose.yml через git
cd ~/bot_factory
git diff Caddyfile docker-compose.yml   # проверить
git restore Caddyfile docker-compose.yml

# Перезагрузить Caddy
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

---

## Риски и что не доделано

### DNS
**Требуется DNS-запись**: `storyos.transformatornaya.ru` → IP сервера.
Без неё Caddy не сможет получить TLS-сертификат, домен не откроется.
Добавить A-запись у регистратора или в Beget DNS-панели.

### Что пока заглушка
- `/` на `storyos.transformatornaya.ru` — текстовый respond, не HTML
- Весь v2 API работает на mock-данных в памяти (без Postgres)

### Следующие шаги

| Шаг | Описание |
|-----|----------|
| Task 12 | Подключить Postgres к v2: применить `schema.sql`, заменить `data_store.py` на SQL-запросы |
| Task 13 | Фронт v2: создать `storyos-v2/` директорию, сервис в compose, смонтировать в новый статический Caddy-сервис |
| Task 14 | Добавить Write-эндпоинты (POST/PATCH) в v2 API |
