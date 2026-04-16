from typing import List, Optional
from datetime import date
from pydantic import BaseModel, Field


class Project(BaseModel):
    title: str
    description: str
    language: str = Field(..., description="ISO language code, e.g. 'ru'")
    createdAt: date


class Entity(BaseModel):
    id: str
    type: str
    name: str
    summary: str
    tags: List[str] = Field(default_factory=list)
    status: str


class Event(BaseModel):
    id: str
    type: str = "event"
    name: str
    summary: str
    tags: List[str] = Field(default_factory=list)
    status: str
    storyTime: Optional[str] = Field(
        default=None, description="In-world time, ISO-8601 string without timezone"
    )
    narrativeOrder: Optional[int] = None
    locationId: Optional[str] = None
    characterIds: List[str] = Field(default_factory=list)


class NarrativeUnit(BaseModel):
    id: str
    type: str = "chapter"
    title: str
    chapter: Optional[int] = None
    pov: Optional[str] = None
    summary: str
    linkedEventIds: List[str] = Field(default_factory=list)
    narrativeOrder: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    status: str


class Relation(BaseModel):
    id: str
    type: str
    fromId: str
    toId: str
    label: str


class ProjectSnapshot(BaseModel):
    project: Project
    entities: List[Entity]
    events: List[Event]
    narrativeUnits: List[NarrativeUnit]
    relations: List[Relation]

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str | None = None