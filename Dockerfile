FROM python:3.11-slim

WORKDIR /app

# Если есть requirements.txt в T1, скопируй его
# Или используй из vibecode-backend
COPY vibecode-backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем backend.py
COPY backend.py .

EXPOSE 8000

CMD ["uvicorn", "backend:app", "--host", "0.0.0.0", "--port", "8000"]
