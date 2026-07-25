import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { url, sheetId, gid } = body;

    let targetSheetId = sheetId;
    let targetGid = gid;

    if (url) {
      // Extract sheetId from URL like: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
      const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        targetSheetId = match[1];
      }
      const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
      if (gidMatch) {
        targetGid = gidMatch[1];
      }
    }

    if (!targetSheetId) {
      return NextResponse.json({ error: 'Missing or invalid Google Sheet ID/URL' }, { status: 400 });
    }

    // Construct export CSV URL
    let csvExportUrl = `https://docs.google.com/spreadsheets/d/${targetSheetId}/export?format=csv`;
    if (targetGid) {
      csvExportUrl += `&gid=${targetGid}`;
    }

    const response = await fetch(csvExportUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json({
        error: `Google Sheets request failed with status ${response.status}. Please make sure your sheet access is set to "Anyone with the link can view".`
      }, { status: response.status });
    }

    const csvText = await response.text();

    if (csvText.includes('<!DOCTYPE html>') || csvText.includes('<html')) {
      return NextResponse.json({
        error: 'Google Sheet returned an HTML login page instead of CSV data. Please share the Google Sheet as "Anyone with the link can view" in Google Sheets Share Settings.'
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      sheetId: targetSheetId,
      csvText
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
