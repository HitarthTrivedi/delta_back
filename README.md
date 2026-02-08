# 🎓 SkillPath: Powered by Google Gemini

> **"Your Personal AI Career Mentor."**
> *Built for the Gemini 3.0 Hackathon* 🚀

![Gemini Powered Badge](https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white) ![Hackathon Status](https://img.shields.io/badge/Status-Hackathon%20Ready-brightgreen?style=for-the-badge)

SkillPath leverages the **multimodal reasoning** and **structured output capabilities** of **Gemini 2.5 (Flash/Pro)** to solve a massive problem: student career confusion. We moved beyond static roadmaps to build a dynamic, context-aware AI mentor that evolves with the user.

---

## 💡 The Gemini Advantage
Why did we choose Gemini for this hackathon?

1.  **⚡ Blazing Speed (Flash 2.0)**: Our "Interactive Roadmap Assistant" requires near-instant responses to feel conversational. Gemini 2.0 Flash delivers the low latency needed for real-time mentorship.
2.  **🧩 Structured JSON Output**: SkillPath relies on complex, nested data structures (4-phase roadmaps with courses, projects, and internships). Gemini's ability to consistently return valid, schema-compliant JSON was critical for our backend stability.
3.  **🧠 Long Context Window**: The AI Mentor maintains context of the student's *entire* journey—past achievements, current frustrations, and future goals—without losing the thread, thanks to Gemini's massive context window.

---

## 🚀 What it does (Gemini-Powered Features)

SkillPath guides students from "Confusion" to "Career Ready" using 5 key AI flows:

### 1. 🧠 Deep Profile Analysis
*   **Input**: Raw student data (major, interests, unstructured goals).
*   **Gemini Action**: Analyzes the profile against millions of data points to identify **hidden strengths** and **critical skill gaps**.
*   **Output**: A personalized "SWOT analysis" for the student's career.

### 2. 🗺️ Dynamic Roadmap Generation
*   **The Challenge**: Creating a 12-month plan is complex. It needs to be logical, progressive, and feasible.
*   **Gemini Solution**: We prompt Gemini to act as an "Educational Strategist". It generates a valid JSON roadmap with:
    *   📚 **Curated Courses** (with rationale for *why* this specific course matters).
    *   💻 **Portfolio Projects** (tailored to prove specific skills).
    *   💼 **Internship Targets** (aligned with industry hiring cycles).

### 3. ✅ Context-Aware Encouragement
*   **The Problem**: Generic "Good job" messages are boring.
*   **Gemini Solution**: When a student completes a task, Gemini generates a unique, context-aware message referencing *exactly* what they finished and how it connects to their *ultimate* career goal.

### 4. 📄 Auto-Magic Professional Content
*   **Live Resume**: Gemini monitors completed tasks and automatically writes **professional, action-verb-driven resume bullets** (e.g., "Led a team of 3..." instead of "I did a project").
*   **LinkedIn Assistant**: Creating content is hard. Gemini drafts engaging LinkedIn posts about your recent achievements to help build your personal brand.

### 5. 💬 The "Roadmap Assistant" (Chat)
*   An always-available mentor that understands the *structure* of your roadmap.
*   **User**: "This month is too hard, I have exams."
*   **Gemini**: "Understood. I've adjusted the pace to 'Relaxed' and moved the complex project to next month. Focus on your exams!"

---

## ⚙️ How we built it

We built SkillPath with a clean, modern stack, putting Gemini at the core:

*   **AI Engine**: **Google Gemini 2.5 API** (`gemini-2.0-flash`)
    *   *Prompt Engineering*: We used "Chain of Thought" prompting to ensure Gemini explains its reasoning before generating the final JSON roadmap.
*   **Backend**: **Python Flask**
    *   Serves as the orchestrator, managing user state and dispatching complex tasks to Gemini.
*   **Database**: **SQLAlchemy** (SQLite)
    *   Stores the structured data that Gemini generates, allowing us to track progress over time.
*   **Frontend**: **Vanilla JavaScript/CSS**
    *   A fast, responsive UI that visualizes the complex JSON data returned by the AI.

## 🚧 Challenges we ran into
*   **JSON Hallucinations**: Early on, complex nested JSON would sometimes break. We solved this by using **Gemini's structured output mode** (or strict schema prompts) to enforce the JSON structure.
*   **Latency vs. Quality**: Balancing the depth of the roadmap (12 months detailed) with response time. We optimized by using `gemini-2.0-flash` for the interactive parts and `gemini-2.0-pro` (optional) for the deep initial analysis.

## 🏅 Accomplishments
*   **"It just works"**: The flow from "I finished a project" to "Here is a LinkedIn post about it" feels magical.
*   **Visualizing AI**: taking a raw JSON output from Gemini and turning it into a beautiful, interactive card-based UI.

## 🧠 What we learned
*   **Gemini is a Logic Engine**: It's not just for text. Using it to make *decisions* (like "should this student apply for internships now?") is powerful.
*   **Speed Matters**: The speed of Flash 2.0 changed the way we designed the UX—we could put AI in more places because it was instant.

---

## 🛠️ Installation & Setup

Want to run SkillPath locally?

### Prerequisites
- Python 3.8+
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/skillpath.git
cd skillpath/backend
pip install -r requirements.txt
```

### 2. Configure Gemini
Create a `.env` file in the `backend` folder:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Run
```bash
python app.py
```
Frontend runs at `http://localhost:8080` (or open `frontend/index.html`).

---

*Built with ❤️ using Google Gemini.*