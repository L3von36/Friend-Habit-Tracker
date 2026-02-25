# Loom

Loom is a modern, AI-powered personal CRM and relationship management web application. It is designed to help you nurture your relationships, track interactions, and gain meaningful psychological insights into your social life.

## ✨ Features

- **Dashboard & Stats**: Get a bird's-eye view of your social life with comprehensive statistics, category breakdowns, and sentiment analysis for your interactions.
- **Friend Profiles**: Maintain detailed profiles for your contacts, including traits, interests, milestones, and shared relationship goals.
- **Event Logging**: Log events (hangouts, calls, deep conversations) and tag them. Watch your relationship health score adapt over time.
- **Memories & Gratitude**: Keep a journal of standout moments and practice gratitude for your highest-value connections.
- **Interactive UI**: A sleek, fully featured responsive React frontend built with Vite, Tailwind CSS, and Shadcn UI components.

## 🧠 Advanced AI Superpowers

Loom features a completely decoupled, flexible **Hybrid AI System** that elevates your relationship management experience:

- **🔐 Privacy-First Local AI**: By default, the application uses an entirely browser-based, privacy-preserving semantic search model (Xenova Transformers / `all-MiniLM-L6-v2`) to provide offline intelligence.
- **⚡ Groq Llama 3.1 Integration**: Unlock cloud intelligence! Powered by Appwrite Functions, you can leverage the blazing-fast `llama-3.1-8b-instant` for deep insights and semantic search.
- **💡 Deep Insights**: Analyzes all logged interactions to generate highly actionable psychological advice (e.g., "Reconnect with Sarah," "Maintain Momentum").
- **✉️ Smart Drafts & Conversation Starters**: Dynamically synthesizes personalized icebreakers and exact phrasing suggestions tailored to your friend's personality archetype.
- **💬 Conversational AI Assistant**: An interactive chatbot wrapper around your data! Ask questions like, *"When did I last see Mark?"* or *"Who do I have the highest streak with?"* and get real-time answers.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

1. Clone the repository and navigate into the project folder.
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Copy `.env.example` to `.env`.
   ```bash
   cp .env.example .env
   ```
   *(Optional)* Add your `VITE_GROQ_API_KEY` to `.env`, or configure it safely within the app's Security Settings UI.

4. Start the development server:
   ```bash
   npm start
   ```
5. Open your browser and visit `http://localhost:3000`.

## 🛠️ Tech Stack

- **Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, PostCSS
- **Components**: Radix UI, Shadcn UI
- **Icons**: Lucide React
- **AI Processing**: Groq SDK (Cloud) & Xenova Transformers (Local Web Worker)
- **Data Format**: Internal state tracking with MCP context formatting standard.

## 🔒 Security & Privacy

Privacy is a core pillar. By default, **no data leaves your machine**. Semantic analysis is powered exclusively by a background Web Worker locally.

When you opt-in to advanced cloud intelligence via Groq, only the necessary anonymized context metrics are sent via TLS to securely generate deep insights or drafts. You can revoke this permission instantly through the application settings.

---

### Developed for Better Relationships 💙
