export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: Request) {
  return Response.json({
    signals: [],
    status: 'ok'
  });
}

export async function POST(request: Request) {
  return Response.json({
    success: true,
    message: 'Signal received'
  });
}
