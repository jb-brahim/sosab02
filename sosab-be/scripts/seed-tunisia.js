const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config({ path: '.env.development' });

// Load Models
const User = require('../models/User');
const Project = require('../models/Project');
const Worker = require('../models/Worker');
const Material = require('../models/Material');
const DailyReport = require('../models/DailyReport');
const Notification = require('../models/Notification');
const Task = require('../models/Task');

// Connect to DB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedData = async () => {
    try {
        await connectDB();

        console.log('Cleaning database (preserving Admin)...');
        // Delete all users EXCEPT admin@sosab.com
        await User.deleteMany({ email: { $ne: 'admin@sosab.com' } });
        await Project.deleteMany({});
        await Worker.deleteMany({});
        await Material.deleteMany({});
        await DailyReport.deleteMany({});
        await Notification.deleteMany({});
        await Task.deleteMany({});

        console.log('Upserting Admin & Creating Users...');

        // Admin handling
        let admin = await User.findOne({ email: 'admin@sosab.com' });
        if (!admin) {
            admin = await User.create({
                name: 'Admin User',
                email: 'admin@sosab.com',
                password: 'Adminsosab',
                role: 'Admin',
                active: true
            });
            console.log('Admin created');
        } else {
            console.log('Admin already exists, skipping creation');
        }

        const users = await User.create([
            {
                name: 'Sami Ben Ammar',
                email: 'sami.ammar@sosab.com',
                password: 'password123',
                role: 'Project Manager',
                active: true
            },
            {
                name: 'Leila Trabelsi',
                email: 'leila.trabelsi@sosab.com',
                password: 'password123',
                role: 'Project Manager',
                active: true
            },
            {
                name: 'Karim Jlassi',
                email: 'karim.jlassi@sosab.com',
                password: 'password123',
                role: 'Accountant',
                active: true
            }
        ]);

        const pmSami = users[0];
        const pmLeila = users[1];

        console.log('Creating Projects...');
        const projects = await Project.create([
            {
                name: 'Cité de la Culture Extension',
                location: 'Ave Mohamed V, Tunis',
                budget: 4500000,
                startDate: new Date('2024-01-15'),
                endDate: new Date('2025-06-30'),
                managerId: pmSami._id,
                progress: 35,
                status: 'Active',
                description: 'New exhibition wing and underground parking.'
            },
            {
                name: 'Sfax Solar Plant',
                location: 'Route de Gabès, Sfax',
                budget: 12500000,
                startDate: new Date('2023-11-01'),
                endDate: new Date('2024-12-31'),
                managerId: pmLeila._id,
                progress: 78,
                status: 'Active',
                description: '50MW Photovoltaic installation.'
            },
            {
                name: 'Marina Bizerte Renovation',
                location: 'Vieux Port, Bizerte',
                budget: 850000,
                startDate: new Date('2024-03-01'),
                endDate: new Date('2024-09-15'),
                managerId: pmSami._id,
                progress: 15,
                status: 'Active',
                description: 'Dock repair and promenade upgrades.'
            },
            {
                name: 'Sousse Mall Expansion',
                location: 'Kalaâ Kebira, Sousse',
                budget: 6200000,
                startDate: new Date('2024-02-10'),
                endDate: new Date('2025-04-20'),
                managerId: pmLeila._id,
                progress: 5,
                status: 'Planning',
                description: 'New retail floor and food court.'
            }
        ]);

        console.log('Creating Workers...');
        const workers = await Worker.create([
            {
                name: 'Ahmed Dridi',
                projectId: projects[0]._id,
                dailySalary: 45,
                contact: { phone: '20123456', address: 'Tunis' },
                active: true
            },
            {
                name: 'Mohamed Ali',
                projectId: projects[0]._id,
                dailySalary: 50,
                contact: { phone: '50123456', address: 'Ariana' },
                active: true
            },
            {
                name: 'Youssef Gharbi',
                projectId: projects[1]._id,
                dailySalary: 48,
                contact: { phone: '98123456', address: 'Sfax' },
                active: true
            },
            {
                name: 'Walid Tounsi',
                projectId: projects[1]._id,
                dailySalary: 55,
                contact: { phone: '22123456', address: 'Sfax' },
                active: true
            },
            {
                name: 'Hassen Bejaoui',
                projectId: projects[2]._id,
                dailySalary: 42,
                contact: { phone: '55123456', address: 'Bizerte' },
                active: true
            }
        ]);

        console.log('Creating Materials...');
        await Material.create([
            {
                name: 'Cement (Ciment de Bizerte)',
                unit: 'bag',
                price: 18.5,
                supplierId: new mongoose.Types.ObjectId(), // Mock supplier ID
                projectId: projects[0]._id,
                stockQuantity: 500,
                category: 'Construction'
            },
            {
                name: 'Red Bricks 12 holes',
                unit: 'piece',
                price: 0.8,
                supplierId: new mongoose.Types.ObjectId(),
                projectId: projects[0]._id,
                stockQuantity: 12000, // Pieces
                category: 'Construction'
            },
            {
                name: 'Steel Rebar 12mm (El Fouladh)',
                unit: 'ton',
                price: 2800,
                supplierId: new mongoose.Types.ObjectId(),
                projectId: projects[1]._id,
                stockQuantity: 15,
                category: 'Steel'
            },
            {
                name: 'Solar Panels 450W',
                unit: 'piece',
                price: 650,
                supplierId: new mongoose.Types.ObjectId(),
                projectId: projects[1]._id,
                stockQuantity: 200,
                category: 'Electrical'
            }
        ]);

        console.log('Creating Tasks & Reports...');
        // Create a task
        const task1 = await Task.create({
            projectId: projects[0]._id,
            name: 'Foundation Pouring',
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 14)),
            assignedWorkers: [workers[0]._id, workers[1]._id],
            status: 'In Progress',
            priority: 'High'
        });

        // Create a daily report
        await DailyReport.create({
            projectId: projects[0]._id,
            date: new Date(),
            loggedBy: pmSami._id,
            workCompleted: 'Completed sector A foundation.',
            issues: 'Delay in cement delivery in the morning.',
            workersPresent: 12,
            weather: 'Sunny',
            progress: 5
        });

        console.log('Creating Notifications...');
        await Notification.create([
            {
                userId: admin._id,
                type: 'warning',
                message: 'Low stock: Red Bricks (Cité de la Culture)',
                read: false
            },
            {
                userId: admin._id,
                type: 'info',
                message: 'New Daily Report: Sfax Solar Plant',
                read: false
            },
            {
                userId: pmSami._id,
                type: 'success',
                message: 'Foundation Task Approved',
                read: true
            }
        ]);

        console.log('Tunisian Data Imported Successfully');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
