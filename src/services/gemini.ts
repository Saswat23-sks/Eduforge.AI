import type { Course, LearningStyle, AIModel, BloomLevel, LearningOutcome, Lecture, QuizQuestion, Assignment, PedagogyReport, CurriculumSequencing, ReadingPlan, AdaptiveContent } from '../types/course';

async function callAiApi(systemPrompt: string, prompt: string, model?: string, config?: any) {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, prompt, model, config })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'AI API call failed');
  }
  
  return response.json();
}

const SYSTEM_PROMPT = `You are an expert pedagogical AI assistant specializing in undergraduate course design. 
Your goal is to transform raw syllabi or topic lists into structured, pedagogically-aligned course materials.
You follow Bloom's Taxonomy, ensure prerequisite sequencing, and adapt content for different learning styles.

Learning Styles:
- Visual: Emphasis on diagrams, infographics, and visual metaphors.
- Textual: Emphasis on detailed explanations, reading plans, and structured notes.
- Active: Emphasis on hands-on activities, case studies, and discussion.

Accessibility: Ensure all content follows UDL (Universal Design for Learning) principles.

CRITICAL: You MUST return a valid JSON object that strictly follows this TypeScript structure:

interface Course {
  id: string;
  title: string;
  description: string;
  learningOutcomes: {
    id: string;
    description: string;
    bloomLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  }[];
  topicMapping: {
    topic: string;
    alignedLOs: string[]; // IDs from learningOutcomes
  }[];
  modules: {
    id: string;
    title: string;
    description: string;
    lectures: {
      id: string;
      title: string;
      outline: string[];
      keyConcepts: string[];
      discussionQuestions: string[];
      lectureNotes: string; // Detailed, ready-to-read lecture notes in Markdown
      presentationSlides: {
        title: string;
        content: string[];
        speakerNotes: string;
      }[];
      visualAids?: string[];
      activitySuggestions?: string[];
    }[];
    readings: {
      title: string;
      author: string;
      type: 'textbook' | 'article' | 'video' | 'case-study';
      prerequisites: string[];
    }[];
    quizzes: {
      id: string;
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
      bloomLevel: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
    }[];
    assignments: {
      id: string;
      title: string;
      description: string;
      rubric: {
        criterion: string;
        weight: number;
        description: string;
      }[];
      learningOutcomes: string[];
    }[];
  }[];
  targetAudience: string;
  classSize: number;
}

Ensure all IDs are unique strings.
Return ONLY the JSON object, no markdown formatting.`;

export async function generateCourse(input: string, options: {
  learningStyle: LearningStyle;
  classSize: number;
  accessibilityNeeds: string[];
  model: AIModel;
  creativity: number;
  bloomLevel: BloomLevel;
}): Promise<Course> {
  const prompt = `
    Raw Syllabus/Topics:
    ${input}

    Parameters:
    - Primary Learning Style: ${options.learningStyle}
    - Class Size: ${options.classSize}
    - Accessibility Needs: ${options.accessibilityNeeds.join(', ')}
    - Target Pedagogical Depth (Bloom's Taxonomy): ${options.bloomLevel}
    - Creativity Level: ${options.creativity} (0 is precise, 1 is highly creative)

    Generate a comprehensive course structure aligned with the specified Bloom's Taxonomy level. 
    IMPORTANT: Provide detailed lecture notes and slides, but keep them concise enough to fit in a single response. 
    If the course is very long, focus on the first 4-5 modules in high detail and provide outlines for the rest.

    Return the JSON object.
  `;

  return callAiApi(SYSTEM_PROMPT, prompt, options.model, { 
    responseMimeType: 'application/json',
    temperature: options.creativity
  });
}

export async function adaptArtifact(
  artifact: any, 
  type: 'lecture' | 'quiz' | 'assignment' | 'reading', 
  style: LearningStyle
) {
  let styleSpecificInstructions = '';
  if (style === 'active') {
    if (type === 'quiz') {
      styleSpecificInstructions = 'Focus on scenario-based questions, case studies, and problem-solving components. Questions should require applying knowledge to a specific situation rather than just recall.';
    } else if (type === 'lecture') {
      styleSpecificInstructions = 'Incorporate more interactive elements, group discussion prompts, and hands-on activity suggestions within the notes and slides.';
    }
  }

  const prompt = `
    Adapt the following ${type} for a ${style} learning style.
    Maintain the original learning objectives but change the delivery method.
    
    ${styleSpecificInstructions}
    
    Original Content:
    ${JSON.stringify(artifact)}
    
    Return the updated JSON object.
  `;

  return callAiApi(SYSTEM_PROMPT, prompt, 'gemini-2.0-flash', { responseMimeType: 'application/json' });
}

export async function validatePedagogy(
  learningObjectives: LearningOutcome[],
  lectures: Lecture[],
  quizzes: QuizQuestion[],
  assignments: Assignment[]
): Promise<PedagogyReport> {
  const prompt = `
    You are a pedagogy validation engine.
    
    Input:
    - Learning Objectives: ${JSON.stringify(learningObjectives)}
    - Lecture content: ${JSON.stringify(lectures)}
    - Quiz: ${JSON.stringify(quizzes)}
    - Assignment: ${JSON.stringify(assignments)}

    Task:
    1. Check if each LO is covered across the lectures, quizzes, and assignments.
    2. Identify gaps (missing or weak coverage).
    3. Suggest specific pedagogical improvements.

    Return the following JSON structure:
    {
      "coverage": [
        {
          "lo_id": "LO1",
          "covered": boolean,
          "strength": "strong" | "medium" | "weak",
          "missing_elements": string[]
        }
      ],
      "suggestions": string[]
    }
  `;

  return callAiApi(SYSTEM_PROMPT, prompt, 'gemini-2.0-flash', { responseMimeType: 'application/json' });
}

export async function sequenceCurriculum(topics: string[]): Promise<CurriculumSequencing> {
  const prompt = `
    You are a curriculum sequencing expert.
    
    Input:
    - Topics: ${JSON.stringify(topics)}

    Task:
    1. Identify prerequisite relationships between these topics.
    2. Build a dependency graph.
    3. Order topics logically from beginner to advanced.

    Return the following JSON structure:
    {
      "orderedTopics": string[],
      "dependencies": [
        {
          "topic": string,
          "requires": string[]
        }
      ],
      "warnings": string[]
    }
  `;

  return callAiApi(SYSTEM_PROMPT, prompt, 'gemini-2.0-flash', { responseMimeType: 'application/json' });
}

export async function generateReadingPlan(orderedTopics: string[]): Promise<ReadingPlan> {
  const prompt = `
    You are an academic course planner.
    
    Input:
    - Ordered topics: ${JSON.stringify(orderedTopics)}

    Task:
    1. Generate high-quality reading resources (textbooks, articles, videos) for each topic.
    2. Ensure each resource builds on prerequisites and is appropriate for the level.
    3. Provide realistic titles and specify the resource type.

    Return the following JSON structure:
    {
      "items": [
        {
          "topic": string,
          "resources": [
            {
              "title": string,
              "type": "textbook" | "article" | "video",
              "level": "beginner" | "intermediate" | "advanced",
              "url": string
            }
          ]
        }
      ]
    }
  `;

  return callAiApi(SYSTEM_PROMPT, prompt, 'gemini-2.0-flash', { responseMimeType: 'application/json' });
}

export async function transformToAdaptiveContent(topic: string, content: string): Promise<AdaptiveContent> {
  const prompt = `
    You are an adaptive learning system.
    
    Input:
    - Topic: ${topic}
    - Base explanation: ${content}

    Task:
    Transform the SAME concept into three distinct learning versions:

    1. Visual learning version:
       - Use diagrams (describe them in detail using text/markdown)
       - Spatial explanation
       - Focus on relationships and flow

    2. Active learning version:
       - Include specific exercises
       - Hands-on tasks or simulations
       - "Learning by doing" approach

    3. Textual learning version:
       - Structured explanation
       - Clear definitions + step-by-step logic
       - Focus on narrative and verbal reasoning

    Return the following JSON structure:
    {
      "visual": "markdown string",
      "active": "markdown string",
      "textual": "markdown string"
    }
  `;

  return callAiApi(SYSTEM_PROMPT, prompt, 'gemini-2.0-flash', { responseMimeType: 'application/json' });
}

export async function generateAssessment(topic: string, learningObjectives: LearningOutcome[]): Promise<QuizQuestion[]> {
  const prompt = `
    You are an assessment designer.
    
    Input:
    - Topic: ${topic}
    - Learning Objectives: ${JSON.stringify(learningObjectives)}

    Task:
    Generate 6 high-quality multiple-choice questions:
    - 2 Easy (Remember/Understand)
    - 2 Medium (Apply)
    - 2 Hard (Analyze/Create)

    Each question must include:
    - Question text
    - 4 Options (MCQ)
    - Correct answer index (0-3)
    - Detailed explanation
    - Bloom’s level
    - Difficulty score (0–1)

    Return the following JSON structure:
    {
      "questions": [
        {
          "id": string (unique),
          "question": string,
          "options": [string, string, string, string],
          "correctAnswer": number,
          "explanation": string,
          "bloomLevel": string,
          "difficulty": "beginner" | "intermediate" | "advanced",
          "difficultyScore": number
        }
      ]
    }
  `;

  const data = await callAiApi(SYSTEM_PROMPT, prompt, 'gemini-2.0-flash', { responseMimeType: 'application/json' });
  return data.questions;
}

export async function refineContentWithFeedback(content: string, feedback: string): Promise<{ updated_content: string; changes_made: string[] }> {
  const prompt = `
    You are an AI teaching assistant.
    
    Input:
    - Original content: ${content}
    - Feedback: ${feedback}

    Task:
    1. Modify the content according to the feedback.
    2. Keep the core learning objectives intact.
    3. Improve clarity, adjust difficulty, or address specific points of confusion mentioned in the feedback.
    4. If the input content is a JSON string (e.g. for slides), return the updated content as a valid JSON string that matches the original structure.

    Return the following JSON structure:
    {
      "updated_content": "markdown string",
      "changes_made": [string, string]
    }
  `;

  return callAiApi(SYSTEM_PROMPT, prompt, 'gemini-2.0-flash', { responseMimeType: 'application/json' });
}

export async function generateCustomLecture(topic: string, depth: string, tone: string, duration: number): Promise<{ lecture: string; estimated_duration: string; depth_applied: string; tone_used: string }> {
  const prompt = `
    You are a customizable course generator.
    
    Input:
    - Topic: ${topic}
    - Depth level: ${depth} (beginner/intermediate/advanced)
    - Tone: ${tone} (academic/conversational)
    - Duration: ${duration} minutes

    Task:
    Generate lecture content based on these constraints.
    - Adjust depth to match the level.
    - Ensure the content fits within the specified time.
    - Match the requested tone.

    Return the following JSON structure:
    {
      "lecture": "markdown string",
      "estimated_duration": "string",
      "depth_applied": "string",
      "tone_used": "string"
    }
  `;

  return callAiApi(SYSTEM_PROMPT, prompt, 'gemini-2.0-flash', { responseMimeType: 'application/json' });
}
