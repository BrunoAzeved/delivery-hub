import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function summarizeTask(task: any) {
  const childrenInfo = task.children?.length > 0 
    ? `\nItens Filhos (Stories/Tasks):\n${task.children.map((c: any) => `- [${c.id}] ${c.summary} (${c.status})`).join('\n')}`
    : '';

  const prompt = `
    Você é um assistente de gestão de projetos especializado em Jira.
    Sua tarefa é resumir o status atual de uma atividade com base em sua descrição, comentários e itens filhos (se houver).
    
    Item: ${task.id} - ${task.summary} (${task.type})
    Descrição: ${task.description || 'Sem descrição.'}
    ${childrenInfo}
    Comentários:
    ${task.comments?.map((c: any) => `- [${c.date}] ${c.author}: ${c.text}`).join('\n') || 'Sem comentários.'}
    
    Por favor, forneça um resumo executivo curto (máximo 3 frases) em português, destacando o progresso atual e se há algum bloqueio aparente. Se for um Épico, mencione brevemente o estado geral dos itens filhos.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Summarization Error:", error);
    return "Não foi possível gerar o resumo no momento.";
  }
}

export async function refineComment(comment: string) {
  const prompt = `
    Você é um assistente de comunicação corporativa.
    Sua tarefa é reestruturar o comentário abaixo para que ele seja mais assertivo, profissional e claro para ser publicado em um card do Jira.
    Mantenha o idioma original (Português).
    
    Comentário original: "${comment}"
    
    Retorne apenas o texto refinado, sem explicações adicionais.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Refinement Error:", error);
    return comment; // Fallback to original
  }
}
