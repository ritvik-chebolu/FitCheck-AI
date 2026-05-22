import { GoogleGenAI, Type } from "@google/genai";
import { ClothingItem } from "../types";
import { resizeImage } from "../lib/utils";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

let cachedUserPhoto: { original: string; resized: string } | null = null;

export const GeminiService = {
  async identifyClothing(imageBase64: string): Promise<ClothingItem[]> {
    const resizedImage = await resizeImage(imageBase64, 400, 400); // Smaller for faster identification
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: resizedImage.split(",")[1],
            },
          },
          {
            text: "Identify any clothing items in this image. For each item, provide a name, brand (guess if not clear), estimated price, description, category (top, bottom, shoes, accessory, full-body), a productUrl (a realistic google search or shop URL for this specific item), and a productImageUrl (a direct URL to an image of this specific product or a highly similar one, sourced from the web. Ensure it is a valid image URL like .jpg or .png). Return as a JSON array.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              brand: { type: Type.STRING },
              price: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              productUrl: { type: Type.STRING },
              productImageUrl: { type: Type.STRING },
            },
            required: ["name", "description", "category", "productUrl", "productImageUrl"],
          },
        },
      },
    });

    const items = JSON.parse(response.text || "[]");
    return items.map((item: any) => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      imageUrl: resizedImage, // Pre-resized
    }));
  },

  async recommendStyle(userPhotoBase64: string, bodyContext: string): Promise<string> {
    let resizedImage;
    if (cachedUserPhoto?.original === userPhotoBase64) {
      resizedImage = cachedUserPhoto.resized;
    } else {
      resizedImage = await resizeImage(userPhotoBase64, 512, 512);
      cachedUserPhoto = { original: userPhotoBase64, resized: resizedImage };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: resizedImage.split(",")[1],
            },
          },
          {
            text: `Analyze this person's body type and facial features. Context provided: ${bodyContext}. Provide personalized fashion advice: what cuts, colors, and styles would look best on them? Be specific and encouraging.`,
          },
        ],
      },
    });

    return response.text || "I couldn't generate a recommendation right now.";
  },

  async generateARImage(userPhotoBase64: string, itemImageUrl: string, itemDescription: string, itemName: string): Promise<{ imageUrl: string; summary: string }> {
    let resizedUser;
    if (cachedUserPhoto?.original === userPhotoBase64) {
      resizedUser = cachedUserPhoto.resized;
    } else {
      resizedUser = await resizeImage(userPhotoBase64, 512, 512);
      cachedUserPhoto = { original: userPhotoBase64, resized: resizedUser };
    }

    // Step 1: generate an edited image using the text description of the outfit.
    const prompt = `Change the person's clothing to be a ${itemName}. Description of the garment: ${itemDescription}. The user's pose, face, and background must remain identical.`;
    
    let generatedImageStr = null;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: resizedUser.split(",")[1] } },
            { text: prompt },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          }
        }
      });

      if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            generatedImageStr = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    } catch (err) {
      console.error("Error generating AR image with flash-image:", err);
    }

    const itemParts = itemImageUrl.startsWith('data:image') 
      ? [{ inlineData: { mimeType: "image/jpeg", data: itemImageUrl.split(",")[1] } }]
      : [{ text: `Garment URL: ${itemImageUrl}` }];

    return {
      imageUrl: generatedImageStr || resizedUser, // Fallback to original user image
      summary: ""
    };
  }
};
