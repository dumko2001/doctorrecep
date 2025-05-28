#!/bin/bash

# Doctor Reception System - Python Backend Startup Script

echo "🐍 Starting Doctor Reception Python Backend..."
echo "📦 Installing dependencies..."

# Install Python dependencies
pip3 install -r requirements.txt

echo "🚀 Starting FastAPI server..."
echo "📊 Health check: http://localhost:3001/health"
echo "📚 API docs: http://localhost:3001/docs"

# Start the server
python3 main.py
