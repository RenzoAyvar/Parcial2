from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, StrictBool, field_validator


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    description: str = Field(default="", max_length=2000)


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=2000)
    completed: StrictBool | None = None

    @field_validator("title", "description", "completed", mode="before")
    @classmethod
    def reject_null_values(cls, value):
        if value is None:
            raise ValueError("El campo no puede ser null")
        return value


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    completed: bool
    created_at: datetime
