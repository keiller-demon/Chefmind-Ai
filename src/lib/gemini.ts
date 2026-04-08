import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const cookingCoachModel = "gemini-3-flash-preview";

export async function getCookingAdvice(query: string) {
  const response = await ai.models.generateContent({
    model: cookingCoachModel,
    contents: query,
    config: {
      systemInstruction: "You are ChefMind AI, a pro chef and cooking coach. Provide step-by-step instructions, pro tips, and common mistakes to avoid. Format your response in a structured way that can be easily parsed or displayed.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recipeName: { type: Type.STRING },
          ingredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          proTips: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          commonMistakes: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["recipeName", "ingredients", "steps", "proTips", "commonMistakes"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
}

export async function analyzeDish(base64Image: string) {
  const response = await ai.models.generateContent({
    model: cookingCoachModel,
    contents: {
      parts: [
        { text: "Analyze this cooked dish. Provide the dish name, a rating out of 10, presentation feedback, color & plating suggestions, texture advice, an estimated calorie count with a brief nutritional breakdown (protein, carbs, fats). Also, identify the likely ingredients used and provide a 'perfect recipe' guide on how this dish should be cooked perfectly." },
        { inlineData: { mimeType: "image/jpeg", data: base64Image } }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dishName: { type: Type.STRING },
          rating: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
          platingSuggestions: { type: Type.STRING },
          textureAdvice: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          nutrients: {
            type: Type.OBJECT,
            properties: {
              protein: { type: Type.STRING },
              carbs: { type: Type.STRING },
              fats: { type: Type.STRING }
            },
            required: ["protein", "carbs", "fats"]
          },
          ingredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          perfectSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["dishName", "rating", "feedback", "platingSuggestions", "textureAdvice", "calories", "nutrients", "ingredients", "perfectSteps"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
}

export async function generateRecipeFromIngredients(ingredients: string[]) {
  const response = await ai.models.generateContent({
    model: cookingCoachModel,
    contents: `Generate a recipe using these ingredients: ${ingredients.join(", ")}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recipeName: { type: Type.STRING },
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          time: { type: Type.STRING },
          difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] }
        },
        required: ["recipeName", "steps", "time", "difficulty"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
}

export async function generateHotelMenu(theme: string) {
  const response = await ai.models.generateContent({
    model: cookingCoachModel,
    contents: `Generate a full menu for a restaurant with the theme: ${theme}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          menuItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                priceSuggestion: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          },
          comboIdeas: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          profitTips: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["menuItems", "comboIdeas", "profitTips"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
}
