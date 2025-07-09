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
            return NextResponse.json({ success:false , error: " User not authenticated" });
        }
        // Create a new chat document
        const chatData ={
            name:"New Chat",
            messages: [],
            userId,
        };
        // Connect to the database
        await connectDB();
        await Chat.create(chatData);
        // Return the created chat document
        return NextResponse.json({ success: true, message: "chat created" });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message });
    }

}