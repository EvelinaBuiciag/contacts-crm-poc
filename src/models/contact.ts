import mongoose from 'mongoose';

export interface IContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobTitle?: string;
  pronouns?: string;
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
  hubspotId?: string;
  pipedriveId?: string;
  sources: Array<'local' | 'hubspot' | 'pipedrive'>;
}

// Delete existing model if it exists to force schema update
if (mongoose.models.Contact) {
  delete mongoose.models.Contact;
}

const contactSchema = new mongoose.Schema<IContact>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      default: '(No phone)',
    },
    jobTitle: {
      type: String,
      required: false,
      trim: true,
      default: '',
    },
    pronouns: {
      type: String,
      required: false,
      trim: true,
      default: '',
    },
    customerId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    hubspotId: {
      type: String,
      trim: true,
      sparse: true,
    },
    pipedriveId: {
      type: String,
      trim: true,
      sparse: true,
    },
    sources: {
      type: [String],
      enum: ['local', 'hubspot', 'pipedrive'],
      default: ['local'],
    },
  },
  {
    timestamps: true,
  }
);

// Create compound indices for common queries
contactSchema.index({ customerId: 1, createdAt: -1 });
contactSchema.index({ customerId: 1, hubspotId: 1 }, { sparse: true });
contactSchema.index({ customerId: 1, pipedriveId: 1 }, { sparse: true });
// Add compound unique index for customerId + email to prevent duplicates
contactSchema.index({ customerId: 1, email: 1 }, { unique: true });

export const Contact = mongoose.model<IContact>('Contact', contactSchema); 