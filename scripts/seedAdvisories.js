const Advisory = require('../src/models/Advisory');
const Pest = require('../src/models/Pest');

/**
 * Seed advisory database with IPM recommendations for all pests
 */

const advisoryData = {
    // Sample advisories - in production, create for all 24 pests
    'Aphids': {
        prevention: [
            'Remove weeds around the field which can host aphids',
            'Use reflective mulches to repel aphids',
            'Plant trap crops like mustard around the field',
            'Avoid excessive nitrogen fertilization',
            'Maintain proper plant spacing for air circulation'
        ],
        prevention_hi: [
            'खेत के आस-पास खरपतवार हटाएं',
            'परावर्तक मल्च का उपयोग करें',
            'खेत के चारों ओर सरसों जैसी फंदा फसलें लगाएं',
            'अत्यधिक नाइट्रोजन से बचें',
            'वायु संचार के लिए उचित दूरी बनाए रखें'
        ],
        mechanical: [
            'Spray strong jet of water to dislodge aphids',
            'Remove heavily infested leaves or plants',
            'Use yellow sticky traps to monitor',
            'Hand pick visible colonies in small areas'
        ],
        mechanical_hi: [
            'माहू हताने के लिए पानी का तेज जेट स्प्रे करें',
            'अत्यधिक प्रभावित पत्तियां हटाएं',
            'निगरानी के लिए पीले चिपचिपे जाल का उपयोग करें',
            'छोटे क्षेत्रों में हाथ से उठाएं'
        ],
        biological: [
            'Introduce ladybugs (50-100 per plant)',
            'Release lacewings or green lacewings',
            'Conserve natural enemies - avoid broad-spectrum pesticides',
            'Use parasitic wasps (Aphidius colemani)',
            'Spray neem oil 0.3% concentration'
        ],
        biological_hi: [
            'लेडीबग्स छोड़ें (50-100 प्रति पौधा)',
            'लेसविंग्स छोड़ें',
            'प्राकृतिक दुश्मनों को संरक्षित करें',
            'परजीवी ततैया का उपयोग करें',
            'नीम तेल 0.3% छिड़काव करें'
        ],
        chemical: [
            'Imidacloprid 17.8% SL @ 0.3 ml/L water',
            'Thiamethoxam 25% WG @ 0.2 g/L water',
            'Dimethoate 30% EC @ 2 ml/L water',
            'Acetamiprid 20% SP @ 0.2 g/L',
            'Apply early morning or evening only'
        ],
        chemical_hi: [
            'इमिडाक्लोप्रिड 17.8% SL @ 0.3 मिली/लीटर पानी',
            'थियामेथोक्सम 25% WG @ 0.2 ग्राम/लीटर',
            'डाइमेथोएट 30% EC @ 2 मिली/लीटर',
            'एसिटामिप्रिड 20% SP @ 0.2 ग्राम',
            'केवल सुबह या शाम को लगाएं'
        ],
        dosage: '200-250 L water per acre spray. Repeat after 10-15 days if needed.',
        dosage_hi: '200-250 लीटर पानी प्रति एकड़। आवश्यकता पर 10-15 दिन बाद दोहराएं।',
        safety: 'Use PPE (gloves, mask). Do not spray near water bodies. Pre-harvest interval: 7 days.',
        safety_hi: 'पीपीई उपयोग करें (दस्ताने, मास्क)। जल स्रोतों के पास स्प्रे न करें। फसल से पहले अंतराल: 7 दिन।',
        notes: 'ETL: 10 aphids per tiller. Chemical should be last resort after biological methods fail.',
        notes_hi: 'ईटीएल: 10 माहू प्रति कल्ला। जैविक विधियों के असफल होने के बाद रसायन अंतिम उपाय होना चाहिए।'
    },

    'Brown Plant Hopper': {
        prevention: [
            'Avoid close spacing of plants',
            'Use resistant varieties like TN1',
            'Avoid excessive nitrogen (max 120 kg/ha)',
            'Remove weeds from bunds and channels',
            'Alternate wetting and drying to break lifecycle'
        ],
        prevention_hi: [
            'पौधों की घनी रोपाई से बचें',
            'TN1 जैसी प्रतिरोधी किस्में उपयोग करें',
            'अत्यधिक नाइट्रोजन से बचें',
            'मेड़ों से खरपतवार हटाएं',
            'वैकल्पिक गीलापन और सुखाना'
        ],
        mechanical: [
            'Install light traps to catch adults',
            'Remove hopperburn affected plants',
            'Flood field for 2-3 days to drown nymphs',
            'Mechanical hopper nets (traditional method)'
        ],
        mechanical_hi: [
            'वयस्कों को पकड़ने के लिए प्रकाश जाल लगाएं',
            'प्रभावित पौधे हटाएं',
            '2-3 दिन खेत में पानी भरें',
            'यांत्रिक होपर जाल (पारंपरिक विधि)'
        ],
        biological: [
            'Conserve spiders and mirid bugs',
            'Release egg parasitoids',
            'Encourage wolf spiders - avoid insecticides in early season',
            'Use Metarhizium anisopliae (fungal biocontrol)'
        ],
        biological_hi: [
            'मकड़ियों को संरक्षित करें',
            'अंडा परजीवी छोड़ें',
            'भेड़िया मकड़ियों को प्रोत्साहित करें',
            'कवक जैव नियंत्रण का उपयोग करें'
        ],
        chemical: [
            'Buprofezin 25% SC @ 1-1.5 ml/L water',
            'Pymetrozine 50% WG @ 0.6 g/L',
            'Imidacloprid 17.8% SL @ 0.5 ml/L',
            'Apply at tillering and flowering stage only if ETL exceeded'
        ],
        chemical_hi: [
            'बुप्रोफेज़िन 25% SC @ 1-1.5 मिली/लीटर',
            'पाइमेट्रोज़ीन 50% WG @ 0.6 ग्राम/लीटर',
            'इमिडाक्लोप्रिड 17.8% SL @ 0.5 मिली/लीटर',
            'केवल ईटीएल पार होने पर लगाएं'
        ],
        dosage: '500-600 L water/ha. Target underside of leaves. Do not spray during flowering.',
        dosage_hi: '500-600 लीटर पानी/हेक्टेयर। पत्तियों के नीचे लक्ष्य करें। फूल आने पर स्प्रे न करें।',
        safety: 'Toxic to fish and aquatic life. Keep away from ponds. PHI: 21 days.',
        safety_hi: 'मछली के लिए विषाक्त। तालाबों से दूर रखें। पीएचआई: 21 दिन।',
        notes: 'ETL: 5-10 hoppers per hill. Virus transmission main concern. Early detection critical.',
        notes_hi: 'ईटीएल: 5-10 होपर प्रति पहाड़ी। वायरस संचरण मुख्य चिंता। प्रारंभिक पहचान महत्वपूर्ण।'
    },

    'Stem Borer': {
        prevention: [
            'Remove stubble and plant debris after harvest',
            'Deep summer plowing to expose pupae',
            'Use resistant varieties',
            'Avoid staggered planting in area',
            'Clip shoot tips 45 days after transplanting'
        ],
        prevention_hi: [
            'कटाई के बाद अवशेष हटाएं',
            'गहरी गर्मी जुताई करें',
            'प्रतिरोधी किस्में उपयोग करें',
            'क्षेत्र में चरणबद्ध रोपण से बचें',
            'रोपाई के 45 दिन बाद शूट टिप्स काटें'
        ],
        mechanical: [
            'Destroy egg masses found on leaves',
            'Remove and burn dead hearts',
            'Use light traps from transplanting',
            'Bird perches @ 10 per acre for natural predation'
        ],
        mechanical_hi: [
            'पत्तियों पर अंडे के समूह नष्ट करें',
            'मृत केंद्रों को हटा कर जलाएं',
            'रोपाई से प्रकाश जाल उपयोग करें',
            'प्राकृतिक शिकार के लिए पक्षी पर्च लगाएं'
        ],
        biological: [
            'Release Trichogramma japonicum @ 1 lakh/ha weekly (6 releases)',
            'Start releases 30 days after transplanting',
            'Conserve braconid wasps',
            'Release Cotesia flavipes for biological control'
        ],
        biological_hi: [
            'ट्राइकोग्रामा जैपोनिकम @ 1 लाख/हेक्टेयर साप्ताहिक (6 रिलीज)',
            'रोपाई के 30 दिन बाद शुरू करें',
            'ब्राकोनिड ततैया संरक्षित करें',
            'जैविक नियंत्रण के लिए Cotesia flavipes छोड़ें'
        ],
        chemical: [
            'Chlorantraniliprole 18.5% SC @ 0.3-0.4 ml/L',
            'Cartap hydrochloride 50% SP @ 2 g/L',
            'Fipronil 5% SC @ 2 ml/L',
            'Apply during egg hatching period for best results'
        ],
        chemical_hi: [
            'क्लोरेंट्रानिलिप्रोल 18.5% SC @ 0.3-0.4 मिली/लीटर',
            'कार्टैप हाइड्रोक्लोराइड 50% SP @ 2 ग्राम/लीटर',
            'फिप्रोनिल 5% SC @ 2 मिली/लीटर',
            'सर्वोत्तम परिणामों के लिए अंडे निकलने की अवधि में लगाएं'
        ],
        dosage: 'Ensure water in field (2-3 cm) during application. 500 L/ha spray volume.',
        dosage_hi: 'उपयोग के दौरान खेत में पानी सुनिश्चित करें (2-3 सेमी)। 500 लीटर/हेक्टेयर स्प्रे मात्रा।',
        safety: 'Wear PPE. Avoid spray drift. PHI: 30 days for rice grain.',
        safety_hi: 'पीपीई पहनें। स्प्रे बहाव से बचें। धान अनाज के लिए पीएचआई: 30 दिन।',
        notes: 'ETL: 5% dead hearts (vegetative), 2% white heads (reproductive). IPM approach gives 85-90% control.',
        notes_hi: 'ईटीएल: 5% मृत केंद्र, 2% सफेद शीर्ष। आईपीएम दृष्टिकोण 85-90% नियंत्रण देता है।'
    }
};

