Here’s your **complete, polished README.md** tailored exactly to your project structure and tech stack 👇

---

# 🚀 LexAI – AI-Powered Legal Intelligence Platform

LexAI is a modern AI-powered web application that helps users **analyze, understand, generate, and interact with legal documents** effortlessly.

Built using **React, Groq (LLaMA 3), and Supabase**, LexAI simplifies complex legal workflows into an intuitive, fast, and user-friendly experience.

---

## ✨ Features

### 📄 Contract Analyzer

* Upload or paste contracts
* Get AI-powered:

  * Risk analysis
  * Clause breakdown
  * Obligations & responsibilities
  * Recommendations

---

### 💬 Document Q&A

* Chat with any legal document
* Ask questions in plain English
* Answers are strictly based on document content (RAG-based)

---

### ✍️ Contract Generator

Generate professional contracts instantly:

* NDA
* Freelance agreements
* Employment contracts
* SaaS agreements
* Rental & partnership contracts

---

### 🔀 Clause Comparator

* Compare two contract versions
* AI highlights:

  * Differences
  * Risk levels
  * Best version suggestion

---

### 📘 Jargon Translator

* Convert legal text into plain English
* Includes:

  * Key term explanations
  * Real-world examples
  * Warnings & risks
  * Bottom-line summary

---

### 🤖 AI Assistant Chatbot

* Context-aware chatbot
* Helps with:

  * Legal questions (informational only)
  * App navigation
  * Feature guidance

---

## 🛠️ Tech Stack

### Frontend

* React (Vite)
* Framer Motion (animations)
* Tailwind CSS
* Lucide Icons
* React Router

### Backend / AI

* Groq API (LLaMA 3.3 70B)
* Retrieval-Augmented Generation (RAG)

### Authentication & Database

* Supabase

---

## 📁 Project Structure

```id="lexai-structure"
src/
│
├── components/
│   ├── ChatBot.jsx
│   ├── ProtectedRoute.jsx
│   ├── Sidebar.jsx
│
├── context/
│   └── AuthContext.jsx
│
├── pages/
│   ├── ClauseComparator.jsx
│   ├── ContractAnalyzer.jsx
│   ├── ContractGenerator.jsx
│   ├── Dashboard.jsx
│   ├── DocumentQA.jsx
│   ├── JargonTranslator.jsx
│   ├── Landing.jsx
│   ├── Login.jsx
│   ├── Signup.jsx
│
├── App.jsx
├── main.jsx
├── App.css
├── index.css
```

---

## ⚙️ Setup & Installation

### 1. Clone the Repository

```bash id="clone"
git clone https://github.com/your-username/lexai.git
cd lexai
```

---

### 2. Install Dependencies

```bash id="install"
npm install
```

---

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env id="env"
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
```

---

### 4. Run the App

```bash id="run"
npm run dev
```

App will run at:

```id="url"
http://localhost:5173
```

---

## 🔐 Environment Variables Explained

| Variable                 | Description                        |
| ------------------------ | ---------------------------------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL          |
| `VITE_SUPABASE_ANON_KEY` | Public anon key for authentication |
| `VITE_GROQ_API_KEY`      | API key for Groq AI                |

---

## 📌 Where to Get Keys

### Supabase

1. Go to your project dashboard
2. Navigate to **Settings → API**
3. Copy:

   * Project URL
   * Anon Public Key

---

### Groq

1. Visit: [https://console.groq.com](https://console.groq.com)
2. Generate API key
3. Add to `.env`

---

## 🔒 Security Notes

* Never commit `.env` to GitHub
* Ensure `.env` is in `.gitignore`

```id="gitignore"
.env
```

---

## 🎯 Usage Flow

1. Sign up / Log in
2. Choose a tool:

   * Analyzer
   * Q&A
   * Generator
   * Comparator
   * Translator
3. Upload or paste document
4. Get AI-powered insights instantly

---

## ⚠️ Disclaimer

LexAI is **not a law firm** and does not provide legal advice.
All outputs are for **informational purposes only**.
Always consult a qualified attorney for legal decisions.

---

## 🌟 Future Enhancements

* 📄 PDF parsing improvements
* 📊 Export reports (PDF/Docx)
* 👥 Team collaboration
* 🌐 API access
* 📚 Multi-document chat

---

## 🧑‍💻 Author

**Anish Fathima**

---

## 📜 License

This project is licensed under the **MIT License**.

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!

---

If you want next-level README (like top GitHub projects), I can:

* Add badges (build, license, tech stack)
* Add screenshots section
* Add deployment guide (Vercel)

Just tell 👍
