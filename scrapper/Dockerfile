# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies for Playwright (do this early as it rarely changes)
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python packages (cached unless requirements.txt changes)
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers (cached unless requirements.txt changes)
RUN playwright install chromium

# Copy the rest of the application code (this layer changes frequently)
COPY . /app

# Make port 5000 available to the world outside this container
EXPOSE 5000

# Run FastAPI with uvicorn when the container launches
CMD ["uvicorn", "fastapi_main:app", "--host", "0.0.0.0", "--port", "5000"]
