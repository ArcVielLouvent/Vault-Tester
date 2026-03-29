import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

interface Auth0Identity {
  provider: string;
  access_token?: string;
  [key: string]: any;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const repo = searchParams.get('repo');

    if (!repo) {
      return NextResponse.json({ error: 'Parameter repo dibutuhkan' }, { status: 400 });
    }

    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const userRes = await fetch(`https://${auth0Domain}/api/v2/users/${session.user.sub}`, {
      headers: { 'Authorization': `Bearer ${mgmtToken}` }
    });
    const userData = await userRes.json();
    const githubIdentity = userData.identities?.find((i: Auth0Identity) => i.provider === 'github');
    const githubToken = githubIdentity?.access_token;

    if (!githubToken) throw new Error("Token GitHub tidak ditemukan");

    const githubHeaders = {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
    };

    const [assigneesRes, labelsRes, milestonesRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${repo}/assignees`, { headers: githubHeaders }),
      fetch(`https://api.github.com/repos/${repo}/labels`, { headers: githubHeaders }),
      fetch(`https://api.github.com/repos/${repo}/milestones?state=open`, { headers: githubHeaders })
    ]);

    const assignees = assigneesRes.ok ? await assigneesRes.json() : [];
    const labels = labelsRes.ok ? await labelsRes.json() : [];
    const milestones = milestonesRes.ok ? await milestonesRes.json() : [];

    return NextResponse.json({
      assignees: assignees.map((a: any) => a.login),
      labels: labels.map((l: any) => l.name),
      milestones: milestones.map((m: any) => ({ id: m.number, title: m.title }))
    });

  } catch (error: any) {
    console.error('Error mengambil detail repo:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail repositori' }, { status: 500 });
  }
}