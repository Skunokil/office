# Story OS API v2

**Статус:** Task 10 — скелет на mock-данных  
**Расположение:** `backend/storyos_api_v2/`  
**Версия:** 0.1.0

---

## Структура проекта

```
storyos_api_v2/
├── main.py           # FastAPI-приложение, CORS, теги
├── models.py         # Pydantic-модели: canonical, text, epistemic, diagnostic layers
├── routes.py         # Read-only endpoints (7 шт.)
├── data_store.py     # Mock-данные в памяти (по мотивам "Тайны голубой вазы")
├── schema.sql        # Черновой Postgres DDL (Task 9)
├── requirements.txt  # fastapi, uvicorn, pydantic
└── README.md         # Этот файл
```

---

## Запуск локально

```bash
# Из корня проекта ~/projects/office/
cd ~/projects/office
pip install -r backend/storyos_api_v2/requirements.txt

uvicorn backend.storyos_api_v2.main:app --reload --port 8002
```

После запуска:
- **Swagger UI:** http://localhost:8002/docs
- **ReDoc:** http://localhost:8002/redoc
- **OpenAPI JSON:** http://localhost:8002/openapi.json

---

## Endpoints

| Метод | URL | Описание | Модель ответа |
|-------|-----|----------|---------------|
| GET | `/api/v2/health` | Healthcheck | `HealthResponse` |
| GET | `/api/v2/works` | Список произведений | `list[Work]` |
| GET | `/api/v2/works/{work_id}` | Произведение по ID | `Work` |
| GET | `/api/v2/works/{work_id}/structure` | Полная структура: work + chapters + episodes + events | `WorkStructure` |
| GET | `/api/v2/manuscripts/{manuscript_id}` | Рукопись с текстовыми блоками | `ManuscriptDetail` |
| GET | `/api/v2/epistemic-tracks?work_id=` | Треки знания с шагами | `list[EpistemicTrackDetail]` |
| GET | `/api/v2/issues?work_id=&status=` | Диагностические issues | `list[Issue]` |

---

## Примеры запросов

```bash
# Healthcheck
curl http://localhost:8002/api/v2/health

# Структура произведения
curl http://localhost:8002/api/v2/works/work-ak-blue-vase/structure

# Эпистемические треки
curl "http://localhost:8002/api/v2/epistemic-tracks?work_id=work-ak-blue-vase"

# Открытые issues
curl "http://localhost:8002/api/v2/issues?work_id=work-ak-blue-vase&status=open"

# Рукопись
curl http://localhost:8002/api/v2/manuscripts/ms-ak-blue-vase
```

---

## Mock-данные

Все данные основаны на рассказе Агаты Кристи «Тайна голубой вазы»:

- **1 Work** — "work-ak-blue-vase"
- **3 Chapter** — ch-01, ch-03, ch-09
- **3 Episode** — ep-01 (exposition), ep-03 (false_lead), ep-09 (resolution)
- **3 Event** — ev-01, ev-03, ev-09
- **8 Entity** — 3 character + 2 artifact + 3 location
- **2 WorldRule** — WR-01, WR-02 (manipulation_use=legitimation)
- **1 Manuscript** + **3 TextBlock**
- **2 EpistemicTrack** — ET-01 (происхождение крика), ET-02 (роль вазы)
- **2 EvidenceRole** — er-01 (ваза в ET-02), er-02 (письмо в ET-01)
- **2 Issue** — structural_gap + schema_gap

---

## Слои и модели (кратко)

| Слой | Модели |
|------|--------|
| Canonical | `Work`, `Part`, `Chapter`, `Episode`, `Event`, `Entity`, `Relation`, `WorldRule` |
| Text | `Manuscript`, `TextBlock`, `Annotation`, `Mention` |
| Epistemic | `EpistemicTrack`, `EpistemicStep`, `EvidenceRole`, `EvidenceRoleState` |
| Diagnostic | `Issue` |

---

## Следующие шаги (Task 11+)

1. **Подключить Postgres** по `schema.sql`:
   - добавить `asyncpg` / `sqlalchemy[asyncio]`
   - создать `db.py` с pool-подключением
   - заменить `data_store.*` на SQL-запросы

2. **Write endpoints** (POST/PATCH):
   - создание Work, добавление Entity, Episode
   - обновление EpistemicStep, Issue.status

3. **Annotations API**:
   - `POST /api/v2/text-blocks/{id}/annotations` — добавить span-разметку
   - стратегия пересчёта offsets при редактировании (Task 12)

4. **Запуск в Docker**:
   - добавить `storyos-api-v2` сервис в `~/bot_factory/docker-compose.yml`
   - маршрут в Caddyfile: `/api/v2/*` → storyos-api-v2:8002
