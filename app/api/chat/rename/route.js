import connectDB from '@/config/db';
import Chat from "@/models/Chat";
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server"; 
export async function POST(req) {
    try {
        // Get the authenticated user
        const { userId } = await getAuth(req);

        // If userId is not found, return an error response
        if (!userId) {
            return NextResponse.json({ success: false, error: "User not authenticated" });
        }

        // Connect to the database
        await connectDB();

        // Fetch all chats for the authenticated user
        const {chatId , name} = await req.json();
        await Chat.findOneAndUpdate({_id: chatId, userId}, {name});
        // Return the list of chats
        return NextResponse.json({ success: true,message:"Chat Renamed" });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message });
    }
}