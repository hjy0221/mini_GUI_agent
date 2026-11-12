# ✦ Mini-GUI-Agent: AI Engineering Dashboard

[日本語](README.ja.md) · [English](README.md) · [한국어](README.ko.md)

This is a project that allows you to manage and monitor AI agent loops based on **Claude** and **Google Gemini** through a modern and elegantly designed dashboard.

![Dashboard Preview](./public/dashboard-en.png)

## 🚀 Key Features

- **Dual-Model Support**: Supports both Anthropic Claude and Google Gemini. You can switch agent engines with one button.
- **Agent Intelligence**: Uses various tools (Function Calling) such as directory analysis, file reading/writing, and command execution to perform a given task.
- **Modern Dashboard UI**: You can understand the agent's workflow at a glance by visualizing thought process (Thought), tool execution (Tool Use), and result (Result) in real time.
- **Mock Mode Support**: Provides a scenario-based simulation mode that allows you to test how the agent behaves without an API key.
- **Metrics & Logging**: You can check the number of tool uses, status progress, and detailed execution logs in real time.

## 🛠️ Technology Stack

- **Frontend/Backend**: Next.js (App Router), React, TypeScript
- **Styling**: Vanilla CSS (Modern Aesthetics)
- **AI SDK**: @anthropic-ai/sdk, @google/generative-ai
- **Tools**: Zod, Zod-to-JSON-Schema

## 🔧 Toolbar (Agent Tools)

Agents perform complex engineering tasks using a combination of the following tools:
- `list_dir`: Check directory structure
- `read_file` / `write_file`: Read and write file contents
- `edit_file`: Modify specific parts of the file (including linter-based correction)
- `run_command`: Execute terminal command
- `search_code`: Search within the codebase
- `glob`: Pattern-based file exploration

## 🏁 Get started

### 1. Setting environment variables
Please set the following API keys in the `.env.local` file (or system host environment).

```bash
ANTHROPIC_API_KEY=your_anthropic_key
GEMINI_API_KEY=your_gemini_key
```

### 2. Package installation
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```
Afterwards, access `http://localhost:3000` and check the dashboard.

## 📁 Project Structure

- `app/`: Next.js page and layout (Dashboard UI)
- `src/agent/`: Agent loop and model-specific wrapper (Claude, Gemini, Mock)
- `src/executor/`: Tool execution and schema conversion (ToolExecutor)
- `src/tools/`: Individual tool implementation
- `lib/`: server-side agent runner
