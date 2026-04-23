# Story OS v2 — Deployment Notes

## Статус задач

| Задача | Описание | Статус |
|--------|----------|--------|
| Task 11 | Инфраструктура v2: Dockerfile, docker-compose, Caddyfile, skeleton API | ✅ Done |
| Task 12 | PostgreSQL-интеграция: db.py, repository.py, schema.sql, seed.sql, docker-compose env | ✅ Done |
| Task 13 | Manuscript annotations + entity mentions read API | ✅ Done |
| Task 14 | Write-эндпоинты (POST/PATCH) | 🔲 Planned |

**Текущая версия:** `storyos-v2-backend-v0.1.0` (коммит `724b348`)

---

## Что изменено

### Task 11

| Файл | Изменение |
|------|-----------|
| `backend/storyos_api_v2/Dockerfile` | Создан — production-like образ для v2 API |
| `~/bot_factory/docker-compose.yml` | Добавлен сервис `storyos-api-v2` |
| `~/bot_factory/Caddyfile` | Добавлен host-блок `storyos.transformatornaya.ru` |

### Task 12

| Файл | Изменение |
|------|-----------|
| `backend/storyos_api_v2/db.py` | Async engine + session factory + get_db() dependency |
| `backend/storyos_api_v2/repository.py` | Все read-запросы через SQLAlchemy text() |
| `backend/storyos_api_v2/schema.sql` | DDL для всех таблиц storyos_v2 |
| `backend/storyos_api_v2/seed.sql` | Seed-данные по "Тайне голубой вазы" (UUID-идентификаторы) |
| `~/bot_factory/docker-compose.yml` | `environment: DATABASE_URL`, `depends_on: postgres: healthy` |

### Task 13

| Файл | Изменение |
|------|-----------|
| `backend/storyos_api_v2/repository.py` | `check_manuscript_exists`, `check_entity_exists`, `get_manuscript_annotations`, `get_entity_mentions` |
| `backend/storyos_api_v2/routes.py` | `GET /api/v2/manuscripts/{id}/annotations`, `GET /api/v2/entities/{id}/mentions` |
| `backend/storyos_api_v2/seed.sql` | Секции 14 (annotations) и 15 (mentions) |

v1 (`office.transformatornaya.ru`, `storyos-api`) — не затронут.

---

## Маршрутизация

```
office.transformatornaya.ru      → v1 (без изменений)
  /api/*         → storyos-api:8000
  /planka*       → planka:1337
  /dashboard*    → storyos-site:80
  /secret/ws*    → 172.18.0.1:8443 (Xray VPN)
  /              → office-site:80

storyos.transformatornaya.ru     → v2
  /api/v2/*      → storyos-api-v2:8002
  /              → respond-заглушка (текст)
```

---

## Database setup (storyos_v2)

Выполнять один раз при первом деплое или после полного сброса БД.

```bash
PG_USER=$(cd ~/bot_factory && grep ^POSTGRES_USER .env | cut -d= -f2)

# 1. Создать БД
docker exec bot_factory-postgres-1 psql -U "$PG_USER" -d postgres \
  -c "CREATE DATABASE storyos_v2;"

# 2. Применить схему
docker exec -i bot_factory-postgres-1 psql -U "$PG_USER" -d storyos_v2 \
  < ~/projects/office/backend/storyos_api_v2/schema.sql

# 3. Загрузить seed (идемпотентно: ON CONFLICT DO NOTHING)
docker exec -i bot_factory-postgres-1 psql -U "$PG_USER" -d storyos_v2 \
  < ~/projects/office/backend/storyos_api_v2/seed.sql

# 4. Пересобрать и поднять сервис
cd ~/bot_factory && docker compose up -d --build storyos-api-v2
```

Проверить, что БД жива:

```bash
docker exec -it bot_factory-postgres-1 psql -U "$PG_USER" -d storyos_v2 \
  -c "SELECT count(*) FROM works; SELECT count(*) FROM annotations; SELECT count(*) FROM mentions;"
```

