export const maxDuration = 60 * 60; // 1 hour
import connectDB from '@/config/db';
import Chat from "@/models/Chat";
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import OpenAi from 'openai';
const openAi = new OpenAi({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY,
})
export async function POST(req) {
    try {
        const { userId } = getAuth(req);

        const { chatId, prompt } = await req.json();

        if (!userId) {
            return NextResponse(JSON({ success: false, error: "User not authenticated" }));
        }
     
        await connectDB();
        const data = await Chat.findOne({ userId, _id: chatId });

        //create a user message object
        const userPrompt = {
            role: 'user',
            content: prompt,
            timestamp: Date.now(),
        };
        data.messages.push(userPrompt);

        // Call the DeepSeek API to get a chat completion
        const completion = await openAi.chat.completions.create({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            store: true,
        });

        const message = completion.choices[0].message;
        message.timestamp = Date.now();
        data.messages.push(message);
        data.save();
        // Return the response from DeepSeek
        return NextResponse.json({ success: true, data: message });
    } catch (error) {

        return NextResponse.json({ success: false, error: error.message });
    }
}
