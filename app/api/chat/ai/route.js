export const maxDuration = 60 * 60; // 1 hour

import connectDB from '@/config/db';
import Chat from "@/models/Chat";
import Knowledge from "@/models/Knowledge";
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
    console.log("✅ Đã kết nối MongoDB thành công");

    // Tìm kiếm kiến thức liên quan
    const relatedKnowledge = await Knowledge.find({
      $or: [
        { title: { $regex: prompt, $options: 'i' } },
        { description: { $regex: prompt, $options: 'i' } },
        { tags: { $regex: prompt, $options: 'i' } }
      ]
    }).limit(3);

    // Tìm chat của user theo ID
    let chat = await Chat.findOne({ userId, _id: chatId });

    if (!chat) {
      // Tạo chat mới nếu không tìm thấy
      chat = new Chat({
        userId,
        title: prompt.substring(0, 50),
        messages: []
      });
    }

    // Thêm message của user
    const userPrompt = {
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };
    chat.messages.push(userPrompt);

    // Tạo câu trả lời dựa trên kiến thức
    let assistantReply;
    if (relatedKnowledge.length > 0) {
      // Tạo câu trả lời từ kiến thức có sẵn
      const knowledgeContent = relatedKnowledge.map(k => 
        `**${k.title}**\n${k.content.substring(0, 500)}...`
      ).join('\n\n---\n\n');
      
      assistantReply = {
        role: 'assistant',
        content: `Dựa trên kiến thức sức khỏe của chúng tôi:\n\n${knowledgeContent}\n\nBạn cần thêm thông tin gì không?`,
        timestamp: Date.now(),
        sources: relatedKnowledge.map(k => k._id.toString())
      };
    } else {
      // Trả lời mặc định nếu không tìm thấy kiến thức
      assistantReply = {
        role: 'assistant',
        content: `Tôi không tìm thấy thông tin cụ thể về "${prompt}" trong cơ sở kiến thức sức khỏe. Bạn có thể mô tả rõ hơn về vấn đề của mình không?`,
        timestamp: Date.now()
      };
    }
    
    chat.messages.push(assistantReply);

    // Lưu vào database
    await chat.save();
    console.log("💾 Đã lưu message vào MongoDB");

    // Trả dữ liệu về client
    return NextResponse.json({
      success: true,
      data: {
        id: chat._id.toString(),
        object: "chat.completion",
        created: Date.now(),
        choices: [
          {
            index: 0,
            message: assistantReply,
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: prompt.length,
          completion_tokens: assistantReply.content.length,
          total_tokens: prompt.length + assistantReply.content.length,
        },
      },
    });

  } catch (error) {
    console.error("❌ Lỗi xử lý chatbot route:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}