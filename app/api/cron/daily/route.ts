export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    return Response.json({
      success: true,
      message: 'Daily cron job triggered',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    return Response.json({
      success: true,
      message: 'Daily cron job executed',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
