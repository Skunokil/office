# Story OS API Contract (Read-only, v1)

Статус: draft v1 (MVP read-only)  
Режимы клиента: `?data=mock` и `?data=api` должны отдавать **эквивалентную по структуре** модель.  

## Общие принципы

- Все сущности имеют `id`, `type`, базовые текстовые поля (`name` или `title`, `summary`).
- Backend отдаёт данные **сразу в canonical формате**, без необходимости толстого мэппинга на фронте.
- Новые поля можно добавлять, не ломая клиента, пока не меняется смысл существующих полей.
- Enum‑значения и имена полей менять **нельзя** без миграции.

---

## Типы сущностей (canonical ontology)

Верхнеуровневые типы (поле `type`):

- `character`
- `location`
- `event`
- `clue`
- `worldRule`
- `chapter` (narrative unit)
- `category` (виртуальные сущности-агрегаты)
- `relation` (отдельный объект, см. ниже)

### Общие поля Entity-like объектов

```json
{
  "id": "char1",
  "type": "character",
  "name": "Имя",
  "summary": "Короткое описание",
  "tags": ["tag1", "tag2"],
  "status": "active"
}
```

#### Поля

- `id` (string, required) — устойчивый идентификатор.
- `type` (string, required) — см. список типов выше.
- `name` (string, required) — имя/название сущности.
- `summary` (string, required) — короткое описание.
- `tags` (string[], required, может быть `[]`) — список тегов.
- `status` (string, required) — статус в пределах своей категории.

##### Enum: status (для entity-like)

Рекомендуемый набор:

- `active`
- `inactive`
- `draft`
- `confirmed`
- `unverified`
- `n/a` (для категорий и агрегатов)

---

## Event

```json
{
  "id": "ev1",
  "type": "event",
  "name": "Название события",
  "summary": "Описание события",
  "tags": [],
  "status": "confirmed",
  "storyTime": "1923-02-14T02:30",
  "narrativeOrder": 2,
  "locationId": "loc1",
  "characterIds": ["char1", "char3"]
}
```

#### Поля

- Наследует все поля Entity-like: `id`, `type`, `name`, `summary`, `tags`, `status`.
- `storyTime` (string, optional) — in‑world время события, ISO-8601 строка без таймзоны.
- `narrativeOrder` (number, optional) — позиция события в нарративном порядке.
- `locationId` (string, optional) — `id` локации.
- `characterIds` (string[], optional) — список `id` персонажей, связанных с событием.

#### Enum: status (event)

- `confirmed`
- `unverified`
- `hypothesis` (резерв на будущее)
- `rejected` (резерв на будущее)

---

## Narrative Unit (Chapter)

```json
{
  "id": "ch1",
  "type": "chapter",
  "title": "Глава 1",
  "chapter": 1,
  "pov": "char4",
  "summary": "Краткое описание",
  "linkedEventIds": ["ev1", "ev4"],
  "narrativeOrder": 1,
  "tags": ["intro"],
  "status": "draft"
}
```

#### Поля

- `id` (string, required)
- `type` = `"chapter"` (required)
- `title` (string, required) — заголовок главы/юнита.
- `chapter` (number, optional) — номер главы.
- `pov` (string, optional) — `id` сущности‑персонажа от чьего лица глава.
- `summary` (string, required) — краткое содержание.
- `linkedEventIds` (string[], required, может быть `[]`) — `id` событий, привязанных к юниту.
- `narrativeOrder` (number, optional) — порядок юнита в нарративе.
- `tags` (string[], required) — теги.
- `status` (string, required) — `draft` | `outline` | `final` | `archived`.

---

## Relation

```json
{
  "id": "rel1",
  "type": "investigates",
  "fromId": "char4",
  "toId": "char1",
  "label": "расследует"
}
```

#### Поля

- `id` (string, required)
- `type` (string, required) — тип связи.
- `fromId` (string, required) — источник связи (`id` сущности или события).
- `toId` (string, required) — цель связи.
- `label` (string, required) — человекочитаемое описание.

#### Enum: relation.type

Базовый набор из mock:

- `employer-employee`
- `client-attorney`
- `investigates`
- `witness`
- `last-seen`

Расширение списка допускается без изменения смысла существующих типов.

---

## Project

