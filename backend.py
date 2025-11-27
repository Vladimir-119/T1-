import os
import re
import json
import uuid
import time
import types
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
from openai import OpenAI

# --- CONFIG ---
API_URL = "https://llm.t1v.scibox.tech/v1"
API_KEY = "sk-BWpbCDueGfRzWIW7MCmCaQ"

MODEL_TASK = "qwen3-coder-30b-a3b-instruct-fp8"
MODEL_CHAT = "qwen3-32b-awq"

client = OpenAI(api_key=API_KEY, base_url=API_URL)

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"],
                   allow_headers=["*"])

sessions = {}


# --- MODELS ---
class StartRequest(BaseModel):
    level: str = "Middle"
    topic: str = "Algorithms"


class RunCodeRequest(BaseModel):
    session_id: str
    code: str
    type: str = "public"


class HelpRequest(BaseModel):
    session_id: str
    question: str


class SubmitRoundRequest(BaseModel):
    session_id: str
    code: str
    anti_cheat_stats: dict = {}


# --- UTILS ---
def clean_text(s):
    s = re.sub(r'<think>.*?</think>', '', s, flags=re.DOTALL)
    return s.replace("``````", "").strip()


def parse_json(content):
    clean = clean_text(content)
    match = re.search(r'\{.*\}', clean, re.DOTALL)
    try:
        return json.loads(match.group(0)) if match else json.loads(clean)
    except:
        return {}


def get_embedding(text):
    try:
        resp = client.embeddings.create(model="text-embedding-3-small", input=text)
        return np.array(resp.data[0].embedding)
    except:
        return None


def cosine_similarity(a, b):
    if a is None or b is None: return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


# --- AI FUNCS ---
PROMPT_GENERATOR = """Вы — Старший Технический Архитектор Интервью. Сгенерируйте задачу по программированию в строгом формате JSON.

ПРАВИЛА:
1. Тема/Сложность: следуйте запросу пользователя.
2. Эталонное решение: предоставьте оптимальное решение.
3. Тесты: public_tests (2 простых), hidden_tests (3 граничных случая).

ВАЖНЫЕ ЯЗЫКОВЫЕ ПРАВИЛА:
- Ключи JSON на английском (например, "title").
- Содержимое полей "title" и "description" на РУССКОМ языке.
- Переменные в коде на английском.

JSON СХЕМА:
{
  "title": "(RU название)",
  "description": "(Markdown описание на RU...)",
  "difficulty": "Middle",
  "initial_code": "def solution(nums: List[int]) -> int:\\n    pass",
  "reference_solution": "def solution(...):\\n    ...",
  "public_tests": [{"input": "...", "expected": "..."}],
  "hidden_tests": [{"input": "...", "expected": "..."}]
}"""


def generate_task_ai(level, topic):
    try:
        resp = client.chat.completions.create(
            model=MODEL_TASK,
            messages=[
                {"role": "system", "content": PROMPT_GENERATOR},
                {"role": "user", "content": f"Создай задачу уровня {level} по теме {topic}"}
            ],
            temperature=0.9,
            max_tokens=1500
        )
        return parse_json(resp.choices[0].message.content)
    except:
        return None


def ask_help_ai(task_title, task_desc, question):
    sys = f"""ВАЖНО: Вы — Сократический Ментор.
Задача: {task_title}
Описание: {task_desc}
Вопрос пользователя: {question}

ПРАВИЛА:
1. Отвечайте на РУССКОМ языке.
2. Давайте ПОДСКАЗКУ, НЕ пишите готовое решение.
3. Будьте кратким."""
    try:
        resp = client.chat.completions.create(model=MODEL_CHAT, messages=[{"role": "user", "content": sys}],
                                              max_tokens=500, temperature=0.6)
        return clean_text(resp.choices[0].message.content)
    except:
        return "AI не доступен."


def check_ai_generated(code):
    sys = f"""Проверьте, был ли этот код сгенерирован AI (ChatGPT, Copilot и т.д.).

Код:
{code}

Верните JSON:
{{
  "is_ai_generated": true/false,
  "confidence_score": 0-100,
  "reason": "Объяснение на русском"
}}"""
    try:
        resp = client.chat.completions.create(model=MODEL_TASK, messages=[{"role": "user", "content": sys}],
                                              temperature=0.1)
        return parse_json(resp.choices[0].message.content)
    except:
        return {"is_ai_generated": False, "confidence_score": 0}


def review_code_ai(task, code):
    sys = """Вы — Главный Инженер. Проведите Code Review.

Верните JSON:
{
  "score": 0-100,
  "feedback": "Конструктивный фидбек на РУССКОМ языке"
}"""
    user = f"Задача: {task.get('title')}\n\nКод:\n{code}"
    try:
        resp = client.chat.completions.create(model=MODEL_TASK, messages=[{"role": "system", "content": sys},
                                                                          {"role": "user", "content": user}],
                                              temperature=0.2)
        return parse_json(resp.choices[0].message.content)
    except:
        return {"score": 70, "feedback": "Ошибка оценки"}


