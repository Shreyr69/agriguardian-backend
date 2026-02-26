require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const mongoose = require('mongoose');

// Import models
const User = require('../src/models/User');
const Crop = require('../src/models/Crop');
const Pest = require('../src/models/Pest');
const Advisory = require('../src/models/Advisory');
const PestReport = require('../src/models/PestReport');
const SprayLog = require('../src/models/SprayLog');
const CommunityPost = require('../src/models/CommunityPost');
const CommunityReply = require('../src/models/CommunityReply');
const UserCrop = require('../src/models/UserCrop');
const UserLike = require('../src/models/UserLike');
const Alert = require('../src/models/Alert');
const AILog = require('../src/models/AILog');

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// UUID to ObjectId mapping
const uuidMap = new Map();

function getOrCreateObjectId(uuid) {
    if (!uuid) return null;
    if (!uuidMap.has(uuid)) {
        uuidMap.set(uuid, new mongoose.Types.ObjectId());
    }
    return uuidMap.get(uuid);
}

async function migrateUsers() {
    console.log('\n📝 Migrating users, profiles, and roles...');

    // Get all users from Supabase auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    console.log(`Found ${authUsers.users.length} users`);

    for (const authUser of authUsers.users) {
        try {
            const userId = getOrCreateObjectId(authUser.id);

            // Get profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', authUser.id)
                .maybeSingle();

            // Get roles
            const { data: roles } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', authUser.id);

            const userRoles = roles?.map(r => r.role) || ['farmer'];

            // Check if user already exists in MongoDB
            const existingUser = await User.findById(userId);
            if (existingUser) {
                console.log(`  ⏭️  User ${authUser.email} already exists, skipping`);
                continue;
            }

            // Create user (password will be rehashed automatically)
            const user = new User({
                _id: userId,
                email: authUser.email,
                password: authUser.encrypted_password || 'migrated-password-needs-reset', // Users need to reset password
                name: profile?.name || authUser.email.split('@')[0],
                phone: profile?.phone,
                location: profile?.location || 'Punjab, India',
                language: profile?.language || 'en',
                roles: userRoles
            });

            // Skip password hashing for migration
            user.$__skipPasswordHashing = true;
            await user.save();

            console.log(`  ✅ Migrated user: ${authUser.email}`);
        } catch (error) {
            console.error(`  ❌ Error migrating user ${authUser.email}:`, error.message);
        }
    }
}

async function migrateCrops() {
    console.log('\n🌾 Migrating crops...');

    const { data: crops, error } = await supabase.from('crops').select('*');
    if (error) throw error;

    console.log(`Found ${crops.length} crops`);

    for (const crop of crops) {
        try {
            const cropId = getOrCreateObjectId(crop.id);

            const existingCrop = await Crop.findById(cropId);
            if (existingCrop) {
                console.log(`  ⏭️  Crop ${crop.name} already exists, skipping`);
                continue;
            }

            await Crop.create({
                _id: cropId,
                name: crop.name,
                name_hi: crop.name_hi,
                seasons: crop.seasons,
                stages: crop.stages,
                image_url: crop.image_url,
                created_at: crop.created_at
            });

            console.log(`  ✅ Migrated crop: ${crop.name}`);
        } catch (error) {
            console.error(`  ❌ Error migrating crop ${crop.name}:`, error.message);
        }
    }
}

async function migratePests() {
    console.log('\n🐛 Migrating pests...');

    const { data: pests, error } = await supabase.from('pests').select('*');
    if (error) throw error;

    console.log(`Found ${pests.length} pests`);

    for (const pest of pests) {
        try {
            const pestId = getOrCreateObjectId(pest.id);
            const cropId = getOrCreateObjectId(pest.crop_id);

            const existingPest = await Pest.findById(pestId);
            if (existingPest) {
                console.log(`  ⏭️  Pest ${pest.name} already exists, skipping`);
                continue;
            }

            await Pest.create({
                _id: pestId,
                crop_id: cropId,
                name: pest.name,
                name_hi: pest.name_hi,
                scientific_name: pest.scientific_name,
                images: pest.images,
                symptoms: pest.symptoms,
                symptoms_hi: pest.symptoms_hi,
                lifecycle: pest.lifecycle,
                lifecycle_hi: pest.lifecycle_hi,
                damage: pest.damage,
                damage_hi: pest.damage_hi,
                season: pest.season,
                tags: pest.tags,
                created_at: pest.created_at
            });

            console.log(`  ✅ Migrated pest: ${pest.name}`);
        } catch (error) {
            console.error(`  ❌ Error migrating pest ${pest.name}:`, error.message);
        }
    }
}

