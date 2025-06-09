import mongoose, { Document } from 'mongoose';

export interface IContact extends Document {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  pronouns: string;
  customerId: string;
  hubspotId?: string;
  pipedriveId?: string;
  sources: Array<'local' | 'hubspot' | 'pipedrive'>;
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
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
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    jobTitle: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100,
      default: '',
    },
    pronouns: {
      type: String,
      required: false,
      trim: true,
      maxlength: 20,
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
      maxlength: 50,
    },
    pipedriveId: {
      type: String,
      trim: true,
      sparse: true,
      maxlength: 50,
    },
    sources: {
      type: [String],
      enum: ['local', 'hubspot', 'pipedrive'],
      default: ['local'],
      validate: {
        validator: function(v: string[]) {
          return v.length > 0 && v.every(s => ['local', 'hubspot', 'pipedrive'].includes(s));
        },
        message: 'At least one valid source is required'
      }
    },
    deleted: {
      type: Boolean,
      default: false,
      index: true
    },
  },
  {
    timestamps: true,
  }
);

// Create compound indices for common queries
contactSchema.index({ customerId: 1, email: 1 }, { unique: true });
contactSchema.index({ customerId: 1, createdAt: -1 });

// Add middleware to clean data before saving
contactSchema.pre('save', function(next) {
  const doc = this as IContact;
  
  // Trim all string fields
  const stringFields: (keyof IContact)[] = ['name', 'email', 'phone', 'jobTitle', 'pronouns', 'customerId', 'hubspotId', 'pipedriveId'];
  stringFields.forEach(field => {
    const value = doc[field];
    if (typeof value === 'string') {
      doc[field] = value.trim();
    }
  });
  
  // Remove duplicate sources
  if (Array.isArray(doc.sources)) {
    doc.sources = [...new Set(doc.sources)] as Array<'local' | 'hubspot' | 'pipedrive'>;
  }
  
  next();
});

export const Contact = mongoose.model<IContact>('Contact', contactSchema); 