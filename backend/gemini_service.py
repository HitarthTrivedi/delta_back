from google import genai
import json
import os
from typing import Dict, List, Optional

class GeminiService:
    """
    Orchestrates all interactions with Gemini 2.5 API
    """

    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.model_name = 'gemini-2.0-flash'

        # Generation configuration
        self.generation_config = {
            "temperature": 0.7,
            "top_p": 0.9,
            "max_output_tokens": 8192,
        }

    def analyze_student_profile(self, profile_data: Dict) -> Dict:
        """
        Analyze student profile and provide insights
        """
        prompt = f"""
You are an expert career advisor analyzing a student's profile.

Student Information:
- Major: {profile_data.get('major', 'Not specified')}
- University: {profile_data.get('university', 'Not specified')}
- GPa: {profile_data.get('gpa', 'Not specified')}
- Experience Level: {profile_data.get('experience_level', 'Not specified')}
- Career Aspirations: {profile_data.get('career_aspirations', 'Not specified')}
- Target Industries: {', '.join(profile_data.get('target_industries', []))}
- Current Skills: {', '.join(profile_data.get('current_skills', []))}
- Preferred Learning Style: {profile_data.get('preferred_learning', 'Not specified')}
- Preferred Content Types: {', '.join(profile_data.get('preferred_content_types', []))}
- Time Commitment: {profile_data.get('time_commitment', 'Not specified')}
- Relocation Goal: {profile_data.get('relocation_goal', 'None')}
- Extracurricular Interests: {', '.join(profile_data.get('extracurricular_interests', []))}
- Planning Horizon: {profile_data.get('planning_horizon_years', 1)} Years

Task: Analyze this profile and provide:
1. Key strengths (2-3 points)
2. Skill gaps to address (2-3 points)
3. Recommended career paths (top 3, ordered from most specific to broad)
4. Learning approach optimization tips (2-3 actionable tips)
5. Advice on relocation and extracurricular balance (if applicable)

Format your response as JSON with keys: "strengths", "gaps", "career_paths", "learning_tips"
Each value should be an array of strings.

Return ONLY valid JSON, no additional text.
"""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=self.generation_config
            )

            # Extract JSON from response
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]

            result = json.loads(response_text.strip())
            return result

        except Exception as e:
            print(f"Error in analyze_student_profile: {e}")
            return {
                "strengths": ["Motivated to learn", "Clear career direction"],
                "gaps": ["Need more hands-on experience"],
                "career_paths": ["Technology Professional", "Industry Specialist", "General Professional"],
                "learning_tips": ["Start with foundational courses", "Build portfolio projects"]
            }

    def generate_growth_path(self, profile_data: Dict, analysis: Dict, timeline_months: int = 12, start_month: int = 1) -> Dict:
        """
        Generate comprehensive phased growth path with MONTHLY phases
        """
        trend_data = self._get_simulated_trends(profile_data.get('career_aspirations', ''))
        target_role = analysis.get('career_paths', ['Professional'])[0]
        skill_gaps = ', '.join(analysis.get('gaps', []))
        end_month = start_month + timeline_months - 1
        
        prompt = f"""
You are an expert educational and career strategist creating a personalized growth roadmap with MONTHLY phases.

Student Profile:
- Major: {profile_data.get('major')}
- University: {profile_data.get('university')}
- Target Role: {target_role}
- Target Industries: {', '.join(profile_data.get('target_industries', []))}
- Experience Level: {profile_data.get('experience_level')}
- Current Skills: {', '.join(profile_data.get('current_skills', []))}
- Skill Gaps: {skill_gaps}
- Time Commitment: {profile_data.get('time_commitment')}
- Content Preference: {', '.join(profile_data.get('preferred_content_types', []))}
- Relocation Goal: {profile_data.get('relocation_goal', 'None')}
- Extracurricular Interests: {', '.join(profile_data.get('extracurricular_interests', []))}

Current Industry Trends:
{trend_data}

Task: Generate a detailed, phased growth plan from Month {start_month} to Month {end_month}.

For each MONTH, provide 3-5 achievable tasks with a good mix of:
1. **Courses**: 1-2 specific online courses per month
2. **Projects**: 1 practical project per 2-3 months
3. **Tests/Certifications**: Spread across the timeline appropriately
4. **Internships**: Target application periods (usually 1-2 per year)

Guidelines:
- **Professional Tone**: Use concise, professional language. Do NOT use emojis.
- **Monthly Granularity**: Each phase represents exactly 1 MONTH.
- **Progressive Difficulty**: Start with fundamentals, build to advanced topics.
- **Achievable Workload**: 3-5 tasks per month max, considering time commitment.
- **Long-term View**: If relocation is a goal, include language/visa prep early.

Format as JSON with this EXACT structure:
{{
  "phases": [
    {{
      "phase": {start_month},
      "title": "Month {start_month}: [Theme Name]",
      "focus": "Main focus of this month",
      "courses": [
        {{
          "id": "c1_m{start_month}",
          "name": "Course Name",
          "platform": "Platform Name",
          "duration": "X weeks",
          "rationale": "Why this course"
        }}
      ],
      "tests": [],
      "internships": [],
      "certificates": [],
      "projects": [
        {{
          "id": "p1_m{start_month}",
          "name": "Project Name",
          "description": "Project description",
          "skills_demonstrated": ["skill1", "skill2"],
          "rationale": "Why this project"
        }}
      ]
    }}
  ]
}}

IMPORTANT: Generate exactly {timeline_months} phases, starting from Month {start_month}.
Each phase number MUST correspond to the actual month number (e.g., {start_month}, {start_month+1}, ...).
Ensure IDs are unique by including the month number (e.g., _m{start_month}).

Return ONLY valid JSON, no additional text or markdown.
"""
        try:
            print(f"DEBUG: calling model {self.model_name}")
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            print("DEBUG: got response")
            text = response.text.replace('```json', '').replace('```', '').strip()
            return json.loads(text)
        except Exception as e:
            print(f"Error generating growth path: {e}")
            return {"phases": []}

    def generate_encouragement(self, completed_item: Dict, user_context: Dict) -> str:
        """
        Generate personalized encouragement message
        """
        prompt = f"""
A student just completed: {completed_item.get('item_name')} ({completed_item.get('item_type')})

Student's journey so far:
- Completed items: {user_context.get('completed_count', 0)}
- Current phase: {user_context.get('current_phase', 1)}
- Career goal: {user_context.get('career_goal', 'Professional development')}

Generate a brief, encouraging message (2-3 sentences) that:
1. Acknowledges their specific achievement
2. Connects it to their career goal
3. Motivates next steps

Keep it genuine, specific, and professional. Do NOT use emojis.
Return only the message text, nothing else.
"""
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config={"temperature": 0.8, "max_output_tokens": 200}
            )
            return response.text.strip()
        except Exception as e:
            print(f"Error in generate_encouragement: {e}")
            return f"Great work completing {completed_item.get('item_name')}! You're making excellent progress toward your goals."

    def generate_resume_bullets(self, item_data: Dict) -> List[str]:
        """
        Generate professional resume bullet points
        """
        prompt = f"""
Generate professional resume bullet points for:

Type: {item_data.get('item_type')}
Title: {item_data.get('title')}
Description: {item_data.get('description', 'Not provided')}
Skills Used: {', '.join(item_data.get('skills', []))}
Target Role: {item_data.get('target_role', 'Professional')}

Guidelines:
- Start with strong action verbs (Developed, Implemented, Designed, Led, etc.)
- Include quantifiable metrics where possible
- Highlight technical skills and tools
- Show impact and results
- 2-3 bullet points
- Each bullet: 1-2 lines maximum
- Professional tone only. Do NOT use emojis.

Format as JSON array:
{{"bullets": ["bullet 1", "bullet 2", "bullet 3"]}}

Return ONLY valid JSON, no additional text.
"""
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config={"temperature": 0.7, "max_output_tokens": 500}
            )
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]

            result = json.loads(response_text.strip())
            return result.get('bullets', [])
        except Exception as e:
            print(f"Error in generate_resume_bullets: {e}")
            return [
                f"Completed {item_data.get('title')} demonstrating proficiency in {', '.join(item_data.get('skills', ['various skills']))}",
                f"Applied technical knowledge to solve real-world problems in {item_data.get('item_type')} context"
            ]

    def generate_linkedin_content(self, user_context: Dict) -> Dict:
        """
        Generate LinkedIn post ideas and profile updates
        """
        prompt = f"""
Generate LinkedIn content suggestions for a student with:

Profile:
- Recent achievements: {', '.join(user_context.get('recent_achievements', []))}
- New skills: {', '.join(user_context.get('new_skills', []))}
- Career goal: {user_context.get('career_goal', 'Professional development')}
- Current phase: {user_context.get('current_phase', 'Learning')}

Generate:
1. **Post Ideas**: 3 LinkedIn post ideas that showcase their learning journey and achievements
2. **Profile Summary**: A 2-3 sentence professional summary highlighting their skills and aspirations
3. **Skills to Add**: 5-7 skills they should add to their LinkedIn profile

Guidelines:
- Professional, industry-appropriate tone.
- Do NOT use emojis.

Format as JSON:
{{
  "post_ideas": [
    {{"topic": "...", "draft": "...", "hashtags": ["..."]}},
    ...
  ],
  "profile_summary": "...",
  "skills_to_add": ["skill1", "skill2", ...]
}}

Return ONLY valid JSON, no additional text.
"""
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config={"temperature": 0.8, "max_output_tokens": 1000}
            )
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]

            result = json.loads(response_text.strip())
            return result
        except Exception as e:
            print(f"Error in generate_linkedin_content: {e}")
            return {
                "post_ideas": [
                    {
                        "topic": "Learning Journey",
                        "draft": f"Excited to share my progress in {user_context.get('career_goal', 'my career development')}!",
                        "hashtags": ["learning", "growth", "career"]
                    }
                ],
                "profile_summary": f"Aspiring professional focused on {user_context.get('career_goal', 'continuous learning')} with hands-on experience in recent projects.",
                "skills_to_add": user_context.get('new_skills', ["Problem Solving", "Project Management"])
            }

    def generate_task_linkedin_post(self, task_data: Dict, user_context: Dict) -> Dict:
        """
        Generate a professional LinkedIn post for a specific completed task
        """
        prompt = f"""
Generate a professional LinkedIn post for someone who just completed:

Task: {task_data.get('item_name')}
Type: {task_data.get('item_type')}
Description: {task_data.get('notes', 'N/A')}

About the person:
- Career Goal: {user_context.get('career_goal', 'Professional development')}
- Skills: {', '.join(user_context.get('new_skills', []))}
- Recent Achievements: {', '.join(user_context.get('recent_achievements', []))}

Generate a compelling, professional LinkedIn post that:
1. Celebrates the achievement authentically (not boastful)
2. Shares key learnings or insights
3. Connects it to their career journey
4. Ends with a call-to-action or question to encourage engagement
5. Is 150-250 words
6. Includes 3-5 relevant hashtags
7. Do NOT use emojis.

Format as JSON:
{{
  "post_content": "The full post text...",
  "hashtags": ["hashtag1", "hashtag2"],
  "suggested_image": "Description of an image that would complement this post"
}}

Return ONLY valid JSON, no additional text.
"""
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config={"temperature": 0.8, "max_output_tokens": 800}
            )
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]

            result = json.loads(response_text.strip())
            return result
        except Exception as e:
            print(f"Error in generate_task_linkedin_post: {e}")
            return {
                "post_content": f"Excited to share that I've completed {task_data.get('item_name')}! This is another step forward in my journey toward {user_context.get('career_goal', 'my career goals')}. The learning never stops!",
                "hashtags": ["learning", "growth", "career", "milestone"],
                "suggested_image": "A professional achievement or learning-related image"
            }

    def _get_simulated_trends(self, career_field: str) -> str:
        """
        Generate simulated industry trends
        """
        return """
Current Industry Trends (2025-2026):
- AI and Machine Learning integration across all sectors
- Cloud computing and distributed systems dominance
- Data privacy and cybersecurity critical importance
- Remote work and digital collaboration tools
- Sustainability and green technology focus
- API-first and microservices architectures
- Low-code/no-code platforms emergence
"""

    def _get_fallback_roadmap(self, target_role: str) -> Dict:
        """
        Fallback roadmap if Gemini fails
        """
        return {
            "phases": [
                {
                    "phase": 1,
                    "title": "Month 1: Foundation Building",
                    "focus": "Build core fundamentals",
                    "courses": [
                        {
                            "id": "c1_m1",
                            "name": "Introduction to Programming",
                            "platform": "Coursera",
                            "duration": "4 weeks",
                            "rationale": "Essential programming foundation"
                        }
                    ],
                    "tests": [],
                    "internships": [],
                    "certificates": [],
                    "projects": [
                        {
                            "id": "p1_m1",
                            "name": "Personal Portfolio Website",
                            "description": "Build a professional portfolio",
                            "skills_demonstrated": ["HTML", "CSS", "JavaScript"],
                            "rationale": "Demonstrate web development skills"
                        }
                    ]
                }
            ]
        }


