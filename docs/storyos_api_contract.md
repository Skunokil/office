# Story OS API Contract (Read-only, v1)

> Note (2026-04-22): This document describes the **v1** Story OS API contract.
> The **v2** backend lives in `backend/storyos_api_v2/` and uses a different ontology and URL space (`/api/v2/...`).
> This file is preserved as a reference for migration and comparison, not as the source of truth for v2.
> For v2 documentation see `backend/storyos_api_v2/README.md`.

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

-----

### `POST /api/source-review/extract`

Возвращает кандидатов для source-review на основе входного текстового фрагмента.

> **Важно:** в v1 backend реализует **ровно тот же алгоритм**, который сейчас живёт во фронтовой функции `extractCandidatesFromText`.
> На этом шаге сервер **может игнорировать содержимое** поля `text` и возвращать полный набор кандидатов из текущего графа.

#### Request

- Body `application/json`:

```json
{
  "text": "Фрагмент исходного текста"
}
```

#### Поля request body

- `text` (string, required) — текстовый фрагмент источника, отправленный из source-review UI.

#### Response `200`

```json
{
  "characters": [
    {
      "id": "cand_char1_001",
      "group": "characters",
      "entityId": "char1",
      "status": "new",
      "sourceFragmentId": null,
      "entity": {
        "id": "char1",
        "type": "character",
        "name": "Алексей Воронов",
        "summary": "Хозяин особняка...",
        "tags": ["главный", "подозреваемый"],
        "status": "active"
      }
    }
  ],
  "events": [
    {
      "id": "cand_ev1_001",
      "group": "events",
      "entityId": "ev1",
      "status": "new",
      "sourceFragmentId": null,
      "entity": {
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
    }
  ],
  "locations": [
    {
      "id": "cand_loc1_001",
      "group": "locations",
      "entityId": "loc1",
      "status": "new",
      "sourceFragmentId": null,
      "entity": {
        "id": "loc1",
        "type": "location",
        "name": "Особняк Вороновых",
        "summary": "Трёхэтажный особняк...",
        "tags": ["ключевая", "закрытое пространство"],
        "status": "active"
      }
    }
  ],
  "clues": [
    {
      "id": "cand_clue1_001",
      "group": "clues",
      "entityId": "clue1",
      "status": "new",
      "sourceFragmentId": null,
      "entity": {
        "id": "clue1",
        "type": "clue",
        "name": "Окровавленная перчатка",
        "summary": "Найдена рядом с лестницей...",
        "tags": ["улика"],
        "status": "unverified"
      }
    }
  ]
}
```
#### Frontend integration notes (Task 7C)

На уровне UI и frontend-state review-layer интегрирован как отдельный слой поверх canonical model.

##### Current frontend behavior

- `extractionResults` хранит исходные данные source-review отдельно от canonical сущностей (`entities`, `events`, `relations`, `narrativeUnits`).
- `reviewSignalsByEntityId` является derived-state структурой, вычисляемой из `extractionResults`.
- `reviewSignalsByEntityId` агрегирует review-сигналы по canonical `entityId` и используется для UI панели деталей сущности.
- В панели “Детали сущности” review-сигналы отображаются отдельным блоком review-состояния для типов:
  - `character`
  - `event`
  - `location`
  - `clue`
- Review-сигналы не изменяют canonical entity автоматически.
- `candidate.status = confirmed | rejected` относится только к review-layer и не означает автоматическое изменение `entity.status`.

##### Derived-state shape

Пример структуры `reviewSignalsByEntityId`:

```json
{
  "char1": {
    "total": 3,
    "new": 2,
    "confirmed": 1,
    "rejected": 0,
    "candidates": [
      {
        "id": "cand_char1_001",
        "group": "characters",
        "entityId": "char1",
        "status": "new",
        "sourceFragmentId": null,
        "entity": { "...": "canonical entity" }
      }
    ]
  }
}
```

##### UI behavior

- source-review actions (`confirm`, `reject`, `remove`) обновляют frontend state, а затем вызывают повторный render.
- Панель деталей сущности читает только aggregated review-signals, а не обходит extraction response напрямую.
- Если у сущности нет связанных review-candidates, review-block не отображается.

##### Temporary compatibility layer

На текущем шаге frontend поддерживает временную backward compatibility для extraction response.

Если backend возвращает candidate object старого формата:

```json
{
  "entity": { "...": "canonical-like object" },
  "status": "new"
}
```

