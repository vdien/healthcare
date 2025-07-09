import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect("mongodb://localhost:27017/healthbot", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: "healthbot", // tên DB của bạn
    });

    isConnected = true;
    console.log("✅ MongoDB connected at", conn.connection.host);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
};

export default connectDB;
