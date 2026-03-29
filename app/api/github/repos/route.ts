import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

interface Auth0Identity {
  provider: string;
  access_token?: string;
  [key: string]: any;
}

interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  [key: string]: any;
}

export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Akses ditolak. Silakan login.' }, { status: 401 });
    }

    const auth0Domain = process.env.AUTH0_DOMAIN;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;

    const m2mRes = await fetch(`https://${auth0Domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        audience: `https://${auth0Domain}/api/v2/`,
        grant_type: 'client_credentials'
      })
    });
    
    const m2mData = await m2mRes.json();
    const mgmtToken = m2mData.access_token;

    if (!mgmtToken) {
      return NextResponse.json({ error: 'Konfigurasi API Auth0 gagal.' }, { status: 500 });
    }

    const userRes = await fetch(`https://${auth0Domain}/api/v2/users/${session.user.sub}`, {
      headers: { 'Authorization': `Bearer ${mgmtToken}` }
    });
    
    const userData = await userRes.json();
    const githubIdentity = userData.identities?.find((i: Auth0Identity) => i.provider === 'github');
    const githubToken = githubIdentity?.access_token;

    if (!githubToken) {
      return NextResponse.json({ error: 'Token GitHub tidak ditemukan.' }, { status: 401 });
    }

    const reposResponse = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!reposResponse.ok) {
      throw new Error('Gagal mengambil daftar repositori');
    }

    const reposData = await reposResponse.json();
    
    const repos = reposData.map((repo: GitHubRepo) => ({
      id: repo.id,
      full_name: repo.full_name,
      name: repo.name,
      private: repo.private
    }));

    return NextResponse.json({ repos }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching repos:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}