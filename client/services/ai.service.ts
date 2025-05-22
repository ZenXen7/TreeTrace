import { GoogleGenerativeAI } from '@google/generative-ai';

export class AIService {
  private static instance: AIService;
  private genAI: GoogleGenerativeAI;
  private model: any;

  private constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public async askGemini(userMessage: string, allFamilyData: any[]): Promise<string> {
    const context = JSON.stringify(allFamilyData, null, 2);
    const prompt = `You are a medical AI assistant or family tree expert for a family tree app. If you are in the treeview page or family tree page act as a family tree expert depending on the prompt if the user ask anything about medical topics. Use the following family and medical data to answer the user's question.\n\nFamily Data:\n${context}\n\nUser Question: ${userMessage}\n\nGive a clear, professional answer, no emojis.`;
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Error calling Gemini:", error);
      return "Sorry, I couldn't process your request.";
    }
  }
} 