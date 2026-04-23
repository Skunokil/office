"""
Clone service for Story OS v2.
Copies all records of a template workspace into a new workspace with fresh UUIDs.

Topological copy order (FK dependencies):
  workspace + member → works → parts → entities → chapters → episodes → events
  → event_participants → relations → world_rules → manuscripts → text_blocks
  → annotations → mentions → epistemic_tracks → epistemic_steps
  → evidence_roles → evidence_role_states → issues → issue_* junctions

Commit is the caller's responsibility — everything runs in the caller's transaction.
"""
import json
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


def _remap(id_map: dict[str, str], val) -> Optional[str]:
    if val is None:
        return None
    return id_map.get(str(val))


async def clone_workspace(
    db: AsyncSession,
    template_workspace_id: UUID,
    new_owner_id: UUID,
    new_workspace_name: str,
) -> tuple[UUID, list[UUID]]:
    """
    Clone all works (and their dependent records) from template_workspace into
    a new workspace owned by new_owner_id.

    Returns (new_workspace_id, [new_work_id, ...]).
    Commit is the caller's responsibility.
    """
    new_workspace_id = uuid4()
    twid = str(template_workspace_id)
    id_map: dict[str, str] = {}

    # ── 1. Workspace + owner member ───────────────────────────
    await db.execute(
        text("""
            INSERT INTO workspaces (id, owner_id, name, is_template)
            VALUES (:id, :owner_id, :name, FALSE)
        """),
        {"id": str(new_workspace_id), "owner_id": str(new_owner_id), "name": new_workspace_name},
    )
    await db.execute(
        text("""
            INSERT INTO workspace_members (workspace_id, user_id, role)
            VALUES (:wid, :uid, 'owner')
        """),
        {"wid": str(new_workspace_id), "uid": str(new_owner_id)},
    )

    # ── 2. Works ──────────────────────────────────────────────
    rows = (await db.execute(
        text("SELECT * FROM works WHERE workspace_id::text = :twid"),
        {"twid": twid},
    )).mappings().all()

    new_work_ids: list[UUID] = []
    work_ids_old: list[str] = []

    for row in rows:
        old_id = str(row["id"])
        new_id = str(uuid4())
        id_map[old_id] = new_id
        work_ids_old.append(old_id)
        new_work_ids.append(UUID(new_id))
        await db.execute(
            text("""
                INSERT INTO works (id, workspace_id, title, author, language, genre, status)
                VALUES (:id, :wid, :title, :author, :language, :genre, :status)
            """),
            {
                "id": new_id,
                "wid": str(new_workspace_id),
                "title": row["title"],
                "author": row["author"],
                "language": row["language"],
                "genre": row["genre"],
                "status": row["status"],
            },
        )

    if not work_ids_old:
        return new_workspace_id, []

    async def _fetch_by_work(table: str) -> list:
        """Fetch all rows for a work-scoped table across all template works."""
        all_rows = []
        for wid in work_ids_old:
            result = (await db.execute(
                text(f"SELECT * FROM {table} WHERE work_id::text = :wid"),
                {"wid": wid},
            )).mappings().all()
            all_rows.extend(result)
        return all_rows

    # ── 3. Parts ──────────────────────────────────────────────
    for row in await _fetch_by_work("parts"):
        old_id, new_id = str(row["id"]), str(uuid4())
        id_map[old_id] = new_id
        await db.execute(
            text("""
                INSERT INTO parts (id, work_id, title, ordinal, summary)
                VALUES (:id, :work_id, :title, :ordinal, :summary)
            """),
            {
                "id": new_id,
                "work_id": id_map[str(row["work_id"])],
                "title": row["title"],
                "ordinal": row["ordinal"],
                "summary": row["summary"],
            },
        )

    # ── 4. Entities ───────────────────────────────────────────
    for row in await _fetch_by_work("entities"):
        old_id, new_id = str(row["id"]), str(uuid4())
        id_map[old_id] = new_id
        extra = row["extra"]
        await db.execute(
            text("""
                INSERT INTO entities (id, work_id, type, name, summary, tags,
                    status, importance_tier, extra)
                VALUES (:id, :work_id, :type, :name, :summary, :tags,
                    :status, :importance_tier, CAST(:extra AS jsonb))
            """),
            {
                "id": new_id,
                "work_id": id_map[str(row["work_id"])],
                "type": row["type"],
                "name": row["name"],
                "summary": row["summary"],
                "tags": list(row["tags"]) if row["tags"] else [],
                "status": row["status"],
                "importance_tier": row["importance_tier"],
                "extra": json.dumps(extra) if extra is not None else None,
            },
        )

    # ── 5. Chapters ───────────────────────────────────────────
    for row in await _fetch_by_work("chapters"):
        old_id, new_id = str(row["id"]), str(uuid4())
        id_map[old_id] = new_id
        await db.execute(
            text("""
                INSERT INTO chapters (id, work_id, part_id, title, ordinal,
                    pov_entity_id, summary, status)
                VALUES (:id, :work_id, :part_id, :title, :ordinal,
                    :pov_entity_id, :summary, :status)
            """),
            {
                "id": new_id,
                "work_id": id_map[str(row["work_id"])],
                "part_id": _remap(id_map, row["part_id"]),
                "title": row["title"],
                "ordinal": row["ordinal"],
                "pov_entity_id": _remap(id_map, row["pov_entity_id"]),
                "summary": row["summary"],
                "status": row["status"],
            },
        )

    # ── 6. Episodes ───────────────────────────────────────────
    for row in await _fetch_by_work("episodes"):
        old_id, new_id = str(row["id"]), str(uuid4())
        id_map[old_id] = new_id
        await db.execute(
            text("""
                INSERT INTO episodes (id, work_id, chapter_id, label, summary,
                    function, importance_tier, ordinal)
                VALUES (:id, :work_id, :chapter_id, :label, :summary,
                    :function, :importance_tier, :ordinal)
            """),
            {
                "id": new_id,
                "work_id": id_map[str(row["work_id"])],
                "chapter_id": _remap(id_map, row["chapter_id"]),
                "label": row["label"],
                "summary": row["summary"],
                "function": row["function"],
                "importance_tier": row["importance_tier"],
                "ordinal": row["ordinal"],
            },
        )

    # ── 7. Events ─────────────────────────────────────────────
    for row in await _fetch_by_work("events"):
        old_id, new_id = str(row["id"]), str(uuid4())
        id_map[old_id] = new_id
        await db.execute(
            text("""
                INSERT INTO events (id, work_id, name, summary, story_time,
                    episode_id, location_id, status)
                VALUES (:id, :work_id, :name, :summary, :story_time,
                    :episode_id, :location_id, :status)
            """),
            {
                "id": new_id,
                "work_id": id_map[str(row["work_id"])],
                "name": row["name"],
                "summary": row["summary"],
                "story_time": row["story_time"],
                "episode_id": _remap(id_map, row["episode_id"]),
                "location_id": _remap(id_map, row["location_id"]),
                "status": row["status"],
            },
        )

    # ── 8. Event Participants (junction, no own PK) ───────────
    for wid in work_ids_old:
        ep_rows = (await db.execute(
            text("""
                SELECT ep.event_id, ep.entity_id, ep.role
                FROM event_participants ep
                JOIN events e ON e.id = ep.event_id
                WHERE e.work_id::text = :wid
            """),
            {"wid": wid},
        )).mappings().all()
        for row in ep_rows:
            new_eid = _remap(id_map, row["event_id"])
            new_entid = _remap(id_map, row["entity_id"])
            if new_eid and new_entid:
                await db.execute(
                    text("""
                        INSERT INTO event_participants (event_id, entity_id, role)
                        VALUES (:event_id, :entity_id, :role)
                    """),
                    {"event_id": new_eid, "entity_id": new_entid, "role": row["role"]},
                )

    # ── 9. Relations ──────────────────────────────────────────
    for row in await _fetch_by_work("relations"):
        old_id, new_id = str(row["id"]), str(uuid4())
        id_map[old_id] = new_id
        await db.execute(
            text("""
                INSERT INTO relations (id, work_id, from_id, to_id, type, label,
                    epistemic_status, active_from_event_id, active_to_event_id, trust_leverage)
                VALUES (:id, :work_id, :from_id, :to_id, :type, :label,
                    :epistemic_status, :active_from_event_id, :active_to_event_id, :trust_leverage)
            """),
            {
                "id": new_id,
                "work_id": id_map[str(row["work_id"])],
                "from_id": id_map[str(row["from_id"])],
                "to_id": id_map[str(row["to_id"])],
                "type": row["type"],
                "label": row["label"],
                "epistemic_status": row["epistemic_status"],
                "active_from_event_id": _remap(id_map, row["active_from_event_id"]),
                "active_to_event_id": _remap(id_map, row["active_to_event_id"]),
                "trust_leverage": row["trust_leverage"],
            },
        )

    # ── 10. World Rules ───────────────────────────────────────
    for row in await _fetch_by_work("world_rules"):
        old_id, new_id = str(row["id"]), str(uuid4())
        id_map[old_id] = new_id
        await db.execute(
            text("""
                INSERT INTO world_rules (id, work_id, text, summary, rule_type,
                    speaker_id, speaker_role, state, manipulation_use)
                VALUES (:id, :work_id, :text, :summary, :rule_type,
                    :speaker_id, :speaker_role, :state, :manipulation_use)
            """),
            {
                "id": new_id,
                "work_id": id_map[str(row["work_id"])],
                "text": row["text"],
                "summary": row["summary"],
                "rule_type": row["rule_type"],
                "speaker_id": _remap(id_map, row["speaker_id"]),
                "speaker_role": row["speaker_role"],
                "state": row["state"],
                "manipulation_use": row["manipulation_use"],
            },
        )

    # ── 11. Manuscripts ───────────────────────────────────────
    for row in await _fetch_by_work("manuscripts"):
        old_id, new_id = str(row["id"]), str(uuid4())
        id_map[old_id] = new_id
        await db.execute(
            text("INSERT INTO manuscripts (id, work_id) VALUES (:id, :work_id)"),
            {"id": new_id, "work_id": id_map[str(row["work_id"])]},
        )

    # ── 12. Text Blocks ───────────────────────────────────────
    for wid in work_ids_old:
        tb_rows = (await db.execute(
            text("""
                SELECT tb.*
                FROM text_blocks tb
                JOIN manuscripts ms ON ms.id = tb.manuscript_id
                WHERE ms.work_id::text = :wid
                ORDER BY tb.ordinal
            """),
            {"wid": wid},
        )).mappings().all()
        for row in tb_rows:
            old_id, new_id = str(row["id"]), str(uuid4())
            id_map[old_id] = new_id
            await db.execute(
                text("""
                    INSERT INTO text_blocks (id, manuscript_id, chapter_id, ordinal,
                        content, format, content_hash)
                    VALUES (:id, :manuscript_id, :chapter_id, :ordinal,
                        :content, :format, :content_hash)
                """),
                {
                    "id": new_id,
                    "manuscript_id": id_map[str(row["manuscript_id"])],
                    "chapter_id": _remap(id_map, row["chapter_id"]),
                    "ordinal": row["ordinal"],
                    "content": row["content"],
                    "format": row["format"],
                    "content_hash": row["content_hash"],
                },
            )

    # ── 13. Annotations ───────────────────────────────────────
    for wid in work_ids_old:
        ann_rows = (await db.execute(
            text("""
                SELECT a.*
                FROM annotations a
                JOIN text_blocks tb ON tb.id = a.text_block_id
                JOIN manuscripts ms ON ms.id = tb.manuscript_id
                WHERE ms.work_id::text = :wid
                ORDER BY tb.ordinal, a.start_offset
            """),
            {"wid": wid},
        )).mappings().all()
        for row in ann_rows:
            old_id, new_id = str(row["id"]), str(uuid4())
            id_map[old_id] = new_id
            await db.execute(
                text("""
                    INSERT INTO annotations (id, text_block_id, start_offset, end_offset,
                        annotation_type, note, is_stale)
                    VALUES (:id, :text_block_id, :start_offset, :end_offset,
                        :annotation_type, :note, :is_stale)
                """),
                {
                    "id": new_id,
                    "text_block_id": id_map[str(row["text_block_id"])],
                    "start_offset": row["start_offset"],
                    "end_offset": row["end_offset"],
                    "annotation_type": row["annotation_type"],
                    "note": row["note"],
                    "is_stale": row["is_stale"],
                },
            )

    # ── 14. Mentions ──────────────────────────────────────────
    for wid in work_ids_old:
        m_rows = (await db.execute(
            text("""
                SELECT m.*
                FROM mentions m
                JOIN annotations a ON a.id = m.annotation_id
                JOIN text_blocks tb ON tb.id = a.text_block_id
                JOIN manuscripts ms ON ms.id = tb.manuscript_id
                WHERE ms.work_id::text = :wid
            """),
            {"wid": wid},
        )).mappings().all()
        for row in m_rows:
            old_id, new_id = str(row["id"]), str(uuid4())
            id_map[old_id] = new_id
            await db.execute(
                text("""
                    INSERT INTO mentions (id, annotation_id, entity_id, entity_type,
                        display_text, confidence, source)
                    VALUES (:id, :annotation_id, :entity_id, :entity_type,
                        :display_text, :confidence, :source)
                """),
                {
                    "id": new_id,
                    "annotation_id": id_map[str(row["annotation_id"])],
                    "entity_id": id_map[str(row["entity_id"])],
                    "entity_type": row["entity_type"],
                    "display_text": row["display_text"],
                    "confidence": row["confidence"],
                    "source": row["source"],
                },
            )

    # ── 15. Epistemic Tracks ──────────────────────────────────
    for row in await _fetch_by_work("epistemic_tracks"):
        old_id, new_id = str(row["id"]), str(uuid4())
        id_map[old_id] = new_id
        await db.execute(
            text("""
                INSERT INTO epistemic_tracks (id, work_id, label, subject_id,
                    object_label, object_entity_id, status)
                VALUES (:id, :work_id, :label, :subject_id,
                    :object_label, :object_entity_id, :status)
            """),
            {
                "id": new_id,
                "work_id": id_map[str(row["work_id"])],
                "label": row["label"],
                "subject_id": id_map[str(row["subject_id"])],
                "object_label": row["object_label"],
                "object_entity_id": _remap(id_map, row["object_entity_id"]),
                "status": row["status"],
            },
        )

    # ── 16. Epistemic Steps ───────────────────────────────────
    for wid in work_ids_old:
        es_rows = (await db.execute(
            text("""
                SELECT es.*
                FROM epistemic_steps es
                JOIN epistemic_tracks et ON et.id = es.track_id
                WHERE et.work_id::text = :wid
                ORDER BY es.step_ordinal
            """),
            {"wid": wid},
        )).mappings().all()
        for row in es_rows:
            old_id, new_id = str(row["id"]), str(uuid4())
            id_map[old_id] = new_id
            await db.execute(
                text("""
                    INSERT INTO epistemic_steps (id, track_id, step_ordinal, episode_id,
                        event_id, version, epistemic_status)
                    VALUES (:id, :track_id, :step_ordinal, :episode_id,
                        :event_id, :version, :epistemic_status)
                """),
                {
                    "id": new_id,
                    "track_id": id_map[str(row["track_id"])],
                    "step_ordinal": row["step_ordinal"],
                    "episode_id": id_map[str(row["episode_id"])],
                    "event_id": _remap(id_map, row["event_id"]),
                    "version": row["version"],
                    "epistemic_status": row["epistemic_status"],
                },
            )

    # ── 17. Evidence Roles ────────────────────────────────────
    for row in await _fetch_by_work("evidence_roles"):
        old_id, new_id = str(row["id"]), str(uuid4())
        id_map[old_id] = new_id
        await db.execute(
            text("""
                INSERT INTO evidence_roles (id, work_id, track_id, entity_id,
                    entity_type, role_type, epistemic_status, note)
                VALUES (:id, :work_id, :track_id, :entity_id,
                    :entity_type, :role_type, :epistemic_status, :note)
            """),
            {
                "id": new_id,
                "work_id": id_map[str(row["work_id"])],
                "track_id": id_map[str(row["track_id"])],
                "entity_id": id_map[str(row["entity_id"])],
                "entity_type": row["entity_type"],
                "role_type": row["role_type"],
                "epistemic_status": row["epistemic_status"],
                "note": row["note"],
            },
        )

    # ── 18. Evidence Role States ──────────────────────────────
    for wid in work_ids_old:
        ers_rows = (await db.execute(
            text("""
                SELECT ers.*
                FROM evidence_role_states ers
                JOIN evidence_roles er ON er.id = ers.evidence_role_id
                WHERE er.work_id::text = :wid
            """),
            {"wid": wid},
        )).mappings().all()
        for row in ers_rows:
            old_id, new_id = str(row["id"]), str(uuid4())
            id_map[old_id] = new_id
            await db.execute(
                text("""
                    INSERT INTO evidence_role_states (id, evidence_role_id, episode_id,
                        previous_status, new_status, comment)
                    VALUES (:id, :evidence_role_id, :episode_id,
                        :previous_status, :new_status, :comment)
                """),
                {
                    "id": new_id,
                    "evidence_role_id": id_map[str(row["evidence_role_id"])],
                    "episode_id": id_map[str(row["episode_id"])],
                    "previous_status": row["previous_status"],
                    "new_status": row["new_status"],
                    "comment": row["comment"],
                },
            )

    # ── 19. Issues ────────────────────────────────────────────
    for row in await _fetch_by_work("issues"):
        old_id, new_id = str(row["id"]), str(uuid4())
        id_map[old_id] = new_id
        await db.execute(
            text("""
                INSERT INTO issues (id, work_id, label, issue_type, severity, description, status)
                VALUES (:id, :work_id, :label, :issue_type, :severity, :description, :status)
            """),
            {
                "id": new_id,
                "work_id": id_map[str(row["work_id"])],
                "label": row["label"],
                "issue_type": row["issue_type"],
                "severity": row["severity"],
                "description": row["description"],
                "status": row["status"],
            },
        )

    # ── 20–23. Issue Junction Tables ──────────────────────────
    for wid in work_ids_old:
        rows = (await db.execute(
            text("""
                SELECT ie.issue_id, ie.entity_id FROM issue_entities ie
                JOIN issues i ON i.id = ie.issue_id WHERE i.work_id::text = :wid
            """),
            {"wid": wid},
        )).mappings().all()
        for row in rows:
            await db.execute(
                text("INSERT INTO issue_entities (issue_id, entity_id) VALUES (:iid, :eid)"),
                {"iid": id_map[str(row["issue_id"])], "eid": id_map[str(row["entity_id"])]},
            )

        rows = (await db.execute(
            text("""
                SELECT iep.issue_id, iep.episode_id FROM issue_episodes iep
                JOIN issues i ON i.id = iep.issue_id WHERE i.work_id::text = :wid
            """),
            {"wid": wid},
        )).mappings().all()
        for row in rows:
            await db.execute(
                text("INSERT INTO issue_episodes (issue_id, episode_id) VALUES (:iid, :epid)"),
                {"iid": id_map[str(row["issue_id"])], "epid": id_map[str(row["episode_id"])]},
            )

        rows = (await db.execute(
            text("""
                SELECT iwr.issue_id, iwr.world_rule_id FROM issue_world_rules iwr
                JOIN issues i ON i.id = iwr.issue_id WHERE i.work_id::text = :wid
            """),
            {"wid": wid},
        )).mappings().all()
        for row in rows:
            await db.execute(
                text("INSERT INTO issue_world_rules (issue_id, world_rule_id) VALUES (:iid, :wrid)"),
                {"iid": id_map[str(row["issue_id"])], "wrid": id_map[str(row["world_rule_id"])]},
            )

        rows = (await db.execute(
            text("""
                SELECT ier.issue_id, ier.evidence_role_id FROM issue_evidence_roles ier
                JOIN issues i ON i.id = ier.issue_id WHERE i.work_id::text = :wid
            """),
            {"wid": wid},
        )).mappings().all()
        for row in rows:
            await db.execute(
                text("INSERT INTO issue_evidence_roles (issue_id, evidence_role_id) VALUES (:iid, :erid)"),
                {"iid": id_map[str(row["issue_id"])], "erid": id_map[str(row["evidence_role_id"])]},
            )

    return new_workspace_id, new_work_ids
