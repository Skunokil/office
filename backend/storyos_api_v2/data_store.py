# DEPRECATED (since storyos-v2-backend-v0.1.0):
# This module contains in-memory mock data for the early Story OS v2 skeleton.
# Runtime now uses PostgreSQL via db.py + repository.py.
# This file is kept only for reference and will be removed in a future cleanup task.

"""
Mock data for Story OS v2 — based on "Тайна голубой вазы" (Agatha Christie).

Minimal but structurally complete: covers all 4 layers (canonical, text, epistemic, diagnostic).
Demonstrates real cross-layer references: work → chapter → episode → event → entity.
"""

from datetime import datetime
from .models import (
    Work, WorkStatus,
    Chapter, ChapterStatus,
    Episode, EpisodeFunction, ImportanceTier,
    Event, EventStatus,
    Entity, EntityType, EntityStatus,
    WorldRule, WorldRuleType, WorldRuleState, SpeakerRole, ManipulationUse,
    Manuscript, TextBlock, TextBlockFormat,
    EpistemicTrack, EpistemicTrackStatus,
    EpistemicStep, EpistemicStatus,
    EvidenceRole, EvidenceRoleType, EvidenceRoleStatus, EvidenceRoleState,
    Issue, IssueType, IssueSeverity, IssueStatus,
)

WORK_ID = "work-ak-blue-vase"
MANUSCRIPT_ID = "ms-ak-blue-vase"
NOW = datetime(2026, 4, 17, 12, 0, 0)


# ============================================================
# CANONICAL — Works
# ============================================================

WORKS: dict[str, Work] = {
    WORK_ID: Work(
        id=WORK_ID,
        title="Тайна голубой вазы",
        author="Агата Кристи",
        language="ru",
        genre="detective",
        status=WorkStatus.complete,
        created_at=NOW,
        updated_at=NOW,
    )
}


# ============================================================
# CANONICAL — Chapters (no Parts — short story)
# ============================================================

CHAPTERS: dict[str, Chapter] = {
    "ch-01": Chapter(
        id="ch-01", work_id=WORK_ID,
        title="Глава 1 — Первый крик и знакомство",
        ordinal=1, pov_entity_id="C-01",
        summary="Джек слышит крик, бежит к коттеджу, знакомится с Фелис.",
        status=ChapterStatus.final,
    ),
    "ch-03": Chapter(
        id="ch-03", work_id=WORK_ID,
        title="Глава 3 — Эксперимент с доктором",
        ordinal=3, pov_entity_id="C-01",
        summary="Левингтон проводит эксперимент. Только Джек слышит крик.",
        status=ChapterStatus.final,
    ),
    "ch-09": Chapter(
        id="ch-09", work_id=WORK_ID,
        title="Глава 9 — Письмо и развязка",
        ordinal=9, pov_entity_id="C-01",
        summary="Джек читает письмо Левингтона с признанием аферы.",
        status=ChapterStatus.final,
    ),
}


# ============================================================
# CANONICAL — Episodes
# ============================================================

EPISODES: dict[str, Episode] = {
    "ep-01": Episode(
        id="ep-01", work_id=WORK_ID, chapter_id="ch-01",
        label="Первый крик и знакомство с коттеджем",
        summary="Джек слышит женский крик, бежит к Хитер Коттеджу, не находит следов.",
        function=EpisodeFunction.exposition,
        importance_tier=ImportanceTier.anchor,
        ordinal=1,
    ),
    "ep-03": Episode(
        id="ep-03", work_id=WORK_ID, chapter_id="ch-03",
        label="Эксперимент с доктором",
        summary="При Левингтоне крик слышит только Джек. Разговор о психике и медиумизме.",
        function=EpisodeFunction.false_lead,
        importance_tier=ImportanceTier.anchor,
        ordinal=3,
    ),
    "ep-09": Episode(
        id="ep-09", work_id=WORK_ID, chapter_id="ch-09",
        label="Письмо и развязка аферы",
        summary="Письмо Левингтона с признанием аферы и побега с вазой.",
        function=EpisodeFunction.resolution,
        importance_tier=ImportanceTier.anchor,
        ordinal=9,
    ),
}


# ============================================================
# CANONICAL — Events
# ============================================================

