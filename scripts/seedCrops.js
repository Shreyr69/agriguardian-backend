require('dotenv').config();
const mongoose = require('mongoose');
const Crop = require('../src/models/Crop');

const sampleCrops = [
    {
        name: 'Wheat',
        name_hi: 'गेहूं',
        seasons: ['rabi'],
        stages: ['seedling', 'vegetative', 'flowering', 'grain_filling', 'maturity'],
        image_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b'
    },
    {
        name: 'Rice',
        name_hi: 'चावल',
        seasons: ['kharif'],
        stages: ['seedling', 'tillering', 'flowering', 'grain_filling', 'maturity'],
        image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c'
    },
    {
        name: 'Cotton',
        name_hi: 'कपास',
        seasons: ['kharif'],
        stages: ['seedling', 'vegetative', 'flowering', 'boll_development', 'maturity'],
        image_url: 'https://images.unsplash.com/photo-1566140967404-b8b3932483e5'
    },
    {
        name: 'Sugarcane',
        name_hi: 'गन्ना',
        seasons: ['year_round'],
        stages: ['planting', 'tillering', 'grand_growth', 'maturity'],
        image_url: 'https://images.unsplash.com/photo-1583484963130-d391126f6a23'
    },
    {
        name: 'Maize',
        name_hi: 'मक्का',
        seasons: ['kharif', 'rabi'],
        stages: ['seedling', 'vegetative', 'flowering', 'grain_filling', 'maturity'],
        image_url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076'
    },
    {
        name: 'Tomato',
        name_hi: 'टमाटर',
        seasons: ['year_round'],
        stages: ['seedling', 'vegetative', 'flowering', 'fruiting', 'maturity'],
        image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea'
    },
    {
        name: 'Potato',
        name_hi: 'आलू',
        seasons: ['rabi'],
        stages: ['planting', 'vegetative', 'tuber_initiation', 'tuber_bulking', 'maturity'],
        image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655'
    },
    {
        name: 'Onion',
        name_hi: 'प्याज',
        seasons: ['rabi'],
        stages: ['seedling', 'vegetative', 'bulb_development', 'maturity'],
        image_url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb'
    }
];

async function seedCrops() {
    try {
        console.log('🌱 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Check if crops already exist
        const existingCount = await Crop.countDocuments();
        if (existingCount > 0) {
            console.log(`⚠️  Database already has ${existingCount} crops.`);
            console.log('Do you want to:');
            console.log('1. Skip seeding (keep existing data)');
            console.log('2. Add more crops (append to existing)');
            console.log('3. Clear and reseed (delete existing data)\n');
            console.log('Skipping to avoid data loss. Run with --force to clear and reseed.\n');

            if (process.argv.includes('--force')) {
                console.log('🗑️  Clearing existing crops...');
                await Crop.deleteMany({});
                console.log('✅ Cleared existing crops\n');
            } else {
                console.log('✅ Keeping existing crops. Exiting.\n');
                process.exit(0);
            }
        }

        console.log('🌾 Seeding crops...');
        let added = 0;

        for (const cropData of sampleCrops) {
            try {
                // Check if crop already exists by name
                const existing = await Crop.findOne({ name: cropData.name });
                if (existing) {
                    console.log(`  ⏭️  ${cropData.name} already exists, skipping`);
                    continue;
                }

                await Crop.create(cropData);
                console.log(`  ✅ Added ${cropData.name} (${cropData.name_hi})`);
                added++;
            } catch (error) {
                console.error(`  ❌ Error adding ${cropData.name}:`, error.message);
            }
        }

        console.log(`\n🎉 Successfully added ${added} crops!`);
        console.log(`📊 Total crops in database: ${await Crop.countDocuments()}`);

    } catch (error) {
        console.error('\n❌ Seeding failed:', error);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 MongoDB connection closed');
    }
}

// Run seeding
seedCrops()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