def analyze_efficiency_ai(code):
    sys = f"""Проанализируйте временную сложность алгоритма.

Код:
{code}

Верните JSON:
{{
  "time_complexity": "O(...)",
  "explanation": "Объяснение на русском"
}}"""
    try:
        resp = client.chat.completions.create(model=MODEL_TASK, messages=[{"role": "user", "content": sys}],
                                              temperature=0.1)
        return parse_json(resp.choices[0].message.content)
    except:
        return {"time_complexity": "Unknown", "explanation": ""}


def evaluate_explanation_ai(explanation, code):
    sys = f"""Вы — HR Tech Lead. Оцените качество объяснения кандидата.

Код:
{code}

Объяснение кандидата:
{explanation}

Верните JSON:
{{
  "clarity_score": 0-10,
  "technical_score": 0-10,
  "feedback": "Комментарий на русском"
}}"""
    try:
        resp = client.chat.completions.create(model=MODEL_TASK, messages=[{"role": "user", "content": sys}],
                                              temperature=0.3)
        return parse_json(resp.choices[0].message.content)
    except:
        return {"clarity_score": 5, "technical_score": 5, "feedback": "OK"}


def generate_smart_questions_ai(user_code, ref_code, sim):
    sys = f"""Сравните код пользователя с эталонным решением.
Схожесть: {sim:.0%}

Код пользователя:
{user_code}

Эталонное решение:
{ref_code}

Сгенерируйте 2 уточняющих вопроса на РУССКОМ языке для проверки понимания."""
    try:
        resp = client.chat.completions.create(model=MODEL_TASK, messages=[{"role": "user", "content": sys}],
                                              temperature=0.6)
        return clean_text(resp.choices[0].message.content)
    except:
        return "Вопросы не сгенерированы."


def respond_to_candidate_ai(q, a):
    sys = f"""Вы — AI Интервьюер. Дайте короткую реакцию на ответ кандидата.

Вопрос: {q}
Ответ кандидата: {a}

Дайте короткий фидбек/реакцию на РУССКОМ языке."""
    try:
        resp = client.chat.completions.create(model=MODEL_CHAT, messages=[{"role": "user", "content": sys}],
                                              temperature=0.5)
        return clean_text(resp.choices[0].message.content)
    except:
        return "Хорошо."


# --- CODE EXEC ---
def run_test_suite(code, test_cases):
    passed = 0
    logs = []
    try:
        safe_globals = {"__builtins__": __builtins__}
        local_scope = {}
        exec(code, safe_globals, local_scope)

        user_func = local_scope.get('solution')
        if not user_func:
            for v in local_scope.values():
                if isinstance(v, types.FunctionType):
                    user_func = v
                    break
        if not user_func:
            raise Exception("Функция solution не найдена")

        for i, t in enumerate(test_cases):
            try:
                inp = str(t["input"]).replace("null", "None").replace("true", "True").replace("false", "False")
                args = eval(f"({inp})")
                if not isinstance(args, tuple): args = (args,)
                exp_str = str(t["expected"]).replace("null", "None").replace("true", "True").replace("false", "False")
                expected = eval(exp_str)

                start = time.perf_counter()
                actual = user_func(*args)
                dur = (time.perf_counter() - start) * 1000

                if str(actual) == str(expected):
                    passed += 1
                    logs.append(f"✅ Тест {i + 1}: OK ({dur:.2f}ms)")
                else:
                    logs.append(f"❌ Тест {i + 1}: FAIL. Ожидалось: {expected}, Получено: {actual}")
            except Exception as e:
                logs.append(f"⚠️ Тест {i + 1}: Ошибка {e}")

        return {"status": "success", "passed": passed, "total": len(test_cases), "logs": logs}
    except Exception as e:
        return {"status": "error", "traceback": str(e), "logs": [str(e)]}


# --- API ENDPOINTS ---
@app.post("/api/start")
def start_session(req: StartRequest):
    sid = str(uuid.uuid4())
    sessions[sid] = {"level": req.level, "topic": req.topic, "history": [], "current_task": None, "attempts": 0,
                     "valid_code": ""}
    return {"session_id": sid, "message": "Сессия создана"}


@app.get("/api/task/next")
def get_next_task(session_id: str):
    if session_id not in sessions: raise HTTPException(404)
    sess = sessions[session_id]
    task = generate_task_ai(sess["level"], sess["topic"])
    if not task: raise HTTPException(500, "Ошибка генерации задачи")
    sess["current_task"] = task
    sess["attempts"] = 0
    sess["valid_code"] = ""
    return {
        "title": task["title"],
        "description": task["description"],
        "initial_code": task.get("initial_code", ""),
        "public_tests": task.get("public_tests", []),
        "reference_solution": task.get("reference_solution", "")
    }


@app.post("/api/code/run")
def run_code_endpoint(req: RunCodeRequest):
    if req.session_id not in sessions: raise HTTPException(404)
    sess = sessions[req.session_id]
    task = sess["current_task"]
    tests = task["public_tests"] if req.type == "public" else task.get("hidden_tests", [])
    result = run_test_suite(req.code, tests)
    if req.type == "public": sess["attempts"] += 1
    if result["passed"] == result["total"] and result["total"] > 0:
        sess["valid_code"] = req.code
    return result


