'use client';

import { useState } from 'react';

export default function BugReportForm() {
  const [bugText, setBugText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [successUrl, setSuccessUrl] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugText.trim()) return;

    setIsLoading(true);
    setAiResponse('');
    setSuccessUrl('');
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bugText }),
      });

      if (!res.ok) throw new Error('Failed to generate AI response');
      const data = await res.json();
      setAiResponse(data.result);
    } catch (error) {
      setAiResponse('Error: Failed to contact AI Agent.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueText: aiResponse }),
      });

      if (!res.ok) throw new Error('Failed to publish to GitHub');
      const data = await res.json();
      setSuccessUrl(data.url);
    } catch (error) {
      alert("Failed to publish issue to GitHub.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      {successUrl ? (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-xl font-bold mb-2">Bug Report Published!</h3>
          <p className="mb-4">Your AI-formatted issue has been securely posted to your repository.</p>
          <a href={successUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded transition-colors">
            View on GitHub
          </a>
          <button onClick={() => { setSuccessUrl(''); setBugText(''); setAiResponse(''); }} className="block w-full text-green-600 font-semibold mt-4 hover:underline">
            Report Another Bug
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={handleGenerate} className="bg-white shadow-md rounded-lg p-6 border border-gray-100 text-left">
            <label htmlFor="bug" className="block text-gray-700 text-sm font-bold mb-2">
              Describe the Bug (Raw/informal text is fine):
            </label>
            <textarea
              id="bug"
              rows={5}
              className="shadow appearance-none border border-gray-200 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="Example: Hey, the submit button on the profile page is broken..."
              value={bugText}
              onChange={(e) => setBugText(e.target.value)}
              disabled={isLoading || isPublishing}
            />
            
            <button
              type="submit"
              disabled={isLoading || !bugText}
              className={`w-full font-bold py-3 px-4 rounded-lg text-white transition-colors flex justify-center items-center ${
                isLoading || !bugText ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800'
              }`}
            >
              {isLoading ? 'AI is Formatting...' : 'Format with AI'}
            </button>
          </form>

          {aiResponse && (
            <div className="mt-6 bg-white shadow-md border border-gray-100 rounded-lg p-6 text-left">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex justify-between items-center">
                Generated Report (Preview)
                <button 
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className={`text-sm py-2 px-4 rounded font-bold text-white transition-colors ${
                    isPublishing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isPublishing ? 'Publishing...' : 'Publish to GitHub'}
                </button>
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {aiResponse}
                </pre>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}