```json
{
  "title": "Детективный роман",
  "description": "История...",
  "language": "ru",
  "createdAt": "2026-01-10"
}
```

#### Поля

- `title` (string, required)
- `description` (string, required)
- `language` (string, required) — ISO language code (например, `"ru"`).
- `createdAt` (string, required) — дата создания проекта (`YYYY-MM-DD`).

---

## Category (виртуальные агрегаты)

```json
{
  "id": "char-all",
  "type": "category",
  "name": "Персонажи (12)",
  "summary": "12 персонажей: главные, второстепенные, упомянутые.",
  "tags": ["категория"],
  "status": "n/a"
}
```

Используются во фронте как псевдо‑сущности для обзоров. Могут быть сгенерированы backend или фронтом.

---

## Endpoints

### `GET /api/health`

Проверка живости.

- Response `200`:

```json
{
  "status": "ok",
  "service": "storyos",
  "version": "1.0.0"
}
```

---

### `GET /api/project`

- Response `200` — объект `Project`:

```json
{
  "title": "Детективный роман",
  "description": "История об убийстве в особняке Вороновых и исчезновении архивных документов.",
  "language": "ru",
  "createdAt": "2026-01-10"
}
```

---

### `GET /api/entities`

Отдаёт Entity-like объекты всех типов, кроме `event`, `chapter`, `relation`.

- Response `200` — массив:

```json
[
  {
    "id": "char1",
    "type": "character",
    "name": "Алексей Воронов",
    "summary": "Хозяин особняка...",
    "tags": ["главный", "подозреваемый", "аристократия"],
    "status": "active"
  },
  {
    "id": "loc1",
    "type": "location",
    "name": "Особняк Вороновых",
    "summary": "Трёхэтажный особняк...",
    "tags": ["ключевая", "закрытое пространство"],
    "status": "active"
  }
]
```

---

### `GET /api/entities/{id}`

- Path param: `id` (string)
- Response `200` — один entity-like объект в canonical формате (см. выше).

---

### `GET /api/events`

- Response `200` — массив `Event`:

```json
[
  {
    "id": "ev1",
    "type": "event",
    "name": "Убийство в особняке",
    "summary": "Ночь 14 февраля...",
    "tags": ["ключевое", "преступление"],
    "status": "confirmed",
    "storyTime": "1923-02-14T02:30",
    "narrativeOrder": 2,
    "locationId": "loc1",
    "characterIds": ["char1", "char3", "char4"]
  }
]
```

---

### `GET /api/events/{id}`

- Path param: `id` (string)
- Response `200` — один `Event`.

---

### `GET /api/narrative-units`

- Response `200` — массив `NarrativeUnit`:

```json
[
  {
    "id": "ch1",
    "type": "chapter",
    "title": "Глава 1",
    "chapter": 1,
    "pov": "char4",
    "summary": "Следователь Громов прибывает...",
    "linkedEventIds": ["ev1", "ev4"],
    "narrativeOrder": 1,
    "tags": ["открытие", "место преступления"],
    "status": "draft"
  }
]
```

---

### `GET /api/narrative-units/{id}`

- Path param: `id` (string)
- Response `200` — один `NarrativeUnit`.

---

### `GET /api/relations`

- Response `200` — массив `Relation`:

```json
[
  {
    "id": "rel3",
    "type": "investigates",
    "fromId": "char4",
    "toId": "char1",
    "label": "Следователь → Подозреваемый"
  }
]
```

---

## Compatibility rules

1. Новые поля можно добавлять, если:
   - они не меняют смысл существующих полей;
   - не ломают JSON‑структуру (типы полей прежние).

2. Имена существующих полей (`id`, `type`, `name`, `summary`, `storyTime`, `narrativeOrder`, `linkedEventIds`, `fromId`, `toId`) **нельзя менять без миграционного слоя**.

3. Enum‑значения типов (`type` у сущностей, `relation.type`) добавлять можно, но уже существующие значения запрещено переиспользовать с другим смыслом.

4. Если меняется смысл поля (например, `narrativeOrder` начинает означать что-то другое) — это считается **breaking change** и требует:
   - либо нового поля с другим именем;
   - либо новой версии API / миграции клиента.

5. Backend обязан отдавать данные, которые клиент может визуализировать **без толстого слоя преобразований**: provider может добавлять только мелкие derived‑поля или фильтрацию, но не переписывать модель.  