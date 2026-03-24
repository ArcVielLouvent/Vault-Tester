import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function POST(req: Request) {
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
      console.error("Gagal mendapat kunci brankas Auth0", m2mData);
      return NextResponse.json({ error: 'Konfigurasi API Auth0 gagal.' }, { status: 500 });
    }

    const userRes = await fetch(`https://${auth0Domain}/api/v2/users/${session.user.sub}`, {
      headers: { 'Authorization': `Bearer ${mgmtToken}` }
    });
    
    const userData = await userRes.json();
    const githubIdentity = userData.identities?.find((i: any) => i.provider === 'github');
    const githubToken = githubIdentity?.access_token;

    if (!githubToken) {
      return NextResponse.json({ error: 'Token GitHub tidak ditemukan. Pastikan login dengan GitHub.' }, { status: 401 });
    }

    const { issueText } = await req.json();
    if (!issueText) {
      return NextResponse.json({ error: 'Teks laporan kosong.' }, { status: 400 });
    }

    const titleMatch = issueText.match(/\*\*Title:\*\* (.*)/);
    const issueTitle = titleMatch ? titleMatch[1] : `AI Bug Report - ${new Date().toLocaleDateString()}`;

    const repoFullName = process.env.GITHUB_TARGET_REPO;

    const res = await fetch(`https://api.github.com/repos/${repoFullName}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueText
      })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Gagal memposting ke GitHub');
    }

    const data = await res.json();
    return NextResponse.json({ url: data.html_url });

  } catch (error: any) {
    console.error('Error Sistem:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}