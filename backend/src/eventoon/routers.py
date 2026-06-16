import csv
import io

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from eventoon.ai import AIService, get_ai_service
from eventoon.schemas import (
    EventCreate,
    EventResponse,
    EventStats,
    RegistrationCreate,
    RegistrationResponse,
)
from eventoon.services import EventService, get_session

router = APIRouter(tags=["events"])


@router.get("/events/export/csv")
async def export_events_csv(session: AsyncSession = Depends(get_session)):
    service = EventService(session)
    events = await service.list_all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "name", "date", "max_capacity", "attendee_count"])
    for event in events:
        writer.writerow(
            [
                event["id"],
                event["name"],
                event["date"],
                event["max_capacity"],
                event["attendee_count"],
            ]
        )

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=events.csv"},
    )


@router.delete("/test/cleanup", status_code=status.HTTP_204_NO_CONTENT)
async def cleanup_test_data(session: AsyncSession = Depends(get_session)):
    service = EventService(session)
    await service.cleanup_all()
    return None


@router.post("/events", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(data: EventCreate, session: AsyncSession = Depends(get_session)):
    service = EventService(session)
    return await service.create(data)


@router.get("/events", response_model=list[EventResponse])
async def list_events(session: AsyncSession = Depends(get_session)):
    service = EventService(session)
    return await service.list_all()


@router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(event_id: int, session: AsyncSession = Depends(get_session)):
    service = EventService(session)
    return await service.get_by_id(event_id)


@router.post(
    "/events/{event_id}/register",
    response_model=RegistrationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_attendee(
    event_id: int, data: RegistrationCreate, session: AsyncSession = Depends(get_session)
):
    service = EventService(session)
    return await service.register(event_id, data)


@router.get("/events/{event_id}/stats", response_model=EventStats)
async def get_stats(event_id: int, session: AsyncSession = Depends(get_session)):
    service = EventService(session)
    return await service.stats(event_id)


@router.get("/events/{event_id}/stats/summary")
async def get_stats_summary(
    event_id: int,
    session: AsyncSession = Depends(get_session),
    ai: AIService = Depends(get_ai_service),
):
    from eventoon.repositories import EventAIInsightRepository

    service = EventService(session)
    insight_repo = EventAIInsightRepository(session)

    stats = await service.stats(event_id)

    cached = await insight_repo.get_cached_insight(
        event_id, stats.name, stats.total_registrations, stats.max_capacity
    )
    if cached:
        return {"summary": cached, "cached": True}

    summary = await ai.get_stats_summary(stats.name, stats.total_registrations, stats.max_capacity)
    summary = summary[:2000]

    await insight_repo.save_insight(
        event_id, stats.name, stats.total_registrations, stats.max_capacity, summary
    )

    return {"summary": summary, "cached": False}
