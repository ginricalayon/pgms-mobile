const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const FITNESS_KEYWORDS = [
  "fitness",
  "gym",
  "workout",
  "exercise",
  "nutrition",
  "diet",
  "training",
  "muscle",
  "cardio",
  "weight",
  "strength",
  "protein",
  "calorie",
  "health",
  "run",
  "yoga",
  "stretch",
  "lift",
  "body",
  "fat",
  "lose",
  "gain",
  "routine",
  "form",
  "squat",
  "bench",
  "deadlift",
  "pullup",
  "pushup",
  "curl",
  "squatting",
  "bench pressing",
  "deadlifting",
  "pullups",
  "pushups",
  "curls",
];

function isFitnessRelated(text: string) {
  const lower = text.toLowerCase();
  return FITNESS_KEYWORDS.some((keyword) => lower.includes(keyword));
}

interface AIResponse {
  text: string;
  suggestions?: string[];
}

class FitnessAIService {
  private systemPrompt = `You are a knowledgeable and friendly fitness AI assistant. Your role is to:
1. Provide accurate, science-based fitness and health advice
2. Create personalized workout plans
3. Give nutrition guidance
4. Answer questions about exercise techniques
5. Offer motivation and support
6. Always prioritize safety and proper form
7. Consider the user's fitness level and goals

Keep responses concise, practical, and easy to understand. When appropriate, provide 2-3 follow-up suggestions that the user might want to ask next.`;

  async getResponse(userInput: string): Promise<AIResponse> {
    if (!isFitnessRelated(userInput)) {
      return {
        text: "I'm here to help with fitness, gym, workout, and nutrition questions. Please ask something related to those topics!",
        suggestions: [
          "What's a good beginner workout?",
          "How can I improve my nutrition?",
          "What exercises are best for weight loss?",
        ],
      };
    }
    try {
      // Main response
      const mainRes = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: `${this.systemPrompt}\nUser: ${userInput}` }] },
          ],
        }),
      });
      const mainData = await mainRes.json();
      console.log("Gemini API response:", mainData);
      if (mainData.error) {
        console.log("Gemini API error:", mainData.error);
      }
      const text =
        mainData?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't process your request.";

      // Suggestions response
      const suggestionsPrompt = `Generate 3 relevant follow-up questions that a user might want to ask about fitness, workouts, or nutrition. Return them as a JSON array of strings.\nUser: ${userInput}\nAI: ${text}`;
      const suggRes = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: suggestionsPrompt }] }],
        }),
      });
      let suggestions: string[] = [];
      try {
        const suggData = await suggRes.json();
        console.log("Gemini API suggestions response:", suggData);
        if (suggData.error) {
          console.log("Gemini API suggestions error:", suggData.error);
        }
        const suggText =
          suggData?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        suggestions = JSON.parse(suggText);
      } catch (e) {
        suggestions = [
          "What's a good beginner workout?",
          "How can I improve my nutrition?",
          "What exercises are best for weight loss?",
        ];
      }

      return { text, suggestions };
    } catch (error) {
      return {
        text: "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
        suggestions: [
          "What's a good beginner workout?",
          "How can I improve my nutrition?",
          "What exercises are best for weight loss?",
        ],
      };
    }
  }
}

export const fitnessAIService = new FitnessAIService();
