import { NextResponse } from 'next/server';

export async function GET() {
  const gemini = Boolean(process.env.GEMINI_API_KEY?.trim());
  const places = Boolean(process.env.GOOGLE_PLACES_API_KEY?.trim());
  const mapsBrowser = Boolean(process.env.NEXT_PUBLIC_MAPS_BROWSER_KEY?.trim());

  return NextResponse.json({
    ok: true,
    configured: {
      gemini,
      places,
      mapsBrowser,
    },
  });
}
