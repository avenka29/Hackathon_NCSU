"""
Scenarios API router - list available training scenarios.
"""

from fastapi import APIRouter
from typing import List

from app.models import Scenario
from app.scenarios import list_scenarios, get_scenario

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])


@router.get("/", response_model=List[Scenario])
async def get_all_scenarios():
    """
    List all available training scenarios.
    """
    return list_scenarios()


@router.get("/{scenario_id}", response_model=Scenario)
async def get_scenario_by_id(scenario_id: str):
    """
    Get details for a specific scenario.
    """
    return get_scenario(scenario_id)
