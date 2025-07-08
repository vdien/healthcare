import { Webhook } from "svix";
import connectDB from "@/config/db";
import User from "@/models/User";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
  const wh = new Webhook(process.env.SIGNING_SECRET);
  const headerPayload = headers();
  const svixHeaders = {
    "svix-id": headerPayload.get("svix-id"),
    "svix-timestamp": headerPayload.get("svix-timestamp"),
    "svix-signature": headerPayload.get("svix-signature"),
  };

  // Kiểm tra sự tồn tại của các header bắt buộc
  if (!svixHeaders["svix-id"] || !svixHeaders["svix-timestamp"] || !svixHeaders["svix-signature"]) {
    return new NextResponse("Missing required headers", { status: 400 });
  }

  // Lấy payload và xác thực webhook
  const payload = await req.json();
  const body = JSON.stringify(payload);

  let data, type;
  try {
    ({ data, type } = wh.verify(body, svixHeaders));
  } catch (error) {
    return new NextResponse("Webhook verification failed", { status: 400 });
  }

  // Kiểm tra sự tồn tại của data và type
  if (!data || !type) {
    return new NextResponse("Invalid webhook payload", { status: 400 });
  }

  // Chuẩn bị dữ liệu người dùng
  const emailAddress = data.email_addresses?.[0]?.email_address || "";
  const name = `${data.first_name || ""} ${data.last_name || ""}`.trim();
  const userData = {
    _id: data.id,
    email: emailAddress,
    name,
    image: data.image_url || null,
  };

  // Kết nối đến cơ sở dữ liệu
  await connectDB();

  // Xử lý theo loại sự kiện
  try {
    switch (type) {
      case "user.created":
        await User.create(userData);
        break;
      case "user.updated":
        await User.findByIdAndUpdate(data.id, userData, { new: true });
        break;
      case "user.deleted":
        await User.findByIdAndDelete(data.id);
        break;
      default:
        console.log("Unhandled event type:", type);
        break;
    }
  } catch (error) {
    return new NextResponse("Database operation failed", { status: 500 });
  }

  return new NextResponse(JSON.stringify({ message: "Event received" }), { status: 200 });
}