EVENTS: dict[str, Event] = {
    "ev-01": Event(
        id="ev-01", work_id=WORK_ID,
        name="Первый крик и пустой коттедж",
        summary="Джек слышит женский крик, бежит к Хитер Коттеджу, не находит следов.",
        story_time="1923-06-01T07:25",
        episode_id="ep-01",
        location_id="L-01",
        status=EventStatus.confirmed,
    ),
    "ev-03": Event(
        id="ev-03", work_id=WORK_ID,
        name="Эксперимент с доктором",
        summary="При Левингтоне крик слышит только Джек, следует разговор о психике.",
        story_time="1923-06-03T07:25",
        episode_id="ep-03",
        location_id="L-01",
        status=EventStatus.confirmed,
    ),
    "ev-09": Event(
        id="ev-09", work_id=WORK_ID,
        name="Чтение письма Левингтона",
        summary="Джек читает письмо, где Левингтон признаётся в афере и побеге с вазой.",
        story_time="1923-06-09T10:00",
        episode_id="ep-09",
        location_id="L-03",
        status=EventStatus.confirmed,
    ),
}


# ============================================================
# CANONICAL — Entities (characters, artifacts, locations)
# ============================================================

ENTITIES: dict[str, Entity] = {
    "C-01": Entity(
        id="C-01", work_id=WORK_ID,
        type=EntityType.character, name="Джек Харингтон",
        summary="Главный герой, молодой служащий, жертва тщательно организованной манипуляции.",
        tags=["главный", "жертва"],
        status=EntityStatus.active,
        importance_tier=ImportanceTier.anchor,
        extra={"роль": "главный герой", "мотивация": "избавиться от страха безумия"},
    ),
    "C-02": Entity(
        id="C-02", work_id=WORK_ID,
        type=EntityType.character, name="Эмброуз Левингтон",
        summary="Мошенник, маскирующийся под учёного-психолога. Организатор аферы с вазой.",
        tags=["антагонист", "мошенник"],
        status=EntityStatus.active,
        importance_tier=ImportanceTier.anchor,
        extra={"роль": "мошенник", "маска": "врачеватель души"},
    ),
    "C-03": Entity(
        id="C-03", work_id=WORK_ID,
        type=EntityType.character, name="Фелис Маршо",
        summary="Соучастница аферы. Изображает медиума с мистическими снами.",
        tags=["соучастник"],
        status=EntityStatus.active,
        importance_tier=ImportanceTier.anchor,
        extra={"роль": "соучастница", "прикрытие": "медиум, видит сны о вазе"},
    ),
    "A-01": Entity(
        id="A-01", work_id=WORK_ID,
        type=EntityType.artifact, name="Голубая китайская ваза",
        summary="Уникальная ваза эпохи Мин, ~10 000 фунтов. Единственная реальная цель аферы.",
        tags=["ключевой артефакт", "цель хищения"],
        status=EntityStatus.active,
        importance_tier=ImportanceTier.anchor,
        extra={"эпоха": "Мин", "стоимость": "~10000 фунтов"},
    ),
    "A-03": Entity(
        id="A-03", work_id=WORK_ID,
        type=EntityType.artifact, name="Письмо Левингтона",
        summary="Единственный явный источник финального объяснения аферы.",
        tags=["финальная улика", "уязвимый источник"],
        status=EntityStatus.active,
        importance_tier=ImportanceTier.anchor,
        extra={"уязвимость": "нет независимой перекрёстной проверки"},
    ),
    "L-01": Entity(
        id="L-01", work_id=WORK_ID,
        type=EntityType.location, name="Поле для гольфа в Стортон Хит",
        summary="Основная сцена криков и экспериментов. Открытое пространство.",
        tags=["ключевая", "открытое пространство"],
        status=EntityStatus.active,
        importance_tier=ImportanceTier.anchor,
    ),
    "L-02": Entity(
        id="L-02", work_id=WORK_ID,
        type=EntityType.location, name="Хитер Коттедж",
        summary="Центр загадки. Возможное место старого преступления Тернеров.",
        tags=["ключевая", "закрытое пространство"],
        status=EntityStatus.active,
        importance_tier=ImportanceTier.anchor,
    ),
    "L-03": Entity(
        id="L-03", work_id=WORK_ID,
        type=EntityType.location, name="Отель в Стортон Хит",
        summary="База Джека. Место развязки: получение письма и встреча с дядей.",
        tags=["поддерживающая"],
        status=EntityStatus.active,
        importance_tier=ImportanceTier.supporting,
    ),
}


