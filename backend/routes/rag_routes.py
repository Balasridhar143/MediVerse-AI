from fastapi import APIRouter, Depends, HTTPException, status
import schemas
from services.rag_service import rag_service
from services.lab_service import interpret_lab_result

router = APIRouter(tags=["RAG & Medical Decision Support"])

@router.post("/rag/query", response_model=schemas.RAGQueryResponse)
def query_rag(payload: schemas.RAGQueryRequest):
    """
    RAG Query Endpoint:
    Grounds queries in verified clinical guidelines and returns sources.
    """
    if not payload.query or len(payload.query.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query must contain at least 3 characters."
        )
    return rag_service.answer_query(payload.query.strip(), top_k=payload.top_k)

@router.post("/lab/interpret", response_model=schemas.LabInterpretationResponse)
def interpret_test(payload: schemas.LabInterpretationRequest):
    """
    Transparent laboratory result interpretation against reference intervals.
    """
    result = interpret_lab_result(
        test_name=payload.test_name,
        value=payload.value,
        unit=payload.unit,
        gender=payload.gender
    )
    return schemas.LabInterpretationResponse(**result)
