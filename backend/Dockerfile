FROM python:3.11-slim

# Install system dependencies for mariadb connector
RUN apt-get update && apt-get install -y \
    gcc \
    pkg-config \
    libmariadb-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency files first for better caching
COPY requirements.txt .

# Install dependencies using uv
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend directory
COPY . .

# Set Python path
ENV PYTHONPATH="/app:${PYTHONPATH}"

# Expose port
EXPOSE 8181

# Run the Python script directly (this will execute uvicorn.run())
CMD ["python", "main.py"]
