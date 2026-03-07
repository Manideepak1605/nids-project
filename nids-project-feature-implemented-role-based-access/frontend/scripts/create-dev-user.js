import dbConnect from '../lib/db';
import User from '../lib/models/User';
import Role from '../lib/models/Role';
import Organization from '../lib/models/Organization';
import bcrypt from 'bcryptjs';

async function createDevUser() {
    try {
        await dbConnect();

        // 1. Get or Create Default Org
        let org = await Organization.findOne({ name: 'Default Organization' });
        if (!org) {
            org = await Organization.create({
                name: 'Default Organization',
                subscriptionPlan: 'enterprise'
            });
            console.log('Created Default Organization');
        }

        // 2. Get or Create Developer Role
        let devRole = await Role.findOne({ name: 'developer' });
        if (!devRole) {
            console.log('Developer role not found. Creating it...');
            devRole = await Role.create({
                name: 'developer',
                permissions: ['developer_override', 'all_access'], // Define some high-level permissions
                isSystemRole: true
            });
            console.log('Created Developer role.');
        }

        // 3. Create User
        const email = 'developer@gmail.com';
        const password = '12345'; // User provided password

        // Check if exists
        const existing = await User.findOne({ email });
        if (existing) {
            console.log('User already exists. Updating role...');
            existing.role = devRole._id;
            existing.organization = org._id;
            // Update password for development ease
            const salt = await bcrypt.genSalt(10);
            existing.password = await bcrypt.hash(password, salt);
            await existing.save();
            console.log('Developer user updated successfully.');
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await User.create({
                name: 'Developer',
                email,
                password: hashedPassword,
                role: devRole._id,
                organization: org._id,
                isActive: true
            });
            console.log('Developer user created successfully.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating dev user:', error);
        process.exit(1);
    }
}

createDevUser();
