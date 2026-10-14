import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    division: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    upazila: { type: String, required: true, trim: true },
    divisions: [{ type: String, trim: true }],
    districts: [{ type: String, trim: true }],
    upazilas: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

locationSchema.index({ division: 1, district: 1, upazila: 1 }, { unique: true });

export default mongoose.models.Location || mongoose.model('Location', locationSchema);
