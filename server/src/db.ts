import mongoose from "mongoose";

type GridFSBucket = InstanceType<typeof mongoose.mongo.GridFSBucket>;

export async function connectDb(uri: string): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

let bucket: GridFSBucket | null = null;

/** Uploaded images are stored in MongoDB (GridFS), so the database holds all site data. */
export function mediaBucket(): GridFSBucket {
  const db = mongoose.connection.db;
  if (!db) throw new Error("La base de données n'est pas connectée.");
  if (!bucket) bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "media" });
  return bucket;
}

export function resetMediaBucket(): void {
  bucket = null;
}