# ============================================================
# CANONICAL — WorldRules
# ============================================================

WORLD_RULES: dict[str, WorldRule] = {
    "WR-01": WorldRule(
        id="WR-01", work_id=WORK_ID,
        text="Сверхъестественного не существует, всё подчиняется естественным законам.",
        rule_type=WorldRuleType.epistemic,
        speaker_id="C-02",
        speaker_role=SpeakerRole.deceptive_expert,
        state=WorldRuleState.active,
        manipulation_use=ManipulationUse.legitimation,
    ),
    "WR-02": WorldRule(
        id="WR-02", work_id=WORK_ID,
        text="Психические явления реальны и однажды будут объяснены наукой.",
        rule_type=WorldRuleType.epistemic,
        speaker_id="C-02",
        speaker_role=SpeakerRole.deceptive_expert,
        state=WorldRuleState.active,
        manipulation_use=ManipulationUse.legitimation,
    ),
}


# ============================================================
# TEXT LAYER — Manuscript + TextBlocks
# ============================================================

MANUSCRIPTS: dict[str, dict] = {
    MANUSCRIPT_ID: {
        "manuscript": Manuscript(
            id=MANUSCRIPT_ID,
            work_id=WORK_ID,
            created_at=NOW,
            updated_at=NOW,
        ),
        "text_blocks": [
            TextBlock(
                id="tb-01",
                manuscript_id=MANUSCRIPT_ID,
                chapter_id="ch-01",
                ordinal=1,
                content=(
                    "Джек Харингтон играл в гольф на полях Стортон Хит, когда внезапно услышал "
                    "пронзительный женский крик: «Убивают… помогите!» Он немедленно бросил клюшку "
                    "и побежал на звук, но у Хитер Коттеджа увидел лишь молодую девушку с "
                    "фиалками в руках. Никаких следов преступления не было."
                ),
                format=TextBlockFormat.plain,
            ),
            TextBlock(
                id="tb-03",
                manuscript_id=MANUSCRIPT_ID,
                chapter_id="ch-03",
                ordinal=3,
                content=(
                    "Ровно в 7:25 крик раздался снова. Левингтон стоял рядом и не слышал ничего. "
                    "«Дорогой мой Харингтон,» — сказал он задумчиво, — «вы не сумасшедший. "
                    "Возможно, вы — медиум, способный воспринимать то, что другим недоступно.»"
                ),
                format=TextBlockFormat.plain,
            ),
            TextBlock(
                id="tb-09",
                manuscript_id=MANUSCRIPT_ID,
                chapter_id="ch-09",
                ordinal=9,
                content=(
                    "Служащая протянула конверт. Джек вскрыл его и прочёл: «Дорогой Харингтон, "
                    "вы стали жертвой тщательно продуманного обмана по последнему слову науки. "
                    "Ваша голубая ваза уже далеко. Приношу свои извинения. — Левингтон»."
                ),
                format=TextBlockFormat.plain,
            ),
        ],
    }
}


# ============================================================
# EPISTEMIC LAYER — Tracks + Steps
# ============================================================

# Structure: track_id → {"track": EpistemicTrack, "steps": list[EpistemicStep]}
EPISTEMIC_TRACKS: dict[str, dict] = {
    "ET-01": {
        "track": EpistemicTrack(
            id="ET-01", work_id=WORK_ID,
            label="Происхождение крика",
            subject_id="C-01",
            object_label="источник и природа крика в 7:25",
            status=EpistemicTrackStatus.closed,
        ),
        "steps": [
            EpistemicStep(
                id="es-01-1", track_id="ET-01", step_ordinal=1,
                episode_id="ep-01", event_id="ev-01",
                version="Реальное нападение или убийство рядом с коттеджем.",
                epistemic_status=EpistemicStatus.believed,
            ),
            EpistemicStep(
                id="es-01-6", track_id="ET-01", step_ordinal=6,
                episode_id="ep-03", event_id="ev-03",
                version="Либо я сумасшедший, либо медиум — слышу то, что другим недоступно.",
                epistemic_status=EpistemicStatus.believed,
            ),
            EpistemicStep(
                id="es-01-10", track_id="ET-01", step_ordinal=10,
                episode_id="ep-09", event_id="ev-09",
                version="Крики были частью тщательно организованной аферы.",
                epistemic_status=EpistemicStatus.confirmed,
            ),
        ],
    },
    "ET-02": {
        "track": EpistemicTrack(
            id="ET-02", work_id=WORK_ID,
            label="Роль голубой вазы",
            subject_id="C-01",
            object_label="значение и роль голубой вазы в истории",
            object_entity_id="A-01",
            status=EpistemicTrackStatus.closed,
        ),
        "steps": [
            EpistemicStep(
                id="es-02-1", track_id="ET-02", step_ordinal=1,
                episode_id="ep-03",
                version="Голубая ваза — важный образ в снах Фелис, возможный ключ к загадке.",
                epistemic_status=EpistemicStatus.suspected,
            ),
            EpistemicStep(
                id="es-02-4", track_id="ET-02", step_ordinal=4,
                episode_id="ep-09", event_id="ev-09",
                version="Ваза была единственной реальной целью аферы.",
                epistemic_status=EpistemicStatus.confirmed,
            ),
        ],
    },
}


