"""
Async repository layer for Story OS v2.
All queries use SQLAlchemy Core text() against PostgreSQL.
UUIDs from the DB are cast to str on read.
"""
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from .models import (
    Work,
    Chapter,
    Episode,
    Event,
    Manuscript,
    TextBlock,
    Annotation,
    Mention,
    EpistemicTrack,
    EpistemicStep,
    EpistemicTrackDetail,
    Issue,
    ManuscriptDetail,
    WorkStructure,
)


# ── helpers ──────────────────────────────────────────────────

def _s(val) -> Optional[str]:
    """UUID or None → str or None."""
    return str(val) if val is not None else None


def _row_work(row) -> Work:
    return Work(
        id=_s(row["id"]),
        title=row["title"],
        author=row["author"],
        language=row["language"],
        genre=row["genre"],
        status=row["status"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _row_chapter(row) -> Chapter:
    return Chapter(
        id=_s(row["id"]),
        work_id=_s(row["work_id"]),
        part_id=_s(row["part_id"]),
        title=row["title"],
        ordinal=row["ordinal"],
        pov_entity_id=_s(row["pov_entity_id"]),
        summary=row["summary"],
        status=row["status"],
    )


def _row_episode(row) -> Episode:
    return Episode(
        id=_s(row["id"]),
        work_id=_s(row["work_id"]),
        chapter_id=_s(row["chapter_id"]),
        label=row["label"],
        summary=row["summary"],
        function=row["function"],
        importance_tier=row["importance_tier"],
        ordinal=row["ordinal"],
    )


def _row_event(row) -> Event:
    return Event(
        id=_s(row["id"]),
        work_id=_s(row["work_id"]),
        name=row["name"],
        summary=row["summary"],
        story_time=row["story_time"],
        episode_id=_s(row["episode_id"]),
        location_id=_s(row["location_id"]),
        status=row["status"],
    )


# ── works ─────────────────────────────────────────────────────

async def get_works(db: AsyncSession) -> list[Work]:
    result = await db.execute(text("SELECT * FROM works ORDER BY created_at"))
    return [_row_work(r) for r in result.mappings()]


async def get_work_by_id(db: AsyncSession, work_id: str) -> Optional[Work]:
    result = await db.execute(
        text("SELECT * FROM works WHERE id::text = :id"),
        {"id": work_id},
    )
    row = result.mappings().first()
    return _row_work(row) if row else None


async def get_work_structure(db: AsyncSession, work_id: str) -> Optional[WorkStructure]:
    work_row = (
        await db.execute(
            text("SELECT * FROM works WHERE id::text = :id"), {"id": work_id}
        )
    ).mappings().first()
    if not work_row:
        return None

    chapters = [
        _row_chapter(r)
        for r in (
            await db.execute(
                text("SELECT * FROM chapters WHERE work_id::text = :wid ORDER BY ordinal"),
                {"wid": work_id},
            )
        ).mappings()
    ]

    episodes = [
        _row_episode(r)
        for r in (
            await db.execute(
                text("SELECT * FROM episodes WHERE work_id::text = :wid ORDER BY ordinal"),
                {"wid": work_id},
            )
        ).mappings()
    ]

    events = [
        _row_event(r)
        for r in (
            await db.execute(
                text(
                    "SELECT * FROM events WHERE work_id::text = :wid"
                    " ORDER BY story_time NULLS LAST"
                ),
                {"wid": work_id},
            )
        ).mappings()
    ]

    return WorkStructure(
        work=_row_work(work_row),
        parts=[],
        chapters=chapters,
        episodes=episodes,
        events=events,
    )


# ── epistemic tracks ──────────────────────────────────────────

async def get_epistemic_tracks(
    db: AsyncSession,
    work_id: Optional[str] = None,
) -> list[EpistemicTrackDetail]:
    q = """
        SELECT
            t.id            AS t_id,
            t.work_id       AS t_work_id,
            t.label,
            t.subject_id,
            t.object_label,
            t.object_entity_id,
            t.status        AS t_status,
            s.id            AS s_id,
            s.step_ordinal,
            s.episode_id    AS s_episode_id,
            s.event_id      AS s_event_id,
            s.version,
            s.epistemic_status
        FROM epistemic_tracks t
        LEFT JOIN epistemic_steps s ON s.track_id = t.id
    """
    params: dict = {}
    if work_id:
        q += " WHERE t.work_id::text = :work_id"
        params["work_id"] = work_id
    q += " ORDER BY t.id, s.step_ordinal"

    rows = (await db.execute(text(q), params)).mappings().all()

    tracks: dict[str, dict] = {}
    for row in rows:
        tid = _s(row["t_id"])
        if tid not in tracks:
            tracks[tid] = {
                "id": tid,
                "work_id": _s(row["t_work_id"]),
                "label": row["label"],
                "subject_id": _s(row["subject_id"]),
                "object_label": row["object_label"],
                "object_entity_id": _s(row["object_entity_id"]),
                "status": row["t_status"],
                "steps": [],
            }
        if row["s_id"] is not None:
            tracks[tid]["steps"].append(
                EpistemicStep(
                    id=_s(row["s_id"]),
                    track_id=tid,
                    step_ordinal=row["step_ordinal"],
                    episode_id=_s(row["s_episode_id"]),
                    event_id=_s(row["s_event_id"]),
                    version=row["version"],
                    epistemic_status=row["epistemic_status"],
                )
            )

    return [EpistemicTrackDetail(**data) for data in tracks.values()]


# ── issues ────────────────────────────────────────────────────

async def get_issues(
    db: AsyncSession,
    work_id: Optional[str] = None,
    status: Optional[str] = None,
) -> list[Issue]:
    conditions: list[str] = []
    params: dict = {}
    if work_id:
        conditions.append("i.work_id::text = :work_id")
        params["work_id"] = work_id
    if status:
        conditions.append("i.status = :status")
        params["status"] = status

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    q = f"""
        SELECT
            i.id, i.work_id, i.label, i.issue_type, i.severity,
            i.description, i.status,
            COALESCE(
                ARRAY_AGG(DISTINCT ie.entity_id::text)
                    FILTER (WHERE ie.entity_id IS NOT NULL), '{{}}'
            ) AS entity_ids,
            COALESCE(
                ARRAY_AGG(DISTINCT iep.episode_id::text)
                    FILTER (WHERE iep.episode_id IS NOT NULL), '{{}}'
            ) AS episode_ids,
            COALESCE(
                ARRAY_AGG(DISTINCT iwr.world_rule_id::text)
                    FILTER (WHERE iwr.world_rule_id IS NOT NULL), '{{}}'
            ) AS world_rule_ids,
            COALESCE(
                ARRAY_AGG(DISTINCT ier.evidence_role_id::text)
                    FILTER (WHERE ier.evidence_role_id IS NOT NULL), '{{}}'
            ) AS evidence_role_ids
        FROM issues i
        LEFT JOIN issue_entities ie     ON ie.issue_id = i.id
        LEFT JOIN issue_episodes iep    ON iep.issue_id = i.id
        LEFT JOIN issue_world_rules iwr ON iwr.issue_id = i.id
        LEFT JOIN issue_evidence_roles ier ON ier.issue_id = i.id
        {where}
        GROUP BY i.id, i.work_id, i.label, i.issue_type,
                 i.severity, i.description, i.status
        ORDER BY i.id
    """

    rows = (await db.execute(text(q), params)).mappings().all()
    return [
        Issue(
            id=_s(row["id"]),
            work_id=_s(row["work_id"]),
            label=row["label"],
            issue_type=row["issue_type"],
            severity=row["severity"],
            description=row["description"],
            status=row["status"],
            related_entity_ids=list(row["entity_ids"] or []),
            related_episode_ids=list(row["episode_ids"] or []),
            related_world_rule_ids=list(row["world_rule_ids"] or []),
            related_evidence_role_ids=list(row["evidence_role_ids"] or []),
        )
        for row in rows
    ]


# ── manuscripts ───────────────────────────────────────────────

async def get_manuscript(
    db: AsyncSession, manuscript_id: str
) -> Optional[ManuscriptDetail]:
    ms_row = (
        await db.execute(
            text("SELECT * FROM manuscripts WHERE id::text = :id"),
            {"id": manuscript_id},
        )
    ).mappings().first()
    if not ms_row:
        return None

    manuscript = Manuscript(
        id=_s(ms_row["id"]),
        work_id=_s(ms_row["work_id"]),
        created_at=ms_row["created_at"],
        updated_at=ms_row["updated_at"],
    )

    tb_rows = (
        await db.execute(
            text(
                "SELECT * FROM text_blocks"
                " WHERE manuscript_id::text = :id ORDER BY ordinal"
            ),
            {"id": manuscript_id},
        )
    ).mappings().all()

    text_blocks = [
        TextBlock(
            id=_s(r["id"]),
            manuscript_id=_s(r["manuscript_id"]),
            chapter_id=_s(r["chapter_id"]),
            ordinal=r["ordinal"],
            content=r["content"],
            format=r["format"],
            content_hash=r["content_hash"],
        )
        for r in tb_rows
    ]

    return ManuscriptDetail(manuscript=manuscript, text_blocks=text_blocks)


# ── existence checks ──────────────────────────────────────────

async def check_manuscript_exists(db: AsyncSession, manuscript_id: str) -> bool:
    result = await db.execute(
        text("SELECT 1 FROM manuscripts WHERE id::text = :id LIMIT 1"),
        {"id": manuscript_id},
    )
    return result.first() is not None


async def check_entity_exists(db: AsyncSession, entity_id: str) -> bool:
    result = await db.execute(
        text("SELECT 1 FROM entities WHERE id::text = :id LIMIT 1"),
        {"id": entity_id},
    )
    return result.first() is not None


# ── annotations ───────────────────────────────────────────────

async def get_manuscript_annotations(
    db: AsyncSession,
    manuscript_id: str,
    entity_id: Optional[str] = None,
    annotation_type: Optional[str] = None,
) -> list[Annotation]:
    """
    Return all Annotation objects for a manuscript, each with its Mention list.
    Sorted by text_block.ordinal then start_offset.
    entity_id filter: only annotations that contain at least one mention for that entity
                      (all mentions for such annotations are still returned).
    """
    conditions: list[str] = ["tb.manuscript_id::text = :manuscript_id"]
    params: dict = {"manuscript_id": manuscript_id}

    if annotation_type:
        conditions.append("a.annotation_type = :annotation_type")
        params["annotation_type"] = annotation_type

    if entity_id:
        conditions.append(
            "a.id IN ("
            "  SELECT annotation_id FROM mentions WHERE entity_id::text = :entity_id"
            ")"
        )
        params["entity_id"] = entity_id

    where = "WHERE " + " AND ".join(conditions)

    q = f"""
        SELECT
            a.id            AS a_id,
            a.text_block_id AS a_text_block_id,
            a.start_offset,
            a.end_offset,
            a.annotation_type,
            a.note,
            a.is_stale,
            tb.ordinal      AS tb_ordinal,
            m.id            AS m_id,
            m.entity_id     AS m_entity_id,
            m.entity_type   AS m_entity_type,
            m.display_text,
            m.confidence,
            m.source
        FROM annotations a
        JOIN text_blocks tb ON tb.id = a.text_block_id
        LEFT JOIN mentions m ON m.annotation_id = a.id
        {where}
        ORDER BY tb.ordinal, a.start_offset, m.id
    """

    rows = (await db.execute(text(q), params)).mappings().all()

    annotations: dict[str, dict] = {}
    for row in rows:
        aid = _s(row["a_id"])
        if aid not in annotations:
            annotations[aid] = {
                "id": aid,
                "text_block_id": _s(row["a_text_block_id"]),
                "start_offset": row["start_offset"],
                "end_offset": row["end_offset"],
                "annotation_type": row["annotation_type"],
                "note": row["note"],
                "is_stale": row["is_stale"],
                "mentions": [],
            }
        if row["m_id"] is not None:
            annotations[aid]["mentions"].append(
                Mention(
                    id=_s(row["m_id"]),
                    annotation_id=aid,
                    entity_id=_s(row["m_entity_id"]),
                    entity_type=row["m_entity_type"],
                    display_text=row["display_text"],
                    confidence=row["confidence"],
                    source=row["source"],
                )
            )

    return [Annotation(**data) for data in annotations.values()]


# ── entity mentions ───────────────────────────────────────────

async def get_entity_mentions(
    db: AsyncSession,
    entity_id: str,
    work_id: Optional[str] = None,
) -> list[Mention]:
    """
    Return all Mention objects for a given entity, ordered by narrative position
    (text_block.ordinal → annotation.start_offset).
    Optional work_id filter restricts to a single work's manuscript.
    """
    conditions: list[str] = ["m.entity_id::text = :entity_id"]
    params: dict = {"entity_id": entity_id}

    if work_id:
        conditions.append("ms.work_id::text = :work_id")
        params["work_id"] = work_id

    where = "WHERE " + " AND ".join(conditions)

    q = f"""
        SELECT
            m.id,
            m.annotation_id,
            m.entity_id,
            m.entity_type,
            m.display_text,
            m.confidence,
            m.source
        FROM mentions m
        JOIN annotations  a  ON a.id  = m.annotation_id
        JOIN text_blocks  tb ON tb.id = a.text_block_id
        JOIN manuscripts  ms ON ms.id = tb.manuscript_id
        {where}
        ORDER BY tb.ordinal, a.start_offset
    """

    rows = (await db.execute(text(q), params)).mappings().all()
    return [
        Mention(
            id=_s(row["id"]),
            annotation_id=_s(row["annotation_id"]),
            entity_id=_s(row["entity_id"]),
            entity_type=row["entity_type"],
            display_text=row["display_text"],
            confidence=row["confidence"],
            source=row["source"],
        )
        for row in rows
    ]
