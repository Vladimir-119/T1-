from typing import List, Any, Optional

from fastapi import FastAPI
from pydantic import BaseModel

# импортируем твои функции из test2.py
from test2 import (
    generate_task,
    ask_for_help,
    review_code,
    evaluate_explanation,
    get_ai_hint,
    analyze_efficiency,
    ask_interview_questions,
    run_test_suite,
    check_and_run_code,
    generate_smart_questions,
    get_embedding,
    cosine_similarity,
    calculate_final_score,
)

app = FastAPI(title="AI Interview API")


# ---------- Pydantic-модели (то, что будет приходить с фронта) ----------

class GenerateTaskRequest(BaseModel):
    level: str            # "Junior" | "Middle" | "Senior"
    topic: str = "Алгоритмы"


class HelpRequest(BaseModel):
    task_title: str
    task_desc: str
    question: str         # что пишет пользователь (вопрос, код и т.п.)


class RunCodeRequest(BaseModel):
    code: str             # код пользователя целиком (с def solution(...))
    args: Optional[List[Any]] = None  # аргументы для функции (если нужны)


class RunTestsRequest(BaseModel):
    code: str
    tests: List[dict]     # то, что у тебя в task["public_tests"] / ["hidden_tests"]
    is_hidden_run: bool = False


class ReviewRequest(BaseModel):
    task: dict            # JSON задачи (минимум title, description)
    code: str             # код кандидата


class SoftSkillsRequest(BaseModel):
    explanation: str      # текст ответа кандидата "почему такой алгоритм"
    code_context: str     # кусок кода / контекст


class ComplexityRequest(BaseModel):
    code: str


class HintRequest(BaseModel):
    code: str
    error: str            # текст ошибки / traceback


class QuestionsRequest(BaseModel):
    code: str


class SmartQuestionsRequest(BaseModel):
    user_code: str
    ref_code: str


class FinalScoreRequest(BaseModel):
    test_ratio: float     # доля пройденных тестов: passed/total
    similarity: float     # сходство по эмбеддингам (0..1)
    complexity_ok: bool   # угадал ли пользователь сложность
    style_score: int      # 0..100 из review_code
    soft_score: int       # 0..100 из evaluate_explanation
    attempts: int         # сколько раз запускал тесты


# ---------- ЭНДПОИНТЫ ----------

@app.post("/tasks/generate")
def api_generate_task(req: GenerateTaskRequest):
    """
    Генерация новой задачи.
    Front: отправляет level/topic -> получает полный JSON задачи с тестами.
    """
    task = generate_task(req.level, req.topic)
    if task is None:
        return {"ok": False, "error": "Не удалось сгенерировать задачу"}
    return {"ok": True, "task": task}


@app.post("/tasks/help")
def api_help(req: HelpRequest):
    """
    Подсказка по задаче (Сократический помощник).
    """
    answer = ask_for_help(req.task_title, req.task_desc, req.question)
    return {"answer": answer}


@app.post("/code/run")
def api_run_code(req: RunCodeRequest):
    """
    Пробный запуск кода с произвольными аргументами.
    """
    test_args = req.args or []
    result = check_and_run_code(req.code, test_args)
    return result


@app.post("/code/test")
def api_run_tests(req: RunTestsRequest):
    """
    Запуск набора тестов (public / hidden).
    tests — это список объектов вида:
    { "input": [...], "expected": ... }
    """
    report = run_test_suite(req.code, req.tests, is_hidden_run=req.is_hidden_run)
    return report


@app.post("/code/review")
def api_review(req: ReviewRequest):
    """
    Code review: оценка стиля и качества.
    """
    result = review_code(req.task, req.code)
    # возвращаем как есть: {"score": int, "feedback": str}
    return result


@app.post("/code/soft-skills")
def api_soft(req: SoftSkillsRequest):
    """
    Оценка объяснения (софт-скиллы).
    """
    result = evaluate_explanation(req.explanation, req.code_context)
    # ожидаемый формат: {"clarity_score": ..., "technical_score": ..., "feedback": "..."}
    return result


@app.post("/code/complexity")
def api_complexity(req: ComplexityRequest):
    """
    Анализ асимптотики кода.
    """
    result = analyze_efficiency(req.code)
    return result  # {"time_complexity": "...", "space_complexity": "...", "explanation": "..."}


@app.post("/code/hint")
def api_hint(req: HintRequest):
    """
    Получить подсказку по коду и ошибке (PROMPT_MENTOR).
    """
    hint = get_ai_hint(req.code, req.error)
    return {"hint": hint}


@app.post("/code/interview-questions")
def api_interview_questions(req: QuestionsRequest):
    """
    Сгенерировать 2+ вопросы по коду (для живого интервью).
    """
    questions = ask_interview_questions(req.code)
    return {"questions": questions}


@app.post("/code/smart-questions")
def api_smart_questions(req: SmartQuestionsRequest):
    """
    Вопросы по отличиям от эталонного решения.
    Считаем similarity через эмбеддинги, передаём в generate_smart_questions.
    """
    v_user = get_embedding(req.user_code)
    v_ref = get_embedding(req.ref_code)
    sim = float(cosine_similarity(v_user, v_ref))

    text = generate_smart_questions(req.user_code, req.ref_code, sim)
    # тут text обычно строка с вопросами; фронт может её просто показать
    return {
        "similarity": sim,
        "questions_raw": text,
    }


@app.post("/score/final")
def api_final_score(req: FinalScoreRequest):
    """
    Подсчёт финального балла за задачу/интервью.
    """
    score = calculate_final_score(
        test_ratio=req.test_ratio,
        similarity=req.similarity,
        complexity_ok=req.complexity_ok,
        style_score=req.style_score,
        soft_score=req.soft_score,
        attempts=req.attempts,
    )
    return {"score": score}
