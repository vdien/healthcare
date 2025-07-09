import connectDB from '@/config/db';
import Chat from "@/models/Chat";
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server"; 
export async function POST(req) {
    try {
        // Get the authenticated user
        const { userId } = await getAuth(req);
        const { chatId } = await req.json();

        // If userId is not found, return an error response
        if (!userId) {
            return NextResponse.json({ success: false, error: "User not authenticated" });
        }

        // Connect to the database
        await connectDB();

        // Fetch all chats for the authenticated user
        await Chat.deleteOne({ _id: chatId, userId });

        // Return the list of chats
        return NextResponse.json({ success: true, message: "Chat deleted successfully" });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message });
    }
}