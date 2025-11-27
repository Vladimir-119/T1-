# T1
Хакатон T1 | Москва

[vibecode_jam_mvp_architecture.md](https://github.com/user-attachments/files/23215675/vibecode_jam_mvp_architecture.md)# VibeCode Jam: собеседование будущего — MVP за 3 дня

## Архитектура (MVP)

### 1) Клиент (Web-приложение)
- Экран онбординга: имя, e-mail, язык/стек задач.
- Экран интервью:
  - чат с виртуальным интервьюером (WebSocket),
  - редактор кода (Monaco), запуск тестов, вывод логов,
  - таймеры/индикаторы (время на задачу, попытки),
  - предупреждения о копипасте/переключении вкладок.
- Экран результата: итоги, метрики, PDF-отчёт.

### 2) Backend-шлюз (API + оркестрация)
- REST + WebSocket (FastAPI/Node):
  - `POST /session/start`, `WS /chat/stream`, `GET /task/next`, `POST /submit`, `GET /report`.
- Оркестратор интервью: хранит состояние сессии, решает когда давать подсказку/следующую задачу.
- Интеграция с **LLM-сервисом** (виртуальный интервьюер + оценивание по рубрике, JSON Schema).
- Интеграция с **код-песочницей** (Judge0/Piston/Docker-runner): компиляция/тесты, лимиты по времени/памяти.
- Модуль адаптации задач: подбирает следующую задачу по тегам/сложности на основе результатов (простой эвристический бандит: easy→medium→hard).
- Античит (лайт):
  - доля вставок vs набор текста (из фронта),
  - события blur/focus,
  - сигналы “внезапный всплеск кода”,
  - проверка похожести решений (winnowing/шинглы по AST) по локальной базе.
- Генерация отчёта (PDF): итоговый скор, разбор по компетенциям, рекомендации.

### 3) Хранилища
- PostgreSQL (или Supabase): `Users`, `Sessions`, `ChatLogs`, `Tasks`, `Submissions`, `Metrics`, `Plagiarism`.
- Object Storage (Supabase/S3): артефакты (PDF, логи).
- Redis: очереди задач на прогон тестов, кеш контекста чата.

### 4) Данные/модели
- `Task{id, title, prompt, tags[algo, strings…], difficulty, tests}`
- `Session{id, user_id, status, current_task_id, score}`
- `Submission{id, session_id, task_id, lang, code, verdict, runtime, tests_passed}`
- `Metric{session_id, typing_ratio, paste_events, focus_loss, time_on_task}`

### 5) Поток (flow)
1. Кандидат стартует сессию → LLM приветствует, задаёт уточнение стека.
2. Оркестратор выдаёт задачу → фронт открывает редактор.
3. Кандидат жмёт “Запуск” → код уходит в песочницу → результаты и логи возвращаются.
4. LLM даёт обратную связь/наводящие вопросы; при успехе — следующая задача.
5. Финал → LLM формирует оценку по рубрике (структурированный JSON) → Backend собирает PDF-отчёт.

---

## Роли (3 человека)

### 1) ML/Conversational Engineer (Виртуальный интервьюер)
- Промпт-дизайн и цепочки (system + few-shot, функции/JSON Schema для оценок).
- Рубрики оценивания (алгоритмичность, корректность, сложность решения, коммуникация).
- Логика адаптации задач (эвристики + пороги переходов, A/B параметров).
- Лёгкая дообучаемая оценка качества кода (rule-based + LLM-критик) — по возможности.
- Античит: признаки, пороги, простая похожесть решений (шинглы/Levenshtein по нормализованному коду).

### 2) Backend/DevOps
- Поднять API (FastAPI/Node), WebSocket-стрим для чата.
- Интеграция с LLM API, очередями (Redis) и песочницей (Judge0/Piston/Docker runner).
- Схема БД, миграции, репозитории.
- Генерация PDF отчётов (WeasyPrint/Puppeteer).
- Логи/мониторинг, .env, деплой (Railway/Render/Docker Compose).
- Безопасность песочницы: лимиты CPU/MEM/FS, таймауты, изоляция сети.

### 3) Frontend/UX
- Next.js/React + Tailwind + shadcn/ui; экран интервью с Monaco Editor.
- Реал-тайм чат (WS), индикаторы тестов, прогресс.
- Трекер событий античита (paste, blur/focus, key cadence).
- Страница итогов + скачивание PDF, базовый лэндинг.
- Светлая/тёмная тема, адаптив.

---

## Что использовать (быстрый стек на 3 дня)
- **LLM**: OpenAI (GPT-4o mini) / Qwen / Groq-Llama через LangChain (любая доступная квота).
- **Песочница кода**:
  - Самый быстрый: **Judge0** (self-hosted или публичный endpoint) — поддержка множества языков, REST.
  - Альтернатива: **Piston** или свой Docker runner с предсобранными образами (python, node, cpp, java).
- **Backend**: FastAPI (Python) или NestJS (TS) + Redis + PostgreSQL (Supabase).
- **Frontend**: Next.js + React + Tailwind + shadcn/ui + Monaco Editor, Socket.IO/SSE для стрима.
- **Оценивание/структура ответов**: JSON Schema + function calling, Rubric prompting.
- **PDF-отчёты**: HTML-шаблон + WeasyPrint (Python) или Puppeteer (Node).
- **Античит**: фронт-события + простые эвристики на бэке; похожесть — AST + шинглы.
- **Хостинг**: Supabase (DB+storage+auth), Railway/Render/Docker-Compose для API и песочницы.
- **Мониторинг**: Sentry/Logtail, health-check эндпоинты.

---

## MVP-объём на 3 дня (реально успеть)
- 3–5 задач (easy/medium/hard) по 1–2 языкам (Python/JS) с автотестами.
- Диалоговый интервьюер: приветствие → уточнение → выдача задачи → 1–2 фоллоу-апа → финальная оценка.
- Запуск кода в песочнице, сбор метрик (время, тесты, попытки).
- Античит эвристический + предупреждения на фронте.
- PDF-отчёт: итоговый балл, сильные стороны/зоны роста, график метрик, лог чата.

