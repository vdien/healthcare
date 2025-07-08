import mongoose from "mongoose";

let cached = global.mongoose || { conn: null, promise: null };

export default async function connectDB() {
    if (cached.conn) return cached.conn;

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("❌ MONGODB_URI is not defined in environment variables");
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }).then((mongoose) => mongoose);
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        console.error("❌ Error connecting to MongoDB:", error);
        throw error;
    }

    return cached.conn;
}
