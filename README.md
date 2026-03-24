# 🛡️ VaultTester: Secure AI Bug Reporter

> **Built for the Okta/Auth0 Hackathon** 🚀

VaultTester is an AI-powered QA assistant that takes informal, raw bug complaints and transforms them into professional, industry-standard GitHub Issues. Most importantly, it completely eliminates the need for hardcoded Personal Access Tokens (PATs) by leveraging the **Auth0 Token Vault**.

## ✨ The Problem & The Solution

**The Problem:** AI Agents acting on behalf of users (like posting to external APIs such as GitHub) usually require developers to store sensitive Personal Access Tokens in environment variables or databases. This is a massive security risk.

**The Solution:** VaultTester uses **Auth0 Token Vault**. Users authenticate via GitHub Social Login through Auth0. When the AI agent is ready to publish the formatted report, our Next.js backend dynamically retrieves the user's temporary GitHub access token via the Auth0 Management API. 
**Result:** Zero hardcoded tokens. 100% Secure. The AI is fully *Authorized to Act*.

## 🚀 Key Features

- **Auth0 Social Login:** Secure authentication using GitHub.
- **Agentic AI Workflow:** Powered by **Google Gemini 3 Flash**, translating casual bug descriptions into structured Markdown (Title, Description, Steps to Reproduce, Expected/Actual Behavior).
- **Auth0 Token Vault Integration:** Securely extracts Identity Provider (IdP) tokens via Machine-to-Machine (M2M) Management API.
- **Direct GitHub Publishing:** Pushes the finalized QA report directly to the user's repository without exposing credentials.

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Backend/API:** Next.js Route Handlers
- **Authentication:** Auth0 (Next.js SDK), Auth0 Management API
- **AI Model:** Google Generative AI (Gemini 3 Flash)
- **External API:** GitHub REST API

## ⚙️ How It Works (Security Architecture)

VaultTester ensures zero hardcoded tokens by utilizing Auth0 Token Vault. Below is the complete workflow, from the user's perspective down to the server-to-server security mechanics.

### 1. User Journey & Logic (Flowchart)
```mermaid
graph TD;
    %% Styling agar teks hitam dan jelas terbaca di Dark Mode
    classDef startend fill:#bbf7d0,stroke:#15803d,stroke-width:2px,color:#000
    classDef decision fill:#f9a8d4,stroke:#be185d,stroke-width:2px,color:#000
    classDef process fill:#bfdbfe,stroke:#1d4ed8,stroke-width:2px,color:#000
    classDef error fill:#fca5a5,stroke:#b91c1c,stroke-width:2px,color:#000

    Start([Start]) --> IsLogged{User Logged In?}
    
    %% Alur jika belum login
    IsLogged -- No --> Login[Click Log In]
    Login --> Auth0{Auth0 Authentication}
    Auth0 -- Success --> StoreToken[Auth0 Stores Token in Vault]
    Auth0 -- Fails --> ErrorAuth[Show Auth Error]
    ErrorAuth --> Login
    StoreToken --> InputBug
    
    %% Alur jika sudah login
    IsLogged -- Yes --> InputBug[/User Types Raw Bug/]
    InputBug --> ClickAI[Click 'Format with AI']
    ClickAI --> Gemini[Gemini 3 Flash Processes Text]
    
    Gemini --> Valid{Is Response Valid?}
    Valid -- No --> ErrorAI[Show AI Error] --> InputBug
    Valid -- Yes --> ShowMD[/Show Markdown Report/]
    
    ShowMD --> ClickPub[Click 'Publish to GitHub']
    ClickPub --> CallM2M[Next.js Calls Auth0 M2M API]
    
    CallM2M --> HasToken{Token Found in Vault?}
    HasToken -- No --> ErrorToken[Unauthorized Error] --> Login
    HasToken -- Yes --> GetToken[Extract GitHub Token]
    
    GetToken --> PostGH[Post Issue to GitHub API]
    PostGH --> SuccessGH{Publish Success?}
    
    SuccessGH -- No --> ErrorGH[Show Publish Error] --> ClickPub
    SuccessGH -- Yes --> End([End / Display Issue Link])

    %% Menerapkan style ke node
    class Start,End startend;
    class IsLogged,Auth0,Valid,HasToken,SuccessGH decision;
    class StoreToken,Gemini,CallM2M,GetToken,PostGH process;
    class ErrorAuth,ErrorAI,ErrorToken,ErrorGH error;
```

### 2. Security & API Communication (Sequence Diagram)

```mermaid
sequenceDiagram
    actor User
    participant App as VaultTester (Next.js)
    participant Auth0 as Auth0 (Token Vault)
    participant AI as Gemini 3 Flash
    participant GitHub as GitHub API

    User->>App: 1. Click Login
    App->>Auth0: 2. Authenticate (Social Login)
    Auth0-->>App: 3. Return Session (Token stays in Vault)
    
    User->>App: 4. Submit raw bug complaint
    App->>AI: 5. Send text for QA formatting
    AI-->>App: 6. Return professional Markdown
    
    User->>App: 7. Click "Publish to GitHub"
    App->>Auth0: 8. Call Management API (M2M)
    Auth0-->>App: 9. Extract & Return GitHub Token
    App->>GitHub: 10. Post Issue using extracted Token
    GitHub-->>App: 11. Success! Return Issue URL
    App-->>User: 12. Display Success & Link
```

## Local Installation

To run this project locally, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/ArcVielLouvent/Vault-Tester.git
cd vault-tester
```

### 2. Install dependencies
```Bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and add the following keys:

```env
# Auth0 Configuration & Management API (M2M)
AUTH0_SECRET='your_auth0_secret_here'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_DOMAIN='your_auth0_domain_here'
AUTH0_CLIENT_ID='your_auth0_client_id_here'
AUTH0_CLIENT_SECRET='your_auth0_client_secret_here'

# Google Gemini AI
GEMINI_API_KEY='your_gemini_api_key_here'

# Target GitHub Repository
GITHUB_TARGET_REPO='your_github_target_repo_here'
```

### 4. Run the development server
```Bash
npm run dev
```
Open http://localhost:3000 with your browser to see the result.

**Author**

Armand Al-Farizy

GitHub: @ArcVielLouvent
---
This project was submitted for the Okta/Auth0 Hackathon.