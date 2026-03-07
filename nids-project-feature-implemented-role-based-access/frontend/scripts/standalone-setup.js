const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb://localhost:27017/appdb';

async function setup() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Organization
        const OrganizationSchema = new mongoose.Schema({
            name: { type: String, required: true },
            subscriptionPlan: { type: String, enum: ['basic', 'pro', 'enterprise'], default: 'basic' }
        });
        const Organization = mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);

        let org = await Organization.findOne({ name: 'Default Organization' });
        if (!org) {
            org = await Organization.create({ name: 'Default Organization', subscriptionPlan: 'enterprise' });
            console.log('Created Default Organization');
        }

        // 2. Role
        const RoleSchema = new mongoose.Schema({
            name: { type: String, required: true },
            permissions: [String],
            isSystemRole: { type: Boolean, default: false }
        });
        const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);

        let devRole = await Role.findOne({ name: 'developer' });
        if (!devRole) {
            devRole = await Role.create({
                name: 'developer',
                permissions: ['developer_override', 'all_access'],
                isSystemRole: true
            });
            console.log('Created Developer Role');
        }

        // 3. User
        const UserSchema = new mongoose.Schema({
            name: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
            role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
            isActive: { type: Boolean, default: true }
        });
        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        const email = 'developer@gmail.com';
        const rawPassword = '12345';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            existingUser.password = hashedPassword;
            existingUser.role = devRole._id;
            existingUser.organization = org._id;
            await existingUser.save();
            console.log('Updated existing Developer user');
        } else {
            await User.create({
                name: 'Developer',
                email,
                password: hashedPassword,
                role: devRole._id,
                organization: org._id,
                isActive: true
            });
            console.log('Created Developer user');
        }

        console.log('Setup complete. You can now log in with:');
        console.log('Email: developer@gmail.com');
        console.log('Password: 12345');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error during setup:', error);
        process.exit(1);
    }
}

setup();
