
import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function getTaskSuggestions(prompt: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful task management assistant. Help organize and suggest improvements for tasks.",
        },
        {
          role: "user",
          content: prompt,
        },
      ]
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "I encountered an error. Please try again later.";
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