async function seedAdvisories() {
    try {
        console.log('💊 Starting advisory database seeding...');

        let count = 0;

        for (const [pestName, advisory] of Object.entries(advisoryData)) {
            // Find the pest
            const pest = await Pest.findOne({ name: pestName });

            if (!pest) {
                console.warn(`⚠️  Pest not found: ${pestName}`);
                continue;
            }

            // Check if advisory already exists
            const existing = await Advisory.findOne({ pest_id: pest._id });

            if (existing) {
                console.log(`⏭️  Advisory already exists for: ${pestName}`);
                continue;
            }

            // Create advisory
            await Advisory.create({
                pest_id: pest._id,
                ...advisory
            });

            count++;
            console.log(`✓ Created advisory ${count}: ${pestName}`);
        }

        console.log(`\n✅ Advisory seeding complete!`);
        console.log(`📊 Stats: ${count} IPM advisories added`);
        console.log(`💡 Each advisory includes: Prevention, Mechanical, Biological, Chemical control`);

    } catch (error) {
        console.error('❌ Error seeding advisories:', error);
        throw error;
    }
}

module.exports = seedAdvisories;

// Run if called directly
if (require.main === module) {
    const mongoose = require('mongoose');
    require('dotenv').config();

    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agri-guardian')
        .then(() => {
            console.log('✓ Connected to MongoDB');
            return seedAdvisories();
        })
        .then(() => {
            console.log('✓ Seeding completed successfully');
            process.exit(0);
        })
        .catch(err => {
            console.error('Error:', err);
            process.exit(1);
        });
}
