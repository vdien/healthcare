export const maxDuration = 60 * 60; // 1 hour

import connectDB from '@/config/db';
import Chat from '@/models/Chat';
import Knowledge from '@/models/Knowledge';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    const { chatId, prompt } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: "User not authenticated" });
    }

    await connectDB();
    const chat = await Chat.findOne({ userId, _id: chatId });
    if (!chat) throw new Error('Chat không tồn tại');

    // Lưu câu hỏi của user
    const userMsg = { role: 'user', content: prompt, timestamp: Date.now() };
    chat.messages.push(userMsg);

    // Tìm kiếm kiến thức liên quan (3 item)
    const matches = await Knowledge.find({
      $text: { $search: prompt }
    }, { score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" } })
    .limit(3);

    let replyContent;
    if (matches.length) {
      replyContent = matches.map((k, i) => `**${i+1}. ${k.title}**\n${k.content}`).join('\n\n');
    } else {
      replyContent = 'Xin lỗi, mình chưa tìm thấy dữ liệu liên quan. Mình đã lưu câu hỏi này để cập nhật thêm.';
    }

    const assistantMsg = { role: 'assistant', content: replyContent, timestamp: Date.now() };
    chat.messages.push(assistantMsg);
    await chat.save();

    return NextResponse.json({
      success: true,
      data: {
        choices: [{ index: 0, message: assistantMsg }],
      },
    });
  } catch (error) {
    console.error("Chatbot route error:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