Ожидаемый результат: works=1, annotations=3, mentions=3.

---

## Как поднять (повторный деплой)

```bash
cd ~/bot_factory

# Пересобрать и перезапустить только v2
docker compose up -d --build storyos-api-v2

# Перезагрузить Caddy (если менялся Caddyfile)
docker compose exec -T caddy caddy reload --config /dev/stdin --adapter caddyfile < Caddyfile
```

---

## Verification

```bash
BASE="https://storyos.transformatornaya.ru"

WORK_ID="a0000000-0000-0000-0000-000000000001"
MS_ID="b0000000-0000-0000-0000-000000000001"
ENTITY_ID="c0000000-0000-0000-0000-000000000001"   # Джек Харингтон

# Healthcheck
curl -s "$BASE/api/v2/health"
# {"status":"ok","service":"storyos-v2","version":"0.1.0"}

# Список произведений
curl -s "$BASE/api/v2/works" | python3 -m json.tool | head -10

# Структура произведения (work + chapters + episodes + events)
curl -s "$BASE/api/v2/works/$WORK_ID/structure" | python3 -m json.tool | head -20

# Рукопись с текстовыми блоками
curl -s "$BASE/api/v2/manuscripts/$MS_ID" | python3 -m json.tool | head -20

# Все аннотации рукописи
curl -s "$BASE/api/v2/manuscripts/$MS_ID/annotations" | python3 -m json.tool

# Аннотации с фильтром по сущности
curl -s "$BASE/api/v2/manuscripts/$MS_ID/annotations?entity_id=$ENTITY_ID" | python3 -m json.tool

# Все упоминания сущности
curl -s "$BASE/api/v2/entities/$ENTITY_ID/mentions" | python3 -m json.tool

# Эпистемические треки
curl -s "$BASE/api/v2/epistemic-tracks?work_id=$WORK_ID" | python3 -m json.tool | head -20

# Диагностические issues
curl -s "$BASE/api/v2/issues?work_id=$WORK_ID&status=open" | python3 -m json.tool
```

Для прямого доступа через контейнер (без Caddy):

```bash
docker exec storyos-api-v2 curl -s http://localhost:8002/api/v2/health
```

---

## Откат изменений

```bash
# Остановить только v2-сервис
cd ~/bot_factory
docker compose stop storyos-api-v2
docker compose rm -f storyos-api-v2

# Откатить Caddyfile и docker-compose.yml через git
git diff Caddyfile docker-compose.yml   # проверить
git restore Caddyfile docker-compose.yml

# Перезагрузить Caddy
docker compose exec -T caddy caddy reload --config /dev/stdin --adapter caddyfile < Caddyfile
```

БД `storyos_v2` при откате **не удаляется** автоматически — данные сохраняются.

---

## Known risks / TODO

### Схема без миграций
`schema.sql` применяется вручную. Нет Alembic / Flyway.
Любое изменение схемы требует ручного `ALTER TABLE` или пересоздания БД.
**TODO:** ввести Alembic в следующей крупной задаче по backend.

### Seed — только для разработки
`seed.sql` содержит тестовые данные с фиксированными UUID.
Запускать на production только однократно; повторный запуск идемпотентен (ON CONFLICT DO NOTHING).
Seed не нужен, если данные вводятся через write-эндпоинты (Task 14+).

### data_store.py — deprecated
Файл `data_store.py` остался в директории как reference, но **не импортируется ни одним модулем**.
Будет удалён в cleanup-задаче после стабилизации write-API.

### Write-эндпоинты отсутствуют
v0.1.0 — read-only API. Любые изменения данных — только через прямой psql.
Write-эндпоинты (POST/PATCH) — Task 14.

### Health не проверяет БД
`GET /api/v2/health` возвращает `{"status":"ok"}` даже при недоступной БД.
Первый запрос к данным вернёт 500. Улучшить в Task 14 или отдельным хот-фиксом.
