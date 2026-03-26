import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  // Next.js may evaluate this on the server; failing fast helps debugging.
  console.warn("MONGODB_URI is not set. MongoDB connection will fail until you set it.")
}

const cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } = {
  conn: null,
  promise: null,
}

export async function connectToMongo(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn
  if (!MONGODB_URI) throw new Error("Missing MONGODB_URI env var")

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {})
      .then((mongooseInstance) => mongooseInstance)
  }

  cached.conn = await cached.promise
  return cached.conn
}