class RoadmapAssistant:
    """
    Interactive AI assistant for roadmap conversations.
    Handles chat, preference adjustments, and single-month task generation.
    """

    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.model_name = 'gemini-2.0-flash'

    def chat(self, message: str, context: Dict) -> Dict:
        """
        Handle a chat message from the user about their roadmap.
        """
        
        # Build conversation history string
        history = ""
        for msg in context.get('conversation_history', []):
            role = "User" if msg['role'] == 'user' else "Assistant"
            history += f"{role}: {msg['message']}\n"
        
        # Build completed phases summary
        completed_summary = ""
        for phase in context.get('completed_phases', []):
            completed_summary += f"- Month {phase['month']}: {phase['summary']}\n"
        
        current_tasks_str = "\n".join([
            f"- [{t['status']}] {t['item_name']} ({t['item_type']})"
            for t in context.get('current_tasks', [])
        ])
        
        prompt = f"""
You are "Delta Assistant", a professional career and education strategist helping a student with their learning roadmap.

Student Profile:
- Name: {context.get('profile', {}).get('name', 'Student')}
- Major: {context.get('profile', {}).get('major', 'Not specified')}
- Career Goal: {context.get('profile', {}).get('career_aspirations', 'Not specified')}

Current Month ({context.get('current_month', 1)}) Tasks:
{current_tasks_str if current_tasks_str else "No tasks yet"}

Completed Progress:
{completed_summary if completed_summary else "Just starting the journey!"}

User Preferences:
- Project vs Course Balance: {context.get('preferences', {}).get('project_ratio', 50)}% projects
- Pace: {context.get('preferences', {}).get('pace', 'moderate')}

Recent Conversation:
{history}

Current User Message: {message}

Instructions:
1. Be professional, concise, and helpful (2-3 short paragraphs max).
2. Do NOT use emojis.
3. If the user wants to ADJUST their roadmap (more projects, slower pace, etc.), acknowledge it and explain what you'd change.
4. If they ask a QUESTION, answer helpfully.
5. If they're expressing frustration or difficulty, be supportive.

If the user wants to make changes, include an "action" in your response:
- "adjust_projects": if they want more/fewer projects
- "adjust_pace": if they want to change pace
- "skip_task": if they want to skip something
- "none": if just chatting

Format as JSON:
{{
  "response": "Your professional message here...",
  "action": "none|adjust_projects|adjust_pace|skip_task",
  "action_details": {{}},
  "encouragement_score": 1-10
}}

Return ONLY valid JSON.
"""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config={"temperature": 0.8, "max_output_tokens": 500}
            )

            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]

            return json.loads(response_text.strip())

        except Exception as e:
            print(f"Error in RoadmapAssistant.chat: {e}")
            return {
                "response": "I see. Could you elaborate on how you would like to adjust your learning plan?",
                "action": "none",
                "action_details": {},
                "encouragement_score": 7
            }

    def generate_single_month(self, profile: Dict, month_number: int, preferences: Dict, completed_phases: List = None) -> Dict:
        """
        Generate tasks for a SINGLE month based on preferences.
        """
        
        project_ratio = preferences.get('project_ratio', 50)
        pace = preferences.get('pace', 'moderate')
        
        # Determine task counts based on pace
        pace_config = {
            'relaxed': {'total': 3, 'projects': max(1, int(3 * project_ratio / 100))},
            'moderate': {'total': 4, 'projects': max(1, int(4 * project_ratio / 100))},
            'intensive': {'total': 6, 'projects': max(1, int(6 * project_ratio / 100))}
        }
        config = pace_config.get(pace, pace_config['moderate'])
        
        completed_summary = ""
        if completed_phases:
            for phase in completed_phases[-3:]:  # Last 3 months for context
                completed_summary += f"- Month {phase.get('month', '?')}: {phase.get('summary', 'Completed')}\n"
        
        prompt = f"""
Generate tasks for MONTH {month_number} of a learning roadmap.

Student Profile:
- Major: {profile.get('major')}
- Career Goal: {profile.get('career_aspirations')}
- Skills: {', '.join(profile.get('current_skills', []))}

Previous Months Completed:
{completed_summary if completed_summary else "This is Month 1 - the beginning!"}

User Preferences:
- Wants {project_ratio}% projects, {100-project_ratio}% courses
- Pace: {pace} ({config['total']} tasks this month)
- Focus areas: {', '.join(preferences.get('focus_areas', ['general skills']))}

Generate exactly {config['total']} tasks for Month {month_number}:
- {config['projects']} practical projects
- {config['total'] - config['projects']} courses/certifications

Guidelines:
- Professional tone. Do NOT use emojis.

Format as JSON:
{{
  "month": {month_number},
  "title": "Month {month_number}: [Theme]",
  "focus": "Main focus description",
  "tasks": [
    {{
      "id": "m{month_number}_t1",
      "type": "course|project|certificate",
      "name": "Task Name",
      "description": "Brief description",
      "duration": "X weeks",
      "rationale": "Why this task"
    }}
  ],
  "motivation": "A professional encouraging message for this month (no emojis)"
}}

Return ONLY valid JSON.
"""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config={"temperature": 0.7, "max_output_tokens": 1000}
            )

            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]

            return json.loads(response_text.strip())

        except Exception as e:
            print(f"Error in generate_single_month: {e}")
            return {
                "month": month_number,
                "title": f"Month {month_number}: Building Skills",
                "focus": "Continue your learning journey",
                "tasks": [
                    {
                        "id": f"m{month_number}_t1",
                        "type": "course",
                        "name": "Continue Learning",
                        "description": "Pick up where you left off",
                        "duration": "4 weeks",
                        "rationale": "Maintain momentum"
                    }
                ],
                "motivation": "Dedication is key to mastery."
            }