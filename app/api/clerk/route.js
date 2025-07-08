import { Webhook } from "svix";
import connectDB from "@/config/db";
import User from "@/models/User";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    await connectDB();
    return new Response("✅ Connected to DB", { status: 200 });
  } catch {
    return new Response("❌ Failed to connect to DB", { status: 500 });
  }
}