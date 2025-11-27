import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
from interview_engine import InterviewEngine

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"],
                   allow_headers=["*"])

engine = InterviewEngine()


class TaskRequest(BaseModel):
    level: str = "Middle"
    topic: str = "Algorithms"


class RunCodeRequest(BaseModel):
    task: Dict[str, Any]
    code: str


class ChatRequest(BaseModel):
    message: str
    task_description: str
    code: str


@app.post("/generate-task")
async def generate_task(req: TaskRequest):
    return engine.generate_task(req.level, req.topic)


@app.post("/test-code")
async def test_code(req: RunCodeRequest):
    """
    КНОПКА СТАРТ: Просто прогоняем тесты, AI не смотрит.
    """
    all_tests = req.task.get("public_tests", [])  # Скрытые тесты не проверяем пока
    res = engine.run_code_safely(req.code, all_tests)
    return res


@app.post("/submit-run")
async def submit_run(req: RunCodeRequest):
    """
    КОМАНДА RUN: Финальная проверка + AI анализ.
    """
    all_tests = req.task.get("public_tests", []) + req.task.get("hidden_tests", [])
    exec_res = engine.run_code_safely(req.code, all_tests)

    if exec_res["status"] == "error" or exec_res["passed"] < exec_res["total"]:
        return {
            "status": "fail",
            "message": f"Тесты провалены: {exec_res['passed']}/{exec_res['total']}. Исправьте ошибки перед сдачей.",
            "logs": exec_res["logs"]
        }

    # Если тесты прошли -> запускаем AI
    ai_res = engine.analyze_solution(req.task, req.code, exec_res)
    return {"status": "success", "data": ai_res}


@app.post("/chat")
async def chat(req: ChatRequest):
    """
    ОБЫЧНЫЙ ЧАТ: Обработка HELP и вопросов.
    """
    # Важно: мы передаем code, чтобы AI видел контекст
    answer = engine.chat_with_ai(req.message, req.task_description, req.code)
    return {"text": answer}



if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