async function migrateAdvisories() {
    console.log('\n💡 Migrating advisories...');

    const { data: advisories, error } = await supabase.from('advisories').select('*');
    if (error) throw error;

    console.log(`Found ${advisories.length} advisories`);

    for (const advisory of advisories) {
        try {
            const advisoryId = getOrCreateObjectId(advisory.id);
            const pestId = getOrCreateObjectId(advisory.pest_id);

            const existingAdvisory = await Advisory.findById(advisoryId);
            if (existingAdvisory) {
                console.log(`  ⏭️  Advisory already exists, skipping`);
                continue;
            }

            await Advisory.create({
                _id: advisoryId,
                pest_id: pestId,
                prevention: advisory.prevention,
                prevention_hi: advisory.prevention_hi,
                mechanical: advisory.mechanical,
                mechanical_hi: advisory.mechanical_hi,
                biological: advisory.biological,
                biological_hi: advisory.biological_hi,
                chemical: advisory.chemical,
                chemical_hi: advisory.chemical_hi,
                dosage: advisory.dosage,
                dosage_hi: advisory.dosage_hi,
                safety: advisory.safety,
                safety_hi: advisory.safety_hi,
                notes: advisory.notes,
                notes_hi: advisory.notes_hi,
                created_at: advisory.created_at
            });

            console.log(`  ✅ Migrated advisory for pest ID: ${advisory.pest_id}`);
        } catch (error) {
            console.error(`  ❌ Error migrating advisory:`, error.message);
        }
    }
}

async function migrateSprayLogs() {
    console.log('\n💧 Migrating spray logs...');

    const { data: logs, error } = await supabase.from('spray_logs').select('*');
    if (error) throw error;

    console.log(`Found ${logs.length} spray logs`);

    for (const log of logs) {
        try {
            const logId = getOrCreateObjectId(log.id);
            const userId = getOrCreateObjectId(log.user_id);
            const cropId = getOrCreateObjectId(log.crop_id);

            const existingLog = await SprayLog.findById(logId);
            if (existingLog) continue;

            await SprayLog.create({
                _id: logId,
                user_id: userId,
                crop_id: cropId,
                pesticide_name: log.pesticide_name,
                dose: log.dose,
                spray_date: log.spray_date,
                notes: log.notes,
                created_at: log.created_at
            });

            console.log(`  ✅ Migrated spray log`);
        } catch (error) {
            console.error(`  ❌ Error migrating spray log:`, error.message);
        }
    }
}

async function migrateUserCrops() {
    console.log('\n🌱 Migrating user crops...');

    const { data: userCrops, error } = await supabase.from('user_crops').select('*');
    if (error) throw error;

    console.log(`Found ${userCrops.length} user crops`);

    for (const uc of userCrops) {
        try {
            const ucId = getOrCreateObjectId(uc.id);
            const userId = getOrCreateObjectId(uc.user_id);
            const cropId = getOrCreateObjectId(uc.crop_id);

            const existingUC = await UserCrop.findById(ucId);
            if (existingUC) continue;

            await UserCrop.create({
                _id: ucId,
                user_id: userId,
                crop_id: cropId,
                stage: uc.stage,
                is_active: uc.is_active,
                created_at: uc.created_at,
                updated_at: uc.updated_at
            });

            console.log(`  ✅ Migrated user crop`);
        } catch (error) {
            console.error(`  ❌ Error migrating user crop:`, error.message);
        }
    }
}

