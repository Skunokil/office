# Story OS API v2

**Статус:** v0.1.0 — read-only API на PostgreSQL  
**Тег:** `storyos-v2-backend-v0.1.0` (коммит `724b348`)  
**Расположение:** `backend/storyos_api_v2/`

---

## Структура проекта

```
storyos_api_v2/
├── main.py           # FastAPI-приложение: CORS, lifespan, router
├── models.py         # Pydantic-модели: canonical, text, epistemic, diagnostic layers
├── db.py             # Async engine + SessionLocal + get_db() dependency
├── repository.py     # Все SQL-запросы (SQLAlchemy text() + result.mappings())
├── routes.py         # 8 read-only endpoints
├── schema.sql        # DDL для PostgreSQL (storyos_v2)
├── seed.sql          # Seed-данные по "Тайне голубой вазы" (фиксированные UUID)
├── data_store.py     # DEPRECATED — mock-данные, не используются в runtime
├── Dockerfile        # Production-like образ (uvicorn)
├── requirements.txt  # fastapi, uvicorn, pydantic, sqlalchemy[asyncio], asyncpg
└── README.md         # Этот файл
```

---

## Endpoints

| Метод | URL | Описание | Модель ответа |
|-------|-----|----------|---------------|
| GET | `/api/v2/health` | Healthcheck | `HealthResponse` |
| GET | `/api/v2/works` | Список произведений | `list[Work]` |
| GET | `/api/v2/works/{work_id}` | Произведение по ID | `Work` |
| GET | `/api/v2/works/{work_id}/structure` | Work + Chapters + Episodes + Events | `WorkStructure` |
| GET | `/api/v2/manuscripts/{manuscript_id}` | Рукопись с текстовыми блоками | `ManuscriptDetail` |
| GET | `/api/v2/manuscripts/{id}/annotations` | Аннотации рукописи (с вложенными Mention) | `list[Annotation]` |
| GET | `/api/v2/entities/{entity_id}/mentions` | Упоминания сущности в тексте | `list[Mention]` |
| GET | `/api/v2/epistemic-tracks` | Треки знания с шагами | `list[EpistemicTrackDetail]` |
| GET | `/api/v2/issues` | Диагностические issues | `list[Issue]` |

### Query-параметры

| Endpoint | Параметр | Описание |
|----------|----------|----------|
| `/annotations` | `entity_id` | Только аннотации с упоминанием этой сущности |
| `/annotations` | `annotation_type` | `mention \| structural \| note \| issue_marker` |
| `/mentions` | `work_id` | Ограничить одним произведением |
| `/epistemic-tracks` | `work_id` | Фильтр по произведению |
| `/issues` | `work_id` | Фильтр по произведению |
| `/issues` | `status` | `open \| resolved \| wont_fix` |

---

## Архитектура

```
HTTP Request
    │
    ▼
FastAPI routes.py
    │  Depends(get_db)
    ▼
db.py (AsyncSession)
    │  SQLAlchemy text() queries
    ▼
repository.py
    │  result.mappings() → Pydantic models
    ▼
PostgreSQL storyos_v2
```

- Все запросы — raw SQL через `text()`, без ORM-маппинга (explicit > implicit)
- UUID из БД приводятся к `str` через `_s()` helper
- Optional-фильтры строятся динамически: Python список conditions + params dict
- JOIN-агрегация в Python (dict grouping) вместо `json_agg` в SQL для nested objects

---

## DB Setup

Разовая инициализация (или после сброса):

```bash
PG_USER=$(cd ~/bot_factory && grep ^POSTGRES_USER .env | cut -d= -f2)

# 1. Создать БД
docker exec bot_factory-postgres-1 psql -U "$PG_USER" -d postgres \
  -c "CREATE DATABASE storyos_v2;"

# 2. Применить схему
docker exec -i bot_factory-postgres-1 psql -U "$PG_USER" -d storyos_v2 \
  < ~/projects/office/backend/storyos_api_v2/schema.sql

# 3. Загрузить seed (идемпотентно)
docker exec -i bot_factory-postgres-1 psql -U "$PG_USER" -d storyos_v2 \
  < ~/projects/office/backend/storyos_api_v2/seed.sql

# 4. Собрать и запустить
cd ~/bot_factory && docker compose up -d --build storyos-api-v2
```

---

## Запуск локально (без Docker)

```bash
cd ~/projects/office
pip install -r backend/storyos_api_v2/requirements.txt

DATABASE_URL="postgresql+asyncpg://user:pass@localhost/storyos_v2" \
  uvicorn backend.storyos_api_v2.main:app --reload --port 8002
```

После запуска:
- **Swagger UI:** http://localhost:8002/docs
- **ReDoc:** http://localhost:8002/redoc

---

## Примеры запросов

```bash
BASE="https://storyos.transformatornaya.ru"

WORK_ID="a0000000-0000-0000-0000-000000000001"
MS_ID="b0000000-0000-0000-0000-000000000001"
JACK_ID="c0000000-0000-0000-0000-000000000001"   # Джек Харингтон

# Healthcheck
curl -s "$BASE/api/v2/health"

# Структура произведения
curl -s "$BASE/api/v2/works/$WORK_ID/structure" | python3 -m json.tool

# Аннотации рукописи (все)
curl -s "$BASE/api/v2/manuscripts/$MS_ID/annotations" | python3 -m json.tool

# Аннотации только с упоминанием Джека
curl -s "$BASE/api/v2/manuscripts/$MS_ID/annotations?entity_id=$JACK_ID"

# Все упоминания Джека в тексте
curl -s "$BASE/api/v2/entities/$JACK_ID/mentions" | python3 -m json.tool

# Эпистемические треки
curl -s "$BASE/api/v2/epistemic-tracks?work_id=$WORK_ID" | python3 -m json.tool

# Открытые issues
curl -s "$BASE/api/v2/issues?work_id=$WORK_ID&status=open" | python3 -m json.tool
```

---

## Слои и модели

| Слой | Модели |
|------|--------|
| Canonical | `Work`, `Chapter`, `Episode`, `Event` |
| Text | `Manuscript`, `TextBlock`, `Annotation`, `Mention` |
| Epistemic | `EpistemicTrack`, `EpistemicStep` |
| Diagnostic | `Issue` |

---

## Known issues / Next steps

| # | Описание | Приоритет |
|---|----------|-----------|
| 1 | **Нет миграций**: `schema.sql` применяется вручную, Alembic не настроен | Высокий |
| 2 | **Write-эндпоинты отсутствуют**: v0.1.0 — read-only | Task 14 |
| 3 | **Health не проверяет БД**: `/health` всегда `ok`, даже при недоступной БД | Хот-фикс |
| 4 | **data_store.py deprecated**: файл лежит в директории, но не импортируется | Cleanup |
| 5 | **Pagination отсутствует**: все списки возвращаются целиком | Task 14+ |
| 6 | **Frontend v2 не готов**: `storyos.transformatornaya.ru/` — текстовая заглушка | Отдельная задача |
