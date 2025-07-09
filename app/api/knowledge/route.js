export const maxDuration = 60 * 60; // 1 hour

import connectDB from '@/config/db';
import Knowledge from "@/models/Knowledge";
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { parse } from 'papaparse';

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const { data, errors, meta } = parse(text, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      delimiter: ',',
      quoteChar: '"'
    });

    if (errors.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: "CSV parse error",
        details: errors.map(e => `${e.row}: ${e.message}`)
      }, { status: 400 });
    }

    // Validate CSV structure
    const requiredFields = ['title', 'description', 'content', 'category'];
    const missingFields = requiredFields.filter(field => !meta.fields.includes(field));
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 });
    }

    // Process data
    const knowledgeItems = data.map(item => ({
      title: item.title?.trim() || '',
      description: item.description?.trim() || '',
      content: item.content?.trim() || '',
      tags: item.tags ? item.tags.split(',').map(tag => tag.trim()) : [],
      category: item.category?.trim() || 'Khác',
      source: item.source?.trim() || '',
      createdBy: userId
    }));

    await connectDB();
    const result = await Knowledge.insertMany(knowledgeItems);

    return NextResponse.json({
      success: true,
      count: result.length
    });

  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ success: false, error: "User not authenticated" });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const category = searchParams.get('category') || '';

    const searchFilter = query ? {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ]
    } : {};

    const categoryFilter = category ? { category } : {};

    const knowledge = await Knowledge.find({
      ...searchFilter,
      ...categoryFilter
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: knowledge
    });

  } catch (error) {
    console.error("❌ Lỗi khi lấy knowledge:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}