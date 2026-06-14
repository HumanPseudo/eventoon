from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, EmailStr, Field


class EventCreate(BaseModel):
    name: Annotated[str, Field(max_length=255)]
    description: Annotated[str, Field(max_length=1000)]
    date: date
    max_capacity: int


class EventResponse(BaseModel):
    id: int
    name: Annotated[str, Field(max_length=255)]
    description: Annotated[str, Field(max_length=1000)]
    date: date
    max_capacity: int

    model_config = {"from_attributes": True}


class RegistrationCreate(BaseModel):
    user_name: Annotated[str, Field(max_length=255)]
    email: Annotated[EmailStr, Field(max_length=255)]


class RegistrationResponse(BaseModel):
    id: int
    event_id: int
    user_name: Annotated[str, Field(max_length=255)]
    email: Annotated[str, Field(max_length=255)]
    registration_date: datetime

    model_config = {"from_attributes": True}


class EventStats(BaseModel):
    id: int
    name: Annotated[str, Field(max_length=255)]
    total_registrations: int
    max_capacity: int
