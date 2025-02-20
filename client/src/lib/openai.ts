import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ 
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Enable browser usage
});

export async function getTaskSuggestions(prompt: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful task management assistant. Provide task suggestions and breakdowns in JSON format with the following structure: { 'suggestions': string[], 'steps': string[], 'estimatedTime': string }",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to get task suggestions");
  }
}

export async function getPriorityRecommendation(taskDescription: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Analyze the task description and recommend a priority level (low, medium, high) based on urgency and importance. Respond in JSON format with the structure: { 'priority': 'low' | 'medium' | 'high', 'reasoning': string }",
        },
        {
          role: "user",
          content: taskDescription,
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to get priority recommendation");
  }
}