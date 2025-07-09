// app/api/knowledge/import/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Knowledge from '@/models/Knowledge';
import csv from 'csv-parser';

export const dynamic = 'force-dynamic'; // tránh cache route

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, error: 'File is missing' });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const results = [];
    const text = buffer.toString('utf-8');

    // Parse CSV thủ công
    const lines = text.split('\n').filter(Boolean);
    const headers = lines[0].split(',');

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      const entry = {};

      headers.forEach((header, index) => {
        entry[header.trim()] = row[index]?.trim();
      });

      results.push(entry);
    }

    await connectDB();

    // Save vào MongoDB
    await Knowledge.insertMany(results);

    return NextResponse.json({ success: true, count: results.length });
  } catch (err) {
    console.error('CSV Upload Error:', err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
