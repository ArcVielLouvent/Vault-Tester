import { auth0 } from '@/lib/auth0';
import BugReportForm from '@/components/BugReportForm';

export default async function Home() {
  const session = await auth0.getSession();
  const user = session?.user;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      
      <div className="w-full flex justify-between items-center bg-white px-6 py-4 rounded-xl shadow-md border border-gray-100 mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Vault<span className="text-blue-600">Tester</span>
        </h1>
        
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden md:block">
              Hello, {user.name}
            </span>
            <a href="/auth/logout" className="text-sm bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-1.5 px-3 rounded border border-red-200 transition-colors">
              Log Out
            </a>
          </div>
        )}
      </div>

      {/* Konten Utama Form */}
      <div className="w-full max-w-4xl text-center">
        {user ? (
          <>
            <h2 className="text-3xl font-bold text-gray-800 mb-2 mt-2">Secure AI Bug Reporter</h2>
            <p className="text-gray-500 mb-8">
              Type your raw bug complaint below. Our AI Agent will format it into a standard QA report and securely post it to GitHub using Auth0 Token Vault.
            </p>
            
            <BugReportForm />
          </>
        ) : (
          <div className="w-full max-w-md mx-auto bg-white p-8 rounded-xl shadow-md text-center border border-gray-100 mt-12">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Access Locked</h2>
            <p className="mb-6 text-gray-500 text-sm">
              Please log in to authorize the AI Agent using Auth0 Token Vault.
            </p>
            <a href="/auth/login" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
              Log In with Auth0
            </a>
          </div>
        )}
      </div>
    </main>
  );
}