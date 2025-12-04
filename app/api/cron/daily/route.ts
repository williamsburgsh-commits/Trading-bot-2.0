export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: Request) {
  return Response.json({
    success: true,
    message: 'Daily cron executed',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: Request) {
  return Response.json({
    success: true,
    message: 'Daily cron executed',
    timestamp: new Date().toISOString()
  });
}