@app.post("/api/help")
def get_hint_endpoint(req: HelpRequest):
    if req.session_id not in sessions: raise HTTPException(404)
    sess = sessions[req.session_id]
    task = sess["current_task"]
    hint = ask_help_ai(task["title"], task["description"], req.question)
    return {"hint": hint}


@app.post("/api/complexity/check")
def check_complexity_endpoint(req: dict):
    code = req.get("code", "")
    user_estimate = req.get("user_estimate", "")
    ai_analysis = analyze_efficiency_ai(code)
    real_complexity = ai_analysis.get('time_complexity', 'Unknown')
    explanation = ai_analysis.get('explanation', '')
    is_correct = user_estimate.lower().replace(" ", "") == real_complexity.lower().replace(" ", "")
    return {"is_correct": is_correct, "real_complexity": real_complexity, "explanation": explanation}


@app.post("/api/soft-skills/evaluate")
def evaluate_soft_skills_endpoint(req: dict):
    code = req.get("code", "")
    explanation = req.get("explanation", "")
    result = evaluate_explanation_ai(explanation, code)
    comm_score = (result.get('clarity_score', 0) + result.get('technical_score', 0)) * 5
    return {"comm_score": comm_score, "feedback": result.get('feedback', '')}


@app.post("/api/interview/question")
def ask_interview_question(req: dict):
    code = req.get("code", "")
    ref_code = req.get("reference_solution", "")
    similarity = 0.0
    if ref_code:
        user_vec = get_embedding(code)
        ref_vec = get_embedding(ref_code)
        similarity = cosine_similarity(user_vec, ref_vec)
    questions_text = generate_smart_questions_ai(code, ref_code, similarity)
    questions = [q.strip() for q in questions_text.split('\n') if "?" in q]
    return {"questions": questions[:2], "similarity": similarity}


@app.post("/api/interview/respond")
def respond_to_answer(req: dict):
    question = req.get("question", "")
    answer = req.get("answer", "")
    reaction = respond_to_candidate_ai(question, answer)
    return {"reaction": reaction}


@app.post("/api/round/submit")
def submit_round_endpoint(req: SubmitRoundRequest):
    if req.session_id not in sessions: raise HTTPException(404)
    sess = sessions[req.session_id]
    task = sess["current_task"]
    code = req.code

    # 1. Code Review
    review = review_code_ai(task, code)
    score = review.get("score", 0)

    # 2. AI Detector
    ai_check = check_ai_generated(code)
    is_ai_generated = ai_check.get("is_ai_generated", False)
    confidence = ai_check.get("confidence_score", 0)
    penalty_ai = 50 if is_ai_generated and confidence > 80 else 0

    # 3. Anti-Cheat
    stats = req.anti_cheat_stats or {}
    blur_count = stats.get("blurCount", 0)
    copy_count = stats.get("copyCount", 0)
    paste_count = stats.get("editorPasteCount", 0)

    penalty_anticheat = blur_count * 3 + copy_count * 5 + paste_count * 10

    # 4. Similarity (ОБЯЗАТЕЛЬНО!)
    sim = 0.0
    smart_questions = ""
    ref_solution = task.get("reference_solution", "")

    if ref_solution:  # <-- ВАЖНАЯ ПРОВЕРКА
        try:
            user_vec = get_embedding(code)
            ref_vec = get_embedding(ref_solution)
            if user_vec is not None and ref_vec is not None:
                sim = cosine_similarity(user_vec, ref_vec)
                smart_questions = generate_smart_questions_ai(code, ref_solution, sim)
        except Exception as e:
            print(f"Similarity error: {e}")
            sim = 0.0
    else:
        print("⚠️ WARNING: No reference_solution in task!")

    # 5. Final Score
    final_score = int(score * 0.6 + sim * 40)
    final_score = max(0, final_score - penalty_ai - penalty_anticheat - (sess["attempts"] * 2))

    # 6. Level Update
    prev_level = sess["level"]
    if final_score > 80:
        if prev_level == "Junior":
            sess["level"] = "Middle"
        elif prev_level == "Middle":
            sess["level"] = "Senior"
    elif final_score < 40:
        if prev_level == "Senior":
            sess["level"] = "Middle"
        elif prev_level == "Middle":
            sess["level"] = "Junior"

    report = {
        "final_score": final_score,
        "level_update": f"{prev_level} -> {sess['level']}",
        "review": review,
        "similarity": sim,  # <-- ОБЯЗАТЕЛЬНО ОТДАЕМ
        "ai_cheat_detected": penalty_ai > 0,
        "ai_check": ai_check,  # <-- ДЕТАЛИ AI DETECTOR
        "anti_cheat_violations": {
            "blur": blur_count,
            "copy": copy_count,
            "paste": paste_count,
            "total_penalty": penalty_anticheat
        },
        "smart_questions": smart_questions.split("\n") if smart_questions else []
    }

    sess["history"].append({"task": task["title"], "score": final_score, "report": report})
    return report


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
