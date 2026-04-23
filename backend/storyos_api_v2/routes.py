from typing import Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from .db import get_db
from . import repository
from .models import (
    Work, WorkStructure,
    Annotation, Mention,
    ManuscriptDetail,
    EpistemicTrackDetail,
    Issue,
    Workspace,
    HealthResponse,
    DemoBootstrapResponse,
)
from .services.cloning import clone_workspace

router = APIRouter()


# ============================================================
# HEALTH
# ============================================================

@router.get(
    "/api/v2/health",
    response_model=HealthResponse,
    tags=["health"],
    summary="Healthcheck для Story OS API v2",
)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="storyos-v2", version="0.1.0")


# ============================================================
# ============================================================
# WORKSPACE LAYER
# ============================================================

@router.post(
    "/api/v2/workspaces/demo-bootstrap",
    response_model=DemoBootstrapResponse,
    tags=["workspace"],
    summary="Создать demo workspace с клоном demo-истории",
    description=(
        "Создаёт нового пользователя и клонирует template workspace в его личный workspace. "
        "Возвращает user_id, workspace_id, work_ids — фронт использует их как стартовый контекст. "
        "ВНИМАНИЕ: endpoint без auth — только для MVP/локальной разработки. "
        "В Task 15 будет закрыт или защищён."
    ),
)
async def demo_bootstrap(db: AsyncSession = Depends(get_db)) -> DemoBootstrapResponse:
    template = await repository.get_template_workspace(db)
    if template is None:
        raise HTTPException(
            status_code=500,
            detail="Template workspace not found or ambiguous — check DB seed",
        )

    handle = f"demo-{uuid4().hex[:8]}"
    user = await repository.create_user(db, handle=handle, display_name="Demo User")

    new_workspace_id, new_work_ids = await clone_workspace(
        db,
        template_workspace_id=UUID(template.id),
        new_owner_id=UUID(user.id),
        new_workspace_name="My Story OS Project",
    )

    await db.commit()

    return DemoBootstrapResponse(
        user_id=user.id,
        workspace_id=str(new_workspace_id),
        work_ids=[str(wid) for wid in new_work_ids],
    )


@router.get(
    "/api/v2/workspaces/{workspace_id}/works",
    response_model=list[Work],
    tags=["canonical"],
    summary="Список произведений в workspace",
    description=(
        "Возвращает все Work, принадлежащие данному workspace. "
        "404 если workspace не существует. "
        "200 / [] если workspace существует, но пуст."
    ),
)
async def list_workspace_works(
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
) -> list[Work]:
    if not await repository.check_workspace_exists(db, workspace_id):
        raise HTTPException(
            status_code=404, detail=f"Workspace '{workspace_id}' not found"
        )
    return await repository.get_works_by_workspace(db, workspace_id)


# ============================================================
# CANONICAL — Works
# ============================================================

@router.get(
    "/api/v2/works",
    response_model=list[Work],
    tags=["canonical"],
    summary="Список произведений",
    description=(
        "Возвращает все works без фильтра по workspace. "
        "ВНИМАНИЕ: небезопасно для multi-tenant — будет ограничен workspace в Task 15."
    ),
)
async def list_works(db: AsyncSession = Depends(get_db)) -> list[Work]:
    return await repository.get_works(db)


@router.get(
    "/api/v2/works/{work_id}",
    response_model=Work,
    tags=["canonical"],
    summary="Получить произведение по ID",
)
async def get_work(work_id: str, db: AsyncSession = Depends(get_db)) -> Work:
    work = await repository.get_work_by_id(db, work_id)
    if not work:
        raise HTTPException(status_code=404, detail=f"Work '{work_id}' not found")
    return work


@router.get(
    "/api/v2/works/{work_id}/structure",
    response_model=WorkStructure,
    tags=["canonical"],
    summary="Структура произведения: Work + Parts + Chapters + Episodes + Events",
    description=(
        "Возвращает полную иерархическую структуру произведения. "
        "Episodes отсортированы по ordinal (нарративный порядок). "
        "Events отсортированы по story_time (хронологический порядок мира)."
    ),
)
async def get_work_structure(
    work_id: str, db: AsyncSession = Depends(get_db)
) -> WorkStructure:
    structure = await repository.get_work_structure(db, work_id)
    if not structure:
        raise HTTPException(status_code=404, detail=f"Work '{work_id}' not found")
    return structure


