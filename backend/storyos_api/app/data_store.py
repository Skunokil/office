from datetime import date

from app.models import Entity, Event, NarrativeUnit, Project, Relation


PROJECT = Project(
    title="Story OS",
    description="Система анализа и конструирования сюжетных структур",
    language="ru",
    createdAt=date(2026, 1, 10),
)

ENTITIES = [
    Entity(
        id="char_001",
        type="character",
        name="Следователь Марков",
        summary="Главный расследующий персонаж",
        tags=["протагонист"],
        status="active",
    ),
    Entity(
        id="char_002",
        type="character",
        name="Анна Левина",
        summary="Ключевой свидетель",
        tags=["свидетель"],
        status="active",
    ),
    Entity(
        id="loc_001",
        type="location",
        name="Старая усадьба",
        summary="Основная локация расследования",
        tags=["ключевая", "усадьба"],
        status="active",
    ),
    Entity(
        id="obj_001",
        type="clue",
        name="Сломанные часы",
        summary="Улика, связанная со временем преступления",
        tags=["улика"],
        status="confirmed",
    ),
]

EVENTS = [
    Event(
        id="event_001",
        type="event",
        name="Обнаружено тело",
        summary="В усадьбе найдено тело владельца",
        tags=["ключевое", "преступление"],
        status="confirmed",
        storyTime=None,
        narrativeOrder=1,
        locationId="loc_001",
        characterIds=["char_001"],
    ),
    Event(
        id="event_002",
        type="event",
        name="Первый допрос свидетеля",
        summary="Следователь опрашивает Анну Левину",
        tags=["допрос"],
        status="confirmed",
        storyTime=None,
        narrativeOrder=2,
        locationId="loc_001",
        characterIds=["char_001", "char_002"],
    ),
    Event(
        id="event_003",
        type="event",
        name="Найдена улика",
        summary="Обнаружены сломанные часы",
        tags=["улика"],
        status="confirmed",
        storyTime=None,
        narrativeOrder=3,
        locationId="loc_001",
        characterIds=["char_001"],
    ),
]

NARRATIVE_UNITS = [
    NarrativeUnit(
        id="nu_001",
        type="chapter",
        title="Глава 1. Ночь в усадьбе",
        chapter=1,
        pov="char_001",
        summary="Завязка истории и обнаружение преступления",
        linkedEventIds=["event_001"],
        narrativeOrder=1,
        tags=["открытие"],
        status="draft",
    ),
    NarrativeUnit(
        id="nu_002",
        type="chapter",
        title="Глава 2. Свидетель",
        chapter=2,
        pov="char_001",
        summary="Первый допрос и появление противоречий",
        linkedEventIds=["event_002"],
        narrativeOrder=2,
        tags=["допрос"],
        status="draft",
    ),
    NarrativeUnit(
        id="nu_003",
        type="chapter",
        title="Глава 3. Улика",
        chapter=3,
        pov="char_001",
        summary="Обнаружение часов и новый поворот расследования",
        linkedEventIds=["event_003"],
        narrativeOrder=3,
        tags=["улика"],
        status="draft",
    ),
]

RELATIONS = [
    Relation(
        id="rel_001",
        type="interviews",
        fromId="char_001",
        toId="char_002",
        label="Следователь допрашивает свидетеля",
    ),
    Relation(
        id="rel_002",
        type="happens_in",
        fromId="event_001",
        toId="loc_001",
        label="Событие происходит в усадьбе",
    ),
    Relation(
        id="rel_003",
        type="evidence_for",
        fromId="obj_001",
        toId="event_003",
        label="Часы выступают уликой",
    ),
]


def get_project() -> Project:
    return PROJECT


def get_entities() -> list[Entity]:
    return ENTITIES


def get_entity_by_id(entity_id: str) -> Entity | None:
    for entity in ENTITIES:
        if entity.id == entity_id:
            return entity
    return None


def get_events() -> list[Event]:
    return EVENTS


def get_event_by_id(event_id: str) -> Event | None:
    for event in EVENTS:
        if event.id == event_id:
            return event
    return None


def get_narrative_units() -> list[NarrativeUnit]:
    return NARRATIVE_UNITS


def get_narrative_unit_by_id(unit_id: str) -> NarrativeUnit | None:
    for unit in NARRATIVE_UNITS:
        if unit.id == unit_id:
            return unit
    return None


def get_relations() -> list[Relation]:
    return RELATIONS