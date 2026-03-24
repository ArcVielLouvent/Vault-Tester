import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth0 } from '@/lib/auth0';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const session = await auth0.getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Silakan login.' }, { status: 401 });
    }

    console.log("User terotentikasi:", session.user.name);

    const { bugText } = await req.json();

    if (!bugText) {
      return NextResponse.json({ error: 'Teks bug tidak boleh kosong' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    const prompt = `You are an expert QA Engineer. Convert the following informal/raw bug report into a professional GitHub issue format in Markdown. 
    Use exactly these headings:
    **Title:** [A clear, concise title]
    **Description:** [Brief summary of the issue]
    **Steps to Reproduce:** [Numbered list based on the text]
    **Expected Behavior:** [What should happen ideally]
    **Actual Behavior:** [What actually happened in the text]
    
    Informal bug report: "${bugText}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ result: text });
  } catch (error) {
    console.error('Error Sistem:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}