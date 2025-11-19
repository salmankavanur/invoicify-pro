
import { GoogleGenAI } from "@google/genai";

export const generateInvoiceNote = async (
  clientName: string,
  type: 'invoice' | 'estimate',
  itemsSummary: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Write a polite, professional, and short note (max 3 sentences) to include at the bottom of a ${type} for client "${clientName}".
      The ${type} includes: ${itemsSummary}.
      Express gratitude and provide a friendly closing.
      Do not include placeholders like [Your Name].
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Thank you for your business!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating note. Please check your configuration.";
  }
};

export const analyzeFinances = async (
    totalIncome: number,
    totalExpenses: number,
    monthlyData: any[]
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
        Analyze the following small business financial data for the dashboard:
        - Total Income YTD: ${totalIncome}
        - Total Expenses YTD: ${totalExpenses}
        - Recent Monthly Trend (Last 3 months): ${JSON.stringify(monthlyData.slice(0,3))}
        
        Provide a brief, 2-3 sentence executive summary. Is the business healthy? What is the one key thing to watch out for? 
        Be encouraging but realistic. Start with "Analysis:".
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Unable to generate analysis.";
    } catch (error) {
        return "AI Analysis unavailable.";
    }
}

export const analyzeRecurringExpenses = async (
    totalMonthly: number,
    totalYearly: number,
    expenses: any[]
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        // Summarize top 3 recurring categories
        const catMap: Record<string, number> = {};
        expenses.forEach(e => catMap[e.category] = (catMap[e.category] || 0) + e.amount);
        const topCategories = Object.entries(catMap).sort((a,b) => b[1] - a[1]).slice(0, 3);

        const prompt = `
        Analyze these recurring business expenses:
        - Monthly Total: ${totalMonthly}
        - Annualized Total Cost: ${totalYearly}
        - Top Spending Categories: ${JSON.stringify(topCategories)}
        
        Provide a 1-2 sentence insight. Is this sustainable? Suggest one optimization if obvious.
        `;

        const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: prompt,
        });
        return response.text || "Analysis unavailable.";
    } catch(error) {
        return "AI Analysis unavailable.";
    }
}