export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  return Response.json({
    success: true,
    settings: {
      assets: [],
      notifications: false
    }
  });
}

export async function POST(request: Request) {
  return Response.json({
    success: true,
    message: 'Settings updated'
  });
}
