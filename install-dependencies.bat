@echo off
REM Installation script for Enterprise AI Development Platform (Windows)

echo 🚀 Installing Enterprise AI Development Platform Dependencies...
echo.

REM Check if npm is available
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed. Please install Node.js first.
    exit /b 1
)

echo 📦 Installing AI Provider SDKs...
call npm install openai @anthropic-ai/sdk @google/generative-ai

echo.
echo 💳 Installing Payment Processing...
call npm install razorpay

echo.
echo 🔄 Installing Real-Time Communication...
call npm install socket.io socket.io-client

echo.
echo ⚡ Installing Code Execution...
call npm install @webcontainer/api

echo.
echo 🛠️  Installing Development Dependencies...
call npm install -D @types/node

echo.
echo ✅ All dependencies installed!
echo.
echo 📋 Next steps:
echo 1. Configure environment variables in .env.local
echo 2. Run database migrations: npx drizzle-kit push
echo 3. Start development server: npm run dev
echo.
echo 📚 Check INSTALLATION.md for detailed setup instructions
echo 🔧 Check TROUBLESHOOTING.md if you encounter issues

pause
