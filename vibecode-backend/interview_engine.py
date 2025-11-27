import json
import re
import traceback
import multiprocessing
import time
import sys
import io
import psutil
import random
from typing import List, Dict, Any
from openai import OpenAI

# --- КОНФИГУРАЦИЯ ---
# Замените на ваш API ключ или используйте os.getenv('OPENAI_API_KEY')
API_URL = "https://llm.t1v.scibox.tech/v1"
API_KEY = "sk-BWpbCDueGfRzWIW7MCmCaQ"

MODEL_TASK = "qwen3-coder-30b-a3b-instruct-fp8"
MODEL_CHAT = "qwen3-32b-awq"

TIME_LIMIT_SECONDS = 5.0
MEMORY_LIMIT_MB = 256.0


class ResourceLimitExceeded(Exception):
    pass


def clean_text(text: str) -> str:
    # Убираем служебные теги <think>...</think>
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    # Убираем markdown блоки кода
    text = text.replace("``````", "").strip()
    return text


def parse_json(content: str) -> Dict[str, Any]:
    clean = clean_text(content)
    # Пытаемся найти JSON объект { ... }
    match = re.search(r'\{.*\}', clean, re.DOTALL)
    try:
        if match:
            return json.loads(match.group(0))
        return json.loads(clean)
    except Exception:
        return {}


# --- SANDBOX WORKER ---
def _unsafe_test_runner(code: str, test_cases: List[Dict], result_queue: multiprocessing.Queue):
    import types

    capture = io.StringIO()
    original_stdout = sys.stdout
    sys.stdout = capture

    response = {
        "status": "ok",
        "passed": 0,
        "total": len(test_cases),
        "logs": [],
        "output": ""
    }

    try:
        # --- ИСПРАВЛЕНИЕ ИМПОРТОВ ---
        # Передаем __builtins__, чтобы работали import и встроенные функции
        safe_globals = {"__builtins__": __builtins__}
        local_scope = {}

        # Выполняем верхнеуровневый код (импорты, объявления функций)
        exec(code, safe_globals, local_scope)

        # Ищем функцию solution
        user_func = local_scope.get('solution')
        if not user_func:
            for v in local_scope.values():
                if isinstance(v, types.FunctionType):
                    user_func = v
                    break

        if not user_func:
            raise Exception("Функция solution(...) не найдена.")

        for i, test in enumerate(test_cases):
            # --- БЕЗОПАСНОЕ ПРИВЕДЕНИЕ К СТРОКЕ ---
            # AI может вернуть число 123 вместо "123", поэтому оборачиваем в str()
            inp_str = str(test.get("input", ""))
            exp_str = str(test.get("expected", ""))

            # Теперь replace сработает без ошибок
            safe_inp = inp_str.replace("null", "None").replace("true", "True").replace("false", "False")
            safe_exp = exp_str.replace("null", "None").replace("true", "True").replace("false", "False")

            try:
                args = eval(f"({safe_inp})")
                if not isinstance(args, tuple): args = (args,)
                expected = eval(safe_exp)

                actual = user_func(*args)

                if str(actual) == str(expected):
                    response["passed"] += 1
                else:
                    response["logs"].append(f"❌ Test {i + 1}: FAIL. Exp: {expected}, Got: {actual}")
            except Exception as e:
                response["logs"].append(f"⚠️ Test {i + 1}: Error {e}")

        response["output"] = capture.getvalue()

    except Exception as e:
        response["status"] = "error"
        response["traceback"] = traceback.format_exc()
    finally:
        sys.stdout = original_stdout
        result_queue.put(response)


