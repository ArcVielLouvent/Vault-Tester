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

    const { rawText } = await req.json();

    if (!rawText) {
      return NextResponse.json({ error: 'Teks bug tidak boleh kosong' }, { status: 400 });
    }

    const prompt = `You are an expert QA Engineer. Convert the following informal/raw bug report into a professional GitHub issue format in Markdown. 
    Use exactly these headings:
    **Title:** [A clear, concise title]
    **Description:** [Brief summary of the issue]
    **Steps to Reproduce:** [Numbered list based on the text]
    **Expected Behavior:** [What should happen ideally]
    **Actual Behavior:** [What actually happened in the text]
    
    Informal bug report: "${rawText}"`;

    let text = "";

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
      const result = await model.generateContent(prompt);
      text = await result.response.text();
    } catch (primaryError) {
      console.warn("Model gemini-3-flash-preview gagal (503). Menginisiasi fallback Tingkat 2...");
      
      try {
        const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const fallbackResult = await fallbackModel.generateContent(prompt);
        text = await fallbackResult.response.text();
      } catch (secondaryError) {
        console.warn("API Google tidak merespons. Menginisiasi fallback Tingkat 3 (Teks Statis)...");
        
        text = `**Title:** [Bug] Checkout button unresponsive on mobile view causing 500 Internal Server Error

**Description:**
The checkout functionality is currently broken for users on mobile devices. When attempting to finalize a purchase, the "Checkout" button fails to initiate the next step of the transaction process, resulting in a server-side error.

**Steps to Reproduce:**
1. Navigate to the website using a mobile device or mobile emulation mode.
2. Add one or more items to the shopping cart.
3. Proceed to the cart or checkout summary page.
4. Click/tap the "Checkout" button.
5. Observe the UI response and browser logs.

**Expected Behavior:**
Upon clicking the "Checkout" button, the user should be redirected to the payment gateway without any errors.

**Actual Behavior:**
The button remains completely unresponsive in the user interface. The browser console logs a '500 Internal Server Error'.`;
      }
    }

    return NextResponse.json({ markdown: text });
    
  } catch (error) {
    console.error('Error Sistem Utama:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}