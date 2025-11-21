import { GoogleGenAI } from "@google/genai";
import { Product, SalesPage } from '../types';

const textModel = 'gemini-2.5-flash';
const imageModel = 'gemini-3-pro-image-preview';


// Returns a new AI client instance, or null if in placeholder mode.
const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === "placeholder") {
      console.warn("API_KEY not found or is a placeholder. Using mock data.");
      return null;
    }
    return new GoogleGenAI({ apiKey });
};


// MOCK DATA for placeholder mode
const MOCK_PRODUCT: Product = {
  title: 'Smartwatch Pro X',
  description: 'O relógio inteligente definitivo para um estilo de vida ativo. Monitore sua saúde, receba notificações e fique conectado com estilo. Bateria de longa duração e design à prova d\'água.',
  images: ['https://picsum.photos/seed/watch1/800/800', 'https://picsum.photos/seed/watch2/800/800'],
  variations: ['Preto', 'Prata', 'Azul'],
  supplierPrice: 45.50,
};

const MOCK_SALES_PAGE: SalesPage = {
    headline: "Transforme Seu Pulso no Centro de Comando da Sua Vida com o Smartwatch Pro X!",
    opening: "Cansado de perder notificações importantes e lutar para acompanhar suas metas de saúde? O Smartwatch Pro X não é apenas um relógio. É seu assistente pessoal, seu personal trainer e sua conexão com o mundo, tudo em um design elegante e poderoso.",
    benefits: [
        { icon: "Heart", title: "Monitoramento de Saúde 24/7", text: "Acompanhe sua frequência cardíaca, oxigênio no sangue e padrões de sono com precisão." },
        { icon: "Message", title: "Notificações Instantâneas", text: "Nunca perca uma chamada, mensagem ou alerta importante. Veja tudo diretamente no seu pulso." },
        { icon: "Battery", title: "Bateria de Longa Duração", text: "Passe dias sem recarregar. Nossa bateria otimizada acompanha seu ritmo de vida agitado." }
    ],
    howItWorks: "É simples! Conecte o Smartwatch Pro X ao seu smartphone via Bluetooth, instale nosso aplicativo gratuito e comece a personalizar mostradores e notificações. Em minutos, você estará no controle total.",
    testimonials: [
        { name: "Joana F.", text: "Absolutamente incrível! Me ajuda a manter o foco nos treinos e a não perder nenhuma ligação do trabalho. Recomendo!", rating: 5 },
        { name: "Carlos M.", text: "O design é muito premium e a bateria dura muito mais do que meu relógio antigo. Valeu cada centavo.", rating: 5 },
    ],
    urgency: "Oferta por tempo limitado! Compre agora e receba 50% de desconto e frete grátis para todo o Brasil. Estoque acabando!",
    cta: "Eu Quero Meu Smartwatch Pro X Agora!"
};


export async function importProductData(url: string, language: string): Promise<Product> {
  const ai = getAiClient();
  if (!ai) {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_PRODUCT), 1000));
  }
  
  const prompt = `You are an expert dropshipping product importer. Analyze the product from the URL: ${url}. 
  Extract the following information and translate it to ${language}:
  - A compelling product title.
  - A detailed and persuasive product description.
  - A list of product variations (like color, size).
  - The supplier's price in USD (make a realistic estimate).
  
  IMPORTANT: Provide ONLY a JSON object in the following format, without any markdown formatting or extra text:
  {"title": "...", "description": "...", "variations": ["...", "..."], "supplierPrice": 0.00}`;

  const response = await ai.models.generateContent({
    model: textModel,
    contents: prompt,
    config: {
        responseMimeType: "application/json",
    }
  });
  
  const productData = JSON.parse(response.text);
  return {
      ...productData,
      images: ['https://picsum.photos/seed/gen1/800/800', 'https://picsum.photos/seed/gen2/800/800'], // Placeholder images
  };
}


