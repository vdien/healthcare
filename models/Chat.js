import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        messages: [
            {
                role: { type: String, required: true }, // 'user' or 'assistant'
                content: { type: String, required: true },
                timestamp: { type: Number, required: true }
            },
        ],
        userId: { type: String, required: true }, // Reference to the user who created the chat
    },
    { timestamps: true }
);

const Chat = mongoose.models.Chat || mongoose.model("Chat", ChatSchema);

export default Chat;