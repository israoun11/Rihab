import mongoose, { Schema, type InferSchemaType } from "mongoose";

/* ---------- Images embedded in projects ---------- */
const ImageSchema = new Schema(
  {
    src: { type: String, required: true },
    alt: { type: String, default: "" },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    srcSet: { type: String },
    demo: { type: Boolean },
  },
  { _id: false },
);

/* ---------- Editable page content: one document per page, keyed by page ---------- */
const ContentPageSchema = new Schema(
  {
    _id: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false },
);
export const ContentPage = mongoose.model("ContentPage", ContentPageSchema, "content");

/* ---------- Categories ---------- */
const CategorySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true },
);
export const CategoryModel = mongoose.model("Category", CategorySchema);
export type CategoryDoc = InferSchemaType<typeof CategorySchema> & { _id: mongoose.Types.ObjectId };

/* ---------- Projects ---------- */
const ProjectSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    place: { type: String, required: true },
    category: { type: String, required: true, index: true },
    typeLabel: { type: String, required: true },
    description: { type: String, required: true },
    attribution: { type: String, default: "" },
    cover: { type: ImageSchema, required: true },
    images: { type: [ImageSchema], default: [] },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true },
);
export const ProjectModel = mongoose.model("Project", ProjectSchema);
export type ProjectDoc = InferSchemaType<typeof ProjectSchema> & { _id: mongoose.Types.ObjectId };

/* ---------- Administrators ---------- */
const AdminUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);
export const AdminUser = mongoose.model("AdminUser", AdminUserSchema);

/* ---------- Sessions (token stored hashed; expired sessions removed by a TTL index) ---------- */
const SessionSchema = new Schema({
  tokenHash: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true, index: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: () => new Date() },
});
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const SessionModel = mongoose.model("Session", SessionSchema);
