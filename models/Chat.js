import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    title: { type: String, default: 'New Chat' },
    messages: [messageSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

chatSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.models.Chat || mongoose.model('Chat', chatSchema);