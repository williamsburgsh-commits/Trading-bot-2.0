export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    return Response.json({
      signals: [],
      total: 0,
      metrics: {
        winRate: 0,
        avgProfit: 0,
        totalSignals: 0,
        closedSignals: 0,
        activeSignals: 0,
      },
      status: 'ok'
    });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch signals' }, { status: 500 });
  }
}
