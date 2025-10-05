#!/bin/bash

# Installation script for Enterprise AI Development Platform

echo "🚀 Installing Enterprise AI Development Platform Dependencies..."
echo ""

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

echo "📦 Installing AI Provider SDKs..."
npm install openai @anthropic-ai/sdk @google/generative-ai

echo ""
echo "💳 Installing Payment Processing..."
npm install razorpay

echo ""
echo "🔄 Installing Real-Time Communication..."
npm install socket.io socket.io-client

echo ""
echo "⚡ Installing Code Execution..."
npm install @webcontainer/api

echo ""
echo "🛠️  Installing Development Dependencies..."
npm install -D @types/node

echo ""
echo "✅ All dependencies installed!"
echo ""
echo "📋 Next steps:"
echo "1. Configure environment variables in .env.local"
echo "2. Run database migrations: npx drizzle-kit push"
echo "3. Start development server: npm run dev"
echo ""
echo "📚 Check INSTALLATION.md for detailed setup instructions"
echo "🔧 Check TROUBLESHOOTING.md if you encounter issues"