# ============================================================
# EPISTEMIC LAYER — EvidenceRoles
# ============================================================

EVIDENCE_ROLES: dict[str, EvidenceRole] = {
    "er-01": EvidenceRole(
        id="er-01", work_id=WORK_ID,
        track_id="ET-02",
        entity_id="A-01",
        entity_type=EntityType.artifact,
        role_type=EvidenceRoleType.evidence,
        epistemic_status=EvidenceRoleStatus.verified,
        note="Ваза прошла путь: неизвестный объект → мистический символ → подтверждённая цель аферы.",
        state_history=[
            EvidenceRoleState(
                id="ers-01-1", evidence_role_id="er-01", episode_id="ep-01",
                previous_status=None,
                new_status=EvidenceRoleStatus.hidden,
                comment="До визита Фелис ваза неизвестна Джеку",
            ),
            EvidenceRoleState(
                id="ers-01-2", evidence_role_id="er-01", episode_id="ep-03",
                previous_status=EvidenceRoleStatus.hidden,
                new_status=EvidenceRoleStatus.found,
                comment="Образ вазы появляется через рисунок Фелис",
            ),
            EvidenceRoleState(
                id="ers-01-3", evidence_role_id="er-01", episode_id="ep-09",
                previous_status=EvidenceRoleStatus.found,
                new_status=EvidenceRoleStatus.verified,
                comment="Письмо подтверждает: ваза — единственная цель аферы",
            ),
        ],
    ),
    "er-02": EvidenceRole(
        id="er-02", work_id=WORK_ID,
        track_id="ET-01",
        entity_id="A-03",
        entity_type=EntityType.artifact,
        role_type=EvidenceRoleType.confirmation,
        epistemic_status=EvidenceRoleStatus.verified,
        note="Письмо Левингтона — финальное подтверждение версии аферы. Уязвимость: нет перекрёстной проверки.",
        state_history=[
            EvidenceRoleState(
                id="ers-02-1", evidence_role_id="er-02", episode_id="ep-09",
                previous_status=None,
                new_status=EvidenceRoleStatus.verified,
                comment="Письмо передано Джеку и прочитано",
            ),
        ],
    ),
}


# ============================================================
# DIAGNOSTIC LAYER — Issues
# ============================================================

ISSUES: dict[str, Issue] = {
    "iss-01": Issue(
        id="iss-01", work_id=WORK_ID,
        label="Зависимость развязки от одного письма",
        issue_type=IssueType.structural_gap,
        severity=IssueSeverity.warning,
        description=(
            "Почти вся перенастройка знания Джека опирается на один документ без "
            "независимой перекрёстной проверки. Теоретически письмо само могло быть частью обмана."
        ),
        status=IssueStatus.open,
        related_evidence_role_ids=["er-02"],
        related_episode_ids=["ep-09"],
    ),
    "iss-02": Issue(
        id="iss-02", work_id=WORK_ID,
        label="Неотличимость честных и манипулятивных правил мира",
        issue_type=IssueType.schema_gap,
        severity=IssueSeverity.note,
        description=(
            "На уровне текста «научный» дискурс Левингтона не маркирован как мошеннический "
            "до самой развязки. Хороший кейс для анализа: «отделять содержание от риторики»."
        ),
        status=IssueStatus.open,
        related_world_rule_ids=["WR-01", "WR-02"],
    ),
}
