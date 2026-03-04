import mongoose from 'mongoose';

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    permissions: [{
        type: String,
    }],
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        default: null, // System roles have no organization
    },
    isSystemRole: {
        type: Boolean,
        default: false,
    },
});

let Role;
try {
    Role = mongoose.model('Role');
} catch (e) {
    Role = mongoose.model('Role', RoleSchema);
}
export default Role;
