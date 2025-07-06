import { Webhook } from "svix";
import connectDB from "@/config/db";
import User from "@/models/User";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(req) {
    const wh = new Webhook(process.env.SIGNING_SECRET);
    const headerPayload = headers();
    const svixHeaders = {
        "svix-id": headerPayload.get("svix-id"),
        "svix-timestamp": headerPayload.get("svix-timestamp"),
        "svix-signature": headerPayload.get("svix-signature"),
    };
    //get the payload and verify it
    const payload = await req.json();
    const body = JSON.stringify(payload);
    const { data, type } = wh.verify(body, svixHeaders);
    //prepare the user data to be saved in the database
    const userData = {
        _id: data.id,
        name: `${data.first_name} ${data.last_name}`,
        email: data.email_addresses[0].email_address,
        image: data.image_url,
    };
    //connect to the database
    await connectDB();
    
    switch (type) {
        case "user.created":
            //create a new user
            await User.create(userData);
            break;
        case "user.updated":
            //update the user
            await User.findByIdAndUpdate(data.id, userData, { new: true });
            break;
        case "user.deleted":
            //delete the user
            await User.findByIdAndDelete(data.id);
            break;
        default:
            console.log("Unhandled event type:", type);
            break;
    }
    return NextRequest.json({
        message: "Event received"
    });
}