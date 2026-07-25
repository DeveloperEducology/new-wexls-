import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { webhookUrl, columns, rows } = body;

    if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.startsWith('https://script.google.com/')) {
      return NextResponse.json({
        error: 'Invalid Google Apps Script Webhook URL. It must start with https://script.google.com/macros/s/.../exec'
      }, { status: 400 });
    }

    // Proxy POST to Google Apps Script (following redirects)
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columns, rows }),
      redirect: 'follow'
    });

    const resText = await response.text();
    let resJson;
    try {
      resJson = JSON.parse(resText);
    } catch {
      resJson = { status: 'success', raw: resText };
    }

    return NextResponse.json({
      success: true,
      result: resJson
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