frontend временно нормализует legacy response к контрактной форме `ReviewCandidate`, используя:
- `entity.id` как временный fallback для `entityId`;
- synthetic `id`, если `candidate.id` ещё не передан backend;
- `group`, выведенный из response group (`characters`, `events`, `locations`, `clues`).

Эта нормализация является временным слоем совместимости и не должна считаться целевым контрактом API.

##### Canonical ID scheme (Task 7D, 2026-04-17)

**Backend и frontend используют одну canonical схему ID.** Временный name-based mapping adapter удалён.

Canonical формат:
- персонажи: `char1`, `char2`, `char3`, `char4`
- локации: `loc1`, `loc2`, `loc3`
- улики: `clue1`, `clue2`, `clue3`
- мировые правила: `rule1`, `rule2`
- события: `ev1`, `ev2`, `ev3`, `ev4`, `ev5`
- главы: `ch1`, `ch2`, `ch3`
- отношения: `rel1`, `rel2`, `rel3`, `rel4`, `rel5`

Правило: backend **обязан** отдавать те же IDs, что используются во frontend mock-данных. Любые compatibility adapters для перекодирования IDs считаются техдолгом и должны быть устранены немедленно.

Backend возвращает `candidate.id` (формат `cand_<entityId>`) и явный `entityId` в каждом `SourceReviewCandidate`. Frontend нормализует через `normalizeCandidates` без перекодирования.


#### Структура response

Response — объект из четырёх фиксированных групп:

- `characters` — массив `ReviewCandidate`, где `group = "characters"` и `entity.type = "character"`.
- `events` — массив `ReviewCandidate`, где `group = "events"` и `entity.type = "event"`.
- `locations` — массив `ReviewCandidate`, где `group = "locations"` и `entity.type = "location"`.
- `clues` — массив `ReviewCandidate`, где `group = "clues"` и `entity.type = "clue"`.

Каждый элемент массива — полный `ReviewCandidate` (см. раздел выше).

#### Поля candidate object

- `id` (string, required) — уникальный идентификатор кандидата в рамках review-layer.
- `group` (string, required) — одна из групп: `"characters" | "events" | "locations" | "clues"`.
- `entityId` (string, required) — `id` связанной canonical сущности; в целевом контракте должен совпадать с `entity.id`.
- `status` (string, required) — статус кандидата в source-review:
  - `new`
  - `confirmed`
  - `rejected`
- `sourceFragmentId` (string | null, optional) — идентификатор исходного текстового фрагмента; в v1 может быть `null`.
- `entity` (required) — canonical объект из текущего API-контракта:
  - для `characters` / `locations` / `clues` — Entity-like объект
  - для `events` — объект `Event`

##### Enum: candidate.status

- `new`
- `confirmed`
- `rejected`

> Для **v1** backend:
> - всегда возвращает `status = "new"` для всех кандидатов;
> - может генерировать `id` в формате `cand_<entityId>_<seq>` или аналогичном;
> - может оставлять `sourceFragmentId = null`, если fragment storage ещё не реализован.

#### Алгоритм v1

В v1 backend реализует тот же алгоритм, что сейчас используется во фронте в `extractCandidatesFromText`:

- `characters` = все `entities`, где `type === "character"`
- `locations` = все `entities`, где `type === "location"`
- `clues` = все `entities`, где `type === "clue"`
- `events` = все события

Поле `text` на этом шаге передаётся обязательно, но сервер может его **не использовать** при формировании результата.

#### Эволюция в v2+

В следующих версиях (`v2+`) endpoint может начать реально анализировать `text` и возвращать не полный граф, а отфильтрованный / ранжированный набор кандидатов.

При этом **структура ответа должна остаться прежней**:

- те же группы: `characters`, `events`, `locations`, `clues`
- тот же формат candidate object: полный `ReviewCandidate`

Это нужно, чтобы клиент мог перейти от mock/full-graph extraction к умной extraction без смены UI-контракта.

#### Mini compatibility rules

1. В объект кандидата можно добавлять новые поля без поломки клиента, например:
   - `score`
   - `sourceSpan`
   - `reasons`
   - `matchedText`

2. Формат групп `characters` / `events` / `locations` / `clues` менять нельзя без миграции клиента.

3. Поле `entity` должно оставаться canonical-объектом существующего контракта, без замены на отдельный “облегчённый” формат.

4. Поле `status` можно расширять новыми enum-значениями только если клиент готов их безопасно игнорировать или есть миграционный слой.

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