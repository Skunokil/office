from enum import Enum
from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field


# ============================================================
# ENUMS — Canonical Layer
# ============================================================

class WorkStatus(str, Enum):
    draft = "draft"
    complete = "complete"
    archived = "archived"


class ChapterStatus(str, Enum):
    draft = "draft"
    outline = "outline"
    final = "final"
    archived = "archived"


class EntityType(str, Enum):
    character = "character"
    location = "location"
    artifact = "artifact"
    group = "group"


class EntityStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    latent = "latent"
    draft = "draft"


class ImportanceTier(str, Enum):
    anchor = "anchor"
    supporting = "supporting"
    minor = "minor"


class EpisodeFunction(str, Enum):
    exposition = "exposition"
    complication = "complication"
    false_lead = "false_lead"
    climax = "climax"
    resolution = "resolution"
    escalation = "escalation"
    revelation = "revelation"
    other = "other"


class EventStatus(str, Enum):
    confirmed = "confirmed"
    unverified = "unverified"
    hypothesis = "hypothesis"
    rejected = "rejected"


class RelationEpistemicStatus(str, Enum):
    confirmed = "confirmed"
    suspected = "suspected"
    false_ = "false"
    unknown = "unknown"


class TrustLeverage(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class WorldRuleType(str, Enum):
    physical = "physical"
    social = "social"
    institutional = "institutional"
    economic = "economic"
    informational = "informational"
    epistemic = "epistemic"


class SpeakerRole(str, Enum):
    author = "author"
    character = "character"
    deceptive_expert = "deceptive_expert"
    narrator = "narrator"


class WorldRuleState(str, Enum):
    active = "active"
    compromised = "compromised"
    suspended = "suspended"


class ManipulationUse(str, Enum):
    none = "none"
    legitimation = "legitimation"
    gaslighting = "gaslighting"
    misdirection = "misdirection"


# ============================================================
# ENUMS — Text Layer
# ============================================================

class TextBlockFormat(str, Enum):
    plain = "plain"
    markdown = "markdown"


class AnnotationType(str, Enum):
    mention = "mention"
    structural = "structural"
    note = "note"
    issue_marker = "issue_marker"


class MentionConfidence(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class MentionSource(str, Enum):
    manual = "manual"
    auto = "auto"


# ============================================================
# ENUMS — Epistemic Layer
# ============================================================

class EpistemicTrackStatus(str, Enum):
    open = "open"
    closed = "closed"
    unresolved = "unresolved"


class EpistemicStatus(str, Enum):
    unknown = "unknown"
    suspected = "suspected"
    believed = "believed"
    inferred = "inferred"
    confirmed = "confirmed"
    contradicted = "contradicted"
    false_ = "false"


class EvidenceRoleType(str, Enum):
    evidence = "evidence"
    counter_evidence = "counter_evidence"
    false_lead = "false_lead"
    confirmation = "confirmation"
    refutation = "refutation"
    signal = "signal"


class EvidenceRoleStatus(str, Enum):
    hidden = "hidden"
    found = "found"
    misread = "misread"
    verified = "verified"
    disproved = "disproved"


# ============================================================
# ENUMS — Diagnostic Layer
# ============================================================

class IssueType(str, Enum):
    logical_gap = "logical_gap"
    motivation_gap = "motivation_gap"
    chronology_gap = "chronology_gap"
    structural_gap = "structural_gap"
    schema_gap = "schema_gap"
    evidence_weakness = "evidence_weakness"
    dangling_thread = "dangling_thread"


class IssueSeverity(str, Enum):
    blocking = "blocking"
    warning = "warning"
    note = "note"


class IssueStatus(str, Enum):
    open = "open"
    resolved = "resolved"
    wont_fix = "wont_fix"


# ============================================================
# CANONICAL LAYER
# ============================================================

class Work(BaseModel):
    id: str
    title: str
    author: Optional[str] = None
    language: str = "ru"
    genre: Optional[str] = None
    status: WorkStatus = WorkStatus.draft
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Part(BaseModel):
    id: str
    work_id: str
    title: str
    ordinal: int
    summary: Optional[str] = None


class Chapter(BaseModel):
    id: str
    work_id: str
    part_id: Optional[str] = None
    title: str
    ordinal: int
    pov_entity_id: Optional[str] = None
    summary: Optional[str] = None
    status: ChapterStatus = ChapterStatus.draft


class Episode(BaseModel):
    id: str
    work_id: str
    chapter_id: Optional[str] = None
    label: str
    summary: Optional[str] = None
    function: Optional[EpisodeFunction] = None
    importance_tier: Optional[ImportanceTier] = None
    ordinal: int


class Event(BaseModel):
    id: str
    work_id: str
    name: str
    summary: Optional[str] = None
    story_time: Optional[str] = None
    episode_id: Optional[str] = None
    location_id: Optional[str] = None
    status: EventStatus = EventStatus.confirmed


class Entity(BaseModel):
    id: str
    work_id: str
    type: EntityType
    name: str
    summary: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    status: EntityStatus = EntityStatus.active
    importance_tier: Optional[ImportanceTier] = None
    extra: Optional[dict[str, Any]] = None


class Relation(BaseModel):
    id: str
    work_id: str
    from_id: str
    to_id: str
    type: str
    label: Optional[str] = None
    epistemic_status: RelationEpistemicStatus = RelationEpistemicStatus.unknown
    active_from_event_id: Optional[str] = None
    active_to_event_id: Optional[str] = None
    trust_leverage: Optional[TrustLeverage] = None


class WorldRule(BaseModel):
    id: str
    work_id: str
    text: str
    summary: Optional[str] = None
    rule_type: Optional[WorldRuleType] = None
    speaker_id: Optional[str] = None
    speaker_role: SpeakerRole = SpeakerRole.author
    state: WorldRuleState = WorldRuleState.active
    manipulation_use: ManipulationUse = ManipulationUse.none


# ============================================================
# TEXT LAYER
# ============================================================

class Manuscript(BaseModel):
    id: str
    work_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class TextBlock(BaseModel):
    id: str
    manuscript_id: str
    chapter_id: Optional[str] = None
    ordinal: int
    content: str
    format: TextBlockFormat = TextBlockFormat.plain
    content_hash: Optional[str] = None


class Mention(BaseModel):
    id: str
    annotation_id: str
    entity_id: str
    entity_type: EntityType
    display_text: Optional[str] = None
    confidence: MentionConfidence = MentionConfidence.high
    source: MentionSource = MentionSource.manual


class Annotation(BaseModel):
    id: str
    text_block_id: str
    start_offset: int
    end_offset: int
    annotation_type: AnnotationType = AnnotationType.mention
    note: Optional[str] = None
    is_stale: bool = False
    mentions: list[Mention] = Field(default_factory=list)


# ============================================================
# EPISTEMIC LAYER
# ============================================================

class EpistemicStep(BaseModel):
    id: str
    track_id: str
    step_ordinal: int
    episode_id: str
    event_id: Optional[str] = None
    version: str
    epistemic_status: EpistemicStatus


class EpistemicTrack(BaseModel):
    id: str
    work_id: str
    label: str
    subject_id: str
    object_label: str
    object_entity_id: Optional[str] = None
    status: EpistemicTrackStatus = EpistemicTrackStatus.open


class EpistemicTrackDetail(EpistemicTrack):
    steps: list[EpistemicStep] = Field(default_factory=list)


class EvidenceRoleState(BaseModel):
    id: str
    evidence_role_id: str
    episode_id: str
    previous_status: Optional[EvidenceRoleStatus] = None
    new_status: EvidenceRoleStatus
    comment: Optional[str] = None


class EvidenceRole(BaseModel):
    id: str
    work_id: str
    track_id: str
    entity_id: str
    entity_type: EntityType
    role_type: EvidenceRoleType
    epistemic_status: EvidenceRoleStatus = EvidenceRoleStatus.hidden
    note: Optional[str] = None
    state_history: list[EvidenceRoleState] = Field(default_factory=list)


# ============================================================
# DIAGNOSTIC LAYER
# ============================================================

class Issue(BaseModel):
    id: str
    work_id: str
    label: str
    issue_type: IssueType
    severity: IssueSeverity = IssueSeverity.warning
    description: Optional[str] = None
    status: IssueStatus = IssueStatus.open
    related_entity_ids: list[str] = Field(default_factory=list)
    related_episode_ids: list[str] = Field(default_factory=list)
    related_world_rule_ids: list[str] = Field(default_factory=list)
    related_evidence_role_ids: list[str] = Field(default_factory=list)


# ============================================================
# RESPONSE MODELS
# ============================================================

class WorkStructure(BaseModel):
    work: Work
    parts: list[Part] = Field(default_factory=list)
    chapters: list[Chapter] = Field(default_factory=list)
    episodes: list[Episode] = Field(default_factory=list)
    events: list[Event] = Field(default_factory=list)


class ManuscriptDetail(BaseModel):
    manuscript: Manuscript
    text_blocks: list[TextBlock] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