# --- MAIN ENGINE CLASS ---
class InterviewEngine:
    def __init__(self):
        self.client = OpenAI(api_key=API_KEY, base_url=API_URL)

    def generate_task(self, level: str, topic: str) -> Dict[str, Any]:
        seed = random.randint(1, 10000)

        prompt = f"""You are a Senior Tech Interviewer. Generate a coding problem in STRICT JSON.
    RULES:
    1. Topic: {topic}. Difficulty: {level}.
    2. Tests: 2 public, 3 hidden.
    3. Reference Solution: Optimal Python code.
    4. Random Seed: {seed}.

    IMPORTANT: 
    - 'input' fields in tests MUST be valid Python arguments string (e.g. "[1, 2], 5" or "'hello'").
    - DO NOT write variable assignments like "s = 'abc'" in input. Just write "'abc'".

    JSON SCHEMA:
    {{
    "title": "Title",
    "description": "Markdown desc...",
    "initial_code": "def solution(arg1, arg2): pass",
    "public_tests": [{{"input": "1, 2", "expected": "3"}}],
    "hidden_tests": [{{"input": "5, 5", "expected": "10"}}]
    }}"""

        try:
            resp = self.client.chat.completions.create(
                model=MODEL_TASK,
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"Create a {level} problem about {topic}"}
                    ],
                max_tokens=1200,
                temperature=0.8
                )
            return parse_json(resp.choices[0].message.content)
        except Exception as e:
            print(f"Generate Task Error: {e}")
            return self.get_fallback_task()

    def get_fallback_task(self):
        # Если AI упал, возвращаем одну из готовых задач
        tasks = [
            {
                "title": "Palindrome Check",
                "description": "Check if a string is a palindrome (reads the same forwards and backwards).",
                "initial_code": "def solution(s):\n    return s == s[::-1]",
                "public_tests": [{"input": "'aba'", "expected": "True"}, {"input": "'abc'", "expected": "False"}],
                "hidden_tests": []
            },
            {
                "title": "Sum Array",
                "description": "Calculate sum of array elements.",
                "initial_code": "def solution(arr):\n    return sum(arr)",
                "public_tests": [{"input": "[1, 2, 3]", "expected": "6"}],
                "hidden_tests": []
            }
        ]
        return random.choice(tasks)

    def run_code_safely(self, code: str, test_cases: List[Dict]) -> Dict[str, Any]:
        queue = multiprocessing.Queue()
        process = multiprocessing.Process(target=_unsafe_test_runner, args=(code, test_cases, queue))

        process.start()
        pid = process.pid

        try:
            ps_proc = psutil.Process(pid)
        except:
            ps_proc = None

        start_time = time.time()

        try:
            while process.is_alive():
                if time.time() - start_time > TIME_LIMIT_SECONDS:
                    process.terminate()
                    process.join()
                    return {"status": "error", "traceback": "Time Limit Exceeded"}

                if ps_proc:
                    try:
                        mem = ps_proc.memory_info().rss / 1024 / 1024
                        if mem > MEMORY_LIMIT_MB:
                            process.terminate()
                            process.join()
                            return {"status": "error", "traceback": "Memory Limit Exceeded"}
                    except:
                        pass

                time.sleep(0.1)

            process.join()

            if not queue.empty():
                return queue.get()
            return {"status": "error", "traceback": "Process crashed unexpectedly"}

        except Exception as e:
            return {"status": "error", "traceback": str(e)}

    def chat_with_ai(self, message: str, task_desc: str, code: str) -> str:
        print(f"--- CHAT REQUEST ---\nUser: {message}\nTask: {task_desc[:50]}...")  # ЛОГ В КОНСОЛЬ СЕРВЕРА
        msg_upper = message.strip().upper()

        if "HELP" in msg_upper or "ПОМОГИТЕ" in msg_upper:
            sys_prompt = f"""You are a Socratic Mentor.
    User is stuck on task: "{task_desc}".
    User Code: {code}
    Question: "{message}"

    Give a helpful HINT (not a solution). Answer in Russian."""
        else:
            sys_prompt = f"""You are an AI Interviewer.
    User says: "{message}"
    Current Task: "{task_desc}"

    Answer politely as an organizer. Do not give hints unless they ask for HELP. Answer in Russian."""

        try:
            resp = self.client.chat.completions.create(
                model=MODEL_CHAT,
                messages=[{"role": "system", "content": sys_prompt}],
                temperature=0.7,
                timeout=45  # <-- Добавим таймаут, чтобы долго не висеть
            )
            reply = clean_text(resp.choices[0].message.content)
            print(f"AI Reply: {reply}")  # ЛОГ ОТВЕТА
            return reply
        except Exception as e:
            print(f"CHAT ERROR: {e}")  # ЛОГ ОШИБКИ
            return f"Извини, я задумался (Ошибка: {str(e)})"

    def analyze_solution(self, task: Dict, code: str, exec_res: Dict) -> Dict:
        ai_complexity = "O(?)"
        feedback = "Good job!"

        try:
            resp = self.client.chat.completions.create(
                model=MODEL_TASK,
                messages=[{"role": "user",
                           "content": f"Analyze complexity of this Python code:\n{code}\nOutput JSON: {{'time_complexity': '...', 'feedback': '...'}}"}],
                temperature=0.1
            )
            data = parse_json(resp.choices[0].message.content)
            ai_complexity = data.get("time_complexity", "Unknown")
            feedback = data.get("feedback", "Code looks okay.")
        except:
            pass

        return {
            "status": "ok",
            "result": "\n".join(exec_res["logs"]),
            "ai_complexity": ai_complexity,
            "review_feedback": feedback
        }