# ============================================================
# TEXT LAYER — Manuscripts
# ============================================================

@router.get(
    "/api/v2/manuscripts/{manuscript_id}",
    response_model=ManuscriptDetail,
    tags=["text"],
    summary="Рукопись с текстовыми блоками",
    description="Возвращает Manuscript и список TextBlock, отсортированных по ordinal.",
)
async def get_manuscript(
    manuscript_id: str, db: AsyncSession = Depends(get_db)
) -> ManuscriptDetail:
    result = await repository.get_manuscript(db, manuscript_id)
    if not result:
        raise HTTPException(
            status_code=404, detail=f"Manuscript '{manuscript_id}' not found"
        )
    return result


@router.get(
    "/api/v2/manuscripts/{manuscript_id}/annotations",
    response_model=list[Annotation],
    tags=["text"],
    summary="Аннотации рукописи",
    description=(
        "Возвращает список Annotation с вложенными Mention. "
        "Сортировка: text_block.ordinal → start_offset. "
        "entity_id: возвращает только аннотации, содержащие хотя бы одно упоминание "
        "указанной сущности (все mentions аннотации сохраняются). "
        "annotation_type: mention | structural | note | issue_marker."
    ),
)
async def list_manuscript_annotations(
    manuscript_id: str,
    entity_id: Optional[str] = Query(
        None, description="Фильтр: только аннотации с упоминанием этой сущности"
    ),
    annotation_type: Optional[str] = Query(
        None, description="Фильтр по типу: mention | structural | note | issue_marker"
    ),
    db: AsyncSession = Depends(get_db),
) -> list[Annotation]:
    if not await repository.check_manuscript_exists(db, manuscript_id):
        raise HTTPException(
            status_code=404, detail=f"Manuscript '{manuscript_id}' not found"
        )
    return await repository.get_manuscript_annotations(
        db, manuscript_id, entity_id, annotation_type
    )


# ============================================================
# TEXT LAYER — Entity mentions
# ============================================================

@router.get(
    "/api/v2/entities/{entity_id}/mentions",
    response_model=list[Mention],
    tags=["text"],
    summary="Упоминания сущности в рукописях",
    description=(
        "Возвращает все Mention для данной сущности в порядке появления в тексте "
        "(text_block.ordinal → annotation.start_offset). "
        "work_id: ограничить произведением."
    ),
)
async def list_entity_mentions(
    entity_id: str,
    work_id: Optional[str] = Query(
        None, description="Ограничить одним произведением"
    ),
    db: AsyncSession = Depends(get_db),
) -> list[Mention]:
    if not await repository.check_entity_exists(db, entity_id):
        raise HTTPException(
            status_code=404, detail=f"Entity '{entity_id}' not found"
        )
    return await repository.get_entity_mentions(db, entity_id, work_id)


# ============================================================
# EPISTEMIC LAYER — Tracks
# ============================================================

@router.get(
    "/api/v2/epistemic-tracks",
    response_model=list[EpistemicTrackDetail],
    tags=["epistemic"],
    summary="Эпистемические треки с шагами",
    description=(
        "Возвращает список EpistemicTrack с вложенными EpistemicStep. "
        "Шаги отсортированы по step_ordinal."
    ),
)
async def list_epistemic_tracks(
    work_id: Optional[str] = Query(None, description="ID произведения для фильтрации"),
    db: AsyncSession = Depends(get_db),
) -> list[EpistemicTrackDetail]:
    return await repository.get_epistemic_tracks(db, work_id)


# ============================================================
# DIAGNOSTIC LAYER — Issues
# ============================================================

@router.get(
    "/api/v2/issues",
    response_model=list[Issue],
    tags=["diagnostic"],
    summary="Диагностические issues произведения",
    description="Возвращает структурные и аналитические проблемы. Фильтр по work_id и status.",
)
async def list_issues(
    work_id: Optional[str] = Query(None, description="ID произведения"),
    status: Optional[str] = Query(None, description="open | resolved | wont_fix"),
    db: AsyncSession = Depends(get_db),
) -> list[Issue]:
    return await repository.get_issues(db, work_id, status)
