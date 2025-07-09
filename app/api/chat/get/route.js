import connectDB from '@/config/db';
import Chat from "@/models/Chat";
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        // Get the authenticated user
        const { userId } = await getAuth(req);

        // If userId is not found, return an error response
        if (!userId) {
            return NextResponse.json({ success: false, error: "User not authenticated" });
        }
        // Connect to the database
        await connectDB();
        const data = await Chat.find({ userId });
        // Return the created chat document
        return NextResponse.json({ success: true, data });
    } catch(error) {
        console.error("❌ Error in /api/chat/get:", error);
        return NextResponse.json({ success: false, error: error.message });
    }
}