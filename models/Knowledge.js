import mongoose from 'mongoose';

const knowledgeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    content: { type: String, required: true },
    tags: { type: [String], default: [] },
    category: { type: String, required: true },
    source: { type: String },
    createdBy: { type: String, required: true }, // userId của người tạo
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

knowledgeSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.models.Knowledge || mongoose.model('Knowledge', knowledgeSchema);