async function migrateAlerts() {
    console.log('\n🚨 Migrating alerts...');

    const { data: alerts, error } = await supabase.from('alerts').select('*');
    if (error) throw error;

    console.log(`Found ${alerts.length} alerts`);

    for (const alert of alerts) {
        try {
            const alertId = getOrCreateObjectId(alert.id);
            const cropId = getOrCreateObjectId(alert.crop_id);

            const existingAlert = await Alert.findById(alertId);
            if (existingAlert) continue;

            await Alert.create({
                _id: alertId,
                title: alert.title,
                title_hi: alert.title_hi,
                description: alert.description,
                description_hi: alert.description_hi,
                risk_level: alert.risk_level,
                crop_id: cropId,
                location: alert.location,
                is_active: alert.is_active,
                created_at: alert.created_at
            });

            console.log(`  ✅ Migrated alert: ${alert.title}`);
        } catch (error) {
            console.error(`  ❌ Error migrating alert:`, error.message);
        }
    }
}

async function migrateCommunity() {
    console.log('\n💬 Migrating community posts...');

    const { data: posts, error } = await supabase.from('community_posts').select('*');
    if (error) throw error;

    console.log(`Found ${posts.length} community posts`);

    for (const post of posts) {
        try {
            const postId = getOrCreateObjectId(post.id);
            const userId = getOrCreateObjectId(post.user_id);
            const cropId = getOrCreateObjectId(post.crop_id);

            const existingPost = await CommunityPost.findById(postId);
            if (existingPost) continue;

            await CommunityPost.create({
                _id: postId,
                user_id: userId,
                crop_id: cropId,
                title: post.title,
                description: post.description,
                image_url: post.image_url,
                location: post.location,
                status: post.status,
                upvotes: post.upvotes,
                created_at: post.created_at
            });

            console.log(`  ✅ Migrated post: ${post.title}`);
        } catch (error) {
            console.error(`  ❌ Error migrating post:`, error.message);
        }
    }

    // Migrate replies
    console.log('\n💬 Migrating community replies...');

    const { data: replies, error: repliesError } = await supabase.from('community_replies').select('*');
    if (repliesError) throw repliesError;

    console.log(`Found ${replies.length} replies`);

    for (const reply of replies) {
        try {
            const replyId = getOrCreateObjectId(reply.id);
            const postId = getOrCreateObjectId(reply.post_id);
            const userId = getOrCreateObjectId(reply.user_id);

            const existingReply = await CommunityReply.findById(replyId);
            if (existingReply) continue;

            await CommunityReply.create({
                _id: replyId,
                post_id: postId,
                user_id: userId,
                message: reply.message,
                created_at: reply.created_at
            });

            console.log(`  ✅ Migrated reply`);
        } catch (error) {
            console.error(`  ❌ Error migrating reply:`, error.message);
        }
    }

    // Migrate likes
    console.log('\n❤️  Migrating user likes...');

    const { data: likes, error: likesError } = await supabase.from('user_likes').select('*');
    if (likesError) throw likesError;

    console.log(`Found ${likes.length} likes`);

    for (const like of likes) {
        try {
            const likeId = getOrCreateObjectId(like.id);
            const userId = getOrCreateObjectId(like.user_id);
            const postId = getOrCreateObjectId(like.post_id);

            const existingLike = await UserLike.findById(likeId);
            if (existingLike) continue;

            await UserLike.create({
                _id: likeId,
                user_id: userId,
                post_id: postId,
                created_at: like.created_at
            });

            console.log(`  ✅ Migrated like`);
        } catch (error) {
            console.error(`  ❌ Error migrating like:`, error.message);
        }
    }
}

async function run() {
    try {
        console.log('🚀 Starting Supabase to MongoDB migration...\n');

        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Run migrations in order (respecting foreign key dependencies)
        await migrateUsers();
        await migrateCrops();
        await migratePests();
        await migrateAdvisories();
        await migrateSprayLogs();
        await migrateUserCrops();
        await migrateAlerts();
        await migrateCommunity();

        console.log('\n✨ Migration completed successfully!');
        console.log(`\n📊 UUID to ObjectId mappings created: ${uuidMap.size}`);

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 MongoDB connection closed');
    }
}

// Run migration
run();
