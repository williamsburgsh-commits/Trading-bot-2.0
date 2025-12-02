export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, password } = body;

    if (action === 'login') {
      if (username === 'admin' && password === 'admin123') {
        return Response.json({
          success: true,
          user: { username, role: 'admin' },
          token: 'demo-token-' + Date.now(),
        });
      }
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (action === 'verify') {
      const token = body.token;
      if (token && token.startsWith('demo-token-')) {
        return Response.json({
          success: true,
          user: { username: 'admin', role: 'admin' },
        });
      }
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in auth:', error);
    return Response.json(
      { error: 'Authentication failed', message: error.message },
      { status: 500 }
    );
  }
}
