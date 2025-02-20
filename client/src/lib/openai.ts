
import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function getTaskSuggestions(prompt: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful task management assistant. Provide task suggestions and breakdowns in JSON format.",
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
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Analyze the task description and recommend a priority level (low, medium, high) based on urgency and importance.",
        },
        {
          role: "user",
          content: taskDescription,
        },
      ]
    });

    const suggestion = response.choices[0].message.content?.toLowerCase() || "";
    return {
      priority: suggestion.includes("high") ? "high" : 
               suggestion.includes("medium") ? "medium" : "low"
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    return { priority: "low" };
  }
}