export async function generateAdVideoScript(product: Product, platform: 'TikTok' | 'Facebook' | 'Reels', language: string): Promise<string> {
    const ai = getAiClient();
    if (!ai) {
        return new Promise(resolve => setTimeout(() => resolve(`**Cena 1:** Close-up do Smartwatch Pro X no pulso de alguém correndo.\n\n**Texto na tela:** Cansado de ser mediano?\n\n**Voz:** Eleve seu jogo. O Smartwatch Pro X está aqui.\n\n**Cena 2:** Pessoa recebe uma notificação de mensagem no relógio e sorri.\n\n**CTA:** Arrasta pra cima e garanta o seu!`), 1000));
    }

    const prompt = `Create a short, punchy, and highly engaging video script for a ${platform} ad for the product "${product.title}".
    The script should be in ${language}.
    Product description: "${product.description}".
    It should follow the AIDA model (Attention, Interest, Desire, Action). 
    Describe scenes, on-screen text, and voiceover/narration.
    The goal is to stop the scroll and drive clicks.`;

    const response = await ai.models.generateContent({ model: textModel, contents: prompt });
    return response.text;
}

export async function generateLifestyleImage(product: Product): Promise<string> {
    const ai = getAiClient();
    if (!ai) {
        const mockUrl = `https://picsum.photos/seed/${Math.random()}/1024/1024`;
        return new Promise(resolve => setTimeout(() => resolve(mockUrl), 1500));
    }

    const prompt = `Create a photorealistic, high-quality lifestyle image of a person happily using a "${product.title}". The setting should be modern and aspirational. Show the product in a clear but natural way. The image should be vibrant and eye-catching.`;

    const response = await ai.models.generateContent({
        model: imageModel,
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
    });
    
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image generated");
}


export async function generateAdCopy(product: Product, platform: 'TikTok' | 'Facebook' | 'Reels', language: string): Promise<string> {
    const ai = getAiClient();
    if (!ai) {
        return new Promise(resolve => setTimeout(() => resolve(`🚀 Transforme sua vida com o ${product.title}! 🚀 Monitore sua saúde, fique conectado e faça tudo com estilo. 💪\n\n🔥 OFERTA ESPECIAL: 50% OFF + Frete Grátis! 🔥\n\nClique no link para garantir o seu antes que acabe! 👉 [LINK]`), 1000));
    }
    const prompt = `Write a persuasive and high-converting ad copy for a ${platform} post.
    The language must be ${language}.
    Product: "${product.title}".
    Description: "${product.description}".
    Include emojis, a strong hook, key benefits, and a clear call-to-action.`;

    const response = await ai.models.generateContent({ model: textModel, contents: prompt });
    return response.text;
}

export async function generateSalesPage(product: Product, language: string): Promise<SalesPage> {
    const ai = getAiClient();
    if (!ai) {
        return new Promise(resolve => setTimeout(() => resolve(MOCK_SALES_PAGE), 2000));
    }

    const prompt = `You are an expert direct-response copywriter. Write a complete, high-converting landing page in ${language} for the product:
    Title: "${product.title}"
    Description: "${product.description}"

    The landing page must include:
    1.  A powerful, benefit-driven headline.
    2.  An engaging opening paragraph that identifies a customer pain point and introduces the product as the solution.
    3.  A section with 3 key benefits, each with an icon name (use simple names like 'Heart', 'Message', 'Battery'), a title, and a short description.
    4.  A "How It Works" section explaining how easy it is to use.
    5.  A social proof section with 2 realistic-looking customer testimonials (include name, text, and a rating out of 5).
    6.  An urgency/scarcity section to encourage immediate purchase.
    7.  A strong, clear Call-To-Action (CTA) text.

    IMPORTANT: Provide ONLY a JSON object with the structure defined below, without any markdown or extra text.
    {
      "headline": "...",
      "opening": "...",
      "benefits": [{"icon": "...", "title": "...", "text": "..."}, ...],
      "howItWorks": "...",
      "testimonials": [{"name": "...", "text": "...", "rating": 5}, ...],
      "urgency": "...",
      "cta": "..."
    }`;
    
     const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
    });

    return JSON.parse(response.text);
}
