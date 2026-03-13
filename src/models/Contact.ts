import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    status: 'unread' | 'read';
    createdAt: Date;
    updatedAt: Date;
}

const ContactSchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: false },
        subject: { type: String, required: true },
        message: { type: String, required: true },
        status: { type: String, enum: ['unread', 'read'], default: 'unread' },
    },
    { timestamps: true }
);

export default mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);
