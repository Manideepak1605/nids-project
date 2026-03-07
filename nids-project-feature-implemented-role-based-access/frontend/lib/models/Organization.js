import mongoose from 'mongoose';

const OrganizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    subscriptionPlan: {
        type: String,
        enum: ['basic', 'pro', 'enterprise'],
        default: 'basic',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

let Organization;
try {
    Organization = mongoose.model('Organization');
} catch (e) {
    Organization = mongoose.model('Organization', OrganizationSchema);
}
export default Organization;
