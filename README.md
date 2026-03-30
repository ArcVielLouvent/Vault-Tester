# 🛡️ VaultTester: Secure AI Bug Reporter

> **Built for the Okta/Auth0 Hackathon** 🚀

VaultTester is an AI-powered QA assistant that takes informal, raw bug complaints and transforms them into professional, industry-standard GitHub Issues. Most importantly, it completely eliminates the need for hardcoded Personal Access Tokens (PATs) by leveraging the **Auth0 Token Vault**.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://vault-tester.vercel.app/)
[![Video Demo](https://img.shields.io/badge/Video_Demo-YouTube-red?style=for-the-badge&logo=youtube)](https://youtu.be/czRnx-C8-LM)

## ✨ The Problem & The Solution

**The Problem:** AI Agents acting on behalf of users (like posting to external APIs such as GitHub) usually require developers to store sensitive Personal Access Tokens in environment variables or databases. This is a massive security risk.

**The Solution:** VaultTester uses **Auth0 Token Vault**. Users authenticate via GitHub Social Login through Auth0. When the AI agent is ready to publish the formatted report, our Next.js backend dynamically retrieves the user's temporary GitHub access token via the Auth0 Management API. 
**Result:** Zero hardcoded tokens. 100% Secure. The AI is fully *Authorized to Act*.

## 🚀 Key Features

- **Auth0 Social Login:** Secure authentication using GitHub.
- **Agentic AI Workflow:** Powered by **Google Gemini 3 Flash**, translating casual bug descriptions into structured Markdown (Title, Description, Steps to Reproduce, Expected/Actual Behavior).
- **Dynamic GitHub Metadata Triage:** Automatically fetches the user's live repositories, available assignees, and labels directly from GitHub API before publishing.
- **Auth0 Token Vault Integration:** Securely extracts Identity Provider (IdP) tokens via Machine-to-Machine (M2M) Management API.
- **Direct GitHub Publishing:** Pushes the finalized QA report directly to the user's repository without exposing credentials to the frontend.

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
    A([Start]) --> B{Logged In?};
    B -- No --> C[Click Log In];
    C --> D{Auth0 Auth & Consent};
    D -- Success --> E[Auth0 Stores Token in Vault];
    D -- Fails --> C;
    B -- Yes --> F[Type Raw Bug Complaint];
    E --> F;
    F --> G[Click 'Format with AI'];
    G --> H[Gemini Processes Text];
    H --> I{Success?};
    I -- No --> F;
    I -- Yes --> J[Show Markdown Report];
    J --> K[App Fetches Repos & Metadata securely];
    K --> L[User Selects Repo, Assignees, Labels];
    L --> M[Click 'Publish to GitHub'];
    M --> N[Call Auth0 M2M API];
    N --> O{Token in Vault?};
    O -- No --> C;
    O -- Yes --> P[Extract Token Server-Side];
    P --> Q[Post Issue to GitHub API];
    Q --> R{Publish Success?};
    R -- No --> M;
    R -- Yes --> S([End / Show GitHub Link]);
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
    
    App->>Auth0: 7. Fetch Token in Background
    Auth0-->>App: 8. Return Token to Server
    App->>GitHub: 9. Fetch Repositories, Assignees & Labels
    GitHub-->>App: 10. Display Metadata in UI
    
    User->>App: 11. Select Metadata & Click "Publish"
    App->>GitHub: 12. Post Issue using Vault Token
    GitHub-->>App: 13. Success! Return Issue URL
    App-->>User: 14. Display Success & Link
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
AUTH0_ISSUER_BASE_URL='https://your_tenant.us.auth0.com'
AUTH0_CLIENT_ID='your_auth0_client_id_here'
AUTH0_CLIENT_SECRET='your_auth0_client_secret_here'
AUTH0_DOMAIN='your_tenant.us.auth0.com'

# Google Gemini AI
GEMINI_API_KEY='your_gemini_api_key_here'

# Note: No hardcoded target repository is needed! The app fetches it dynamically using the Vault token.
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