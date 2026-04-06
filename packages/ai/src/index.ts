import { env } from "@academy/config";

interface TutorInput {
  courseTitle: string;
  lessonTitle: string;
  lessonBody: string;
  outcomes: string[];
  question: string;
}

function localFallback(input: TutorInput) {
  return [
    `Lesson focus: ${input.lessonTitle} in ${input.courseTitle}.`,
    `Short explanation: ${input.lessonBody}`,
    `Why it matters: this lesson supports outcomes like ${input.outcomes.slice(0, 2).join(" and ")}.`,
    `Answer to your question: ${input.question} should be approached by breaking it into a practical implementation step, a user benefit, and a production readiness check.`
  ].join("\n\n");
}

export async function answerLessonQuestion(input: TutorInput) {
  try {
    const response = await fetch(`${env.ollamaBaseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.ollamaModel,
        stream: false,
        prompt: `You are a concise course tutor. Only answer from the provided course context.\nCourse: ${input.courseTitle}\nLesson: ${input.lessonTitle}\nOutcomes: ${input.outcomes.join(", ")}\nLesson content: ${input.lessonBody}\nQuestion: ${input.question}`
      })
    });

    if (!response.ok) {
      return localFallback(input);
    }

    const data = (await response.json()) as { response?: string };
    return data.response?.trim() || localFallback(input);
  } catch {
    return localFallback(input);
  }
}

