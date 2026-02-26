const KnowledgeBase = require('../src/models/KnowledgeBase');

/**
 * Seed knowledge base with farming best practices and expert knowledge
 */

const knowledgeBaseData = [
    // IPM Strategies
    {
        category: 'ipm_strategy',
        title: 'Integrated Pest Management Principles',
        title_hi: 'एकीकृत कीट प्रबंधन सिद्धांत',
        content: `Integrated Pest Management (IPM) follows a hierarchical approach:

1. **Prevention** - Always the first line of defense
   - Crop rotation to break pest cycles
   - Resistant varieties selection
   - Proper field sanitation
   - Timely sowing and harvesting
   - Adequate spacing for air circulation

2. **Monitoring** - Regular field scouting
   - Weekly field inspection
   - Pheromone traps for pest detection
   - Yellow sticky traps for whiteflies and aphids
   - Economic threshold level (ETL) monitoring

3. **Mechanical Control** - Physical interventions
   - Hand picking of larvae
   - Water sprays to dislodge pests
   - Removal of infected plant parts
   - Bird perches for natural predation

4. **Biological Control** - Use of natural enemies
   - Trichogramma wasps for bollworms
   - Ladybugs for aphids
   - Parasitoid wasps
   - Bacillus thuringiensis (Bt)

5. **Chemical Control** - Last resort only
   - Use only when pest population exceeds ETL
   - Prefer selective over broad-spectrum chemicals
   - Rotate chemical groups to prevent resistance
   - Follow pre-harvest intervals strictly

Remember: Chemical should be the LAST option, not the first!`,
        content_hi: `एकीकृत कीट प्रबंधन (आईपीएम) पदानुक्रमित दृष्टिकोण का पालन करता है...`,
        keywords: ['IPM', 'pest management', 'sustainable farming', 'biological control', 'prevention'],
        source: 'expert',
        confidence: 0.95,
        seasonal_relevance: ['Year-round'],
        applicability: 'all'
    },
    {
        category: 'farming_practice',
        crop_id: null,
        title: 'Early Season Pest Management',
        title_hi: 'प्रारंभिक मौसम कीट प्रबंधन',
        content: `Critical pest management practices during crop establishment:

**Before Sowing:**
- Deep summer plowing to expose soil pests
- Sun drying of fields
- Removal of crop residues
- Green manuring with pest-repellent crops

**At Sowing:**
- Seed treatment with Trichoderma or Pseudomonas
- Use of coated seeds
- Proper seed rate and spacing
- Synchronized sowing in the region

**Seedling Stage:**
- Yellow sticky traps at 15 per acre
- Border crops to trap pests
- Regular monitoring for early detection
- Neem cakecake incorporation in soil

Early intervention is 10x more effective than late-stage chemical control!`,
        content_hi: `फसल स्थापना के दौरान महत्वपूर्ण कीट प्रबंधन प्रथाएं...`,
        keywords: ['early season', 'seedling protection', 'preventive measures', 'seed treatment'],
        source: 'research',
        confidence: 0.9,
        seasonal_relevance: ['Kharif', 'Rabi'],
        applicability: 'all'
    },

    // Regional Guidelines
    {
        category: 'regional_guideline',
        region: 'Punjab',
        title: 'Pest Management in Punjab Wheat',
        title_hi: 'पंजाब गेहूं में कीट प्रबंधन',
        content: `Punjab-specific recommendations for wheat pests:

**Aphid Management:**
- Peak infestation: Feb-March (flowering stage)
- Monitor when max temp rises above 25°C
- ETL: 10 aphids per tiller
- Spray only 30% crop affected
- Use imidacloprid @ 0.3 ml/L water if needed

**Termite Management:**
- More common in Malwa region
- Pre-sowing: chlorpyriphos 2.5 L/acre
- Monitor during dry spells
- Flood irrigation helps control

**Pink Stem Borer (rare but emerging):**
- Southern districts showing increased incidence
- Remove stubble immediately after harvest
- Avoid rationing in affected areas`,
        content_hi: `गेहूं कीटों के लिए पंजाब-विशिष्ट सिफारिशें...`,
        keywords: ['Punjab', 'wheat', 'aphids', 'regional', 'climate-specific'],
        source: 'government',
        confidence: 0.92,
        seasonal_relevance: ['Rabi'],
        applicability: 'commercial',
        region: 'Punjab'
    },
    {
        category: 'regional_guideline',
        region: 'Haryana',
        title: 'Cotton Whitefly Management in Haryana',
        title_hi: 'हरियाणा में कपास सफेद मक्खी प्रबंधन',
        content: `Haryana-specific whitefly management for cotton:

**Critical Period:** June to October

**Monitoring:**
- Start from 30 days after sowing
- Check underside of top 3 leaves
- ETL: 5 adults or 10 nymphs per leaf

**Cultural Practices:**
- Early sowing (April 15-30) to escape peak population
- Intercropping with maize reduces whitefly
- Avoid ratooning
- Destroy crop residue after harvest

**Biological Control:**
- Release Chrysoperla at 50,000/acre (3 times)
- Conserve ladybugs and spiders
- Avoid early insecticide use

**Chemical Control (if ETL exceeded):**
- Rotate: Neonicotinoids → Pymetrozine → Spiromesifen
- Never use same group twice in succession
- Spray in evening hours
- Add sticker for better coverage

**Leaf Curl Virus Prevention:**
- Control whitefly from day 1
- Infected plants: remove immediately
- Use virus-free seeds`,
        content_hi: `कपास के लिए हरियाणा-विशिष्ट सफेद मक्खी प्रबंधन...`,
        keywords: ['Haryana', 'cotton', 'whitefly', 'CLCuV', 'virus management'],
        source: 'expert',
        confidence: 0.93,
        seasonal_relevance: ['Kharif'],
        applicability: 'commercial',
        region: 'Haryana'
    },

    // Crop-specific Management
    {
        category: 'crop_management',
        title: 'Rice Stem Borer Integrated Management',
        title_hi: 'धान तना छेदक एकीकृत प्रबंधन',
        content: `Comprehensive stem borer management in rice:

**Prevention:**
- Resistant varieties: Improved Pusa Basmati 1, PR-126
- Avoid excessive nitrogen (max 120 kg/ha)
- Maintain 2-3 cm water level
- Remove weeds from bunds

**Monitoring:**
- Light traps from transplanting
- Pheromone traps @ 5/acre
- Check for egg masses on leaves

**Economic Threshold:**
- Vegetative: 5% dead hearts
- Reproductive: 2% white heads

**Control Measures:**
1. **Mechanical:**
   - Clip and destroy egg masses
   - Remove dead hearts
   - Stubble destruction

2. **Biological:**
   - Release Trichogramma japonicum @ 1 lakh/ha (6 times)
   - Release starts 30 days after transplanting
   - Interval: weekly releases
   - Conserve spiders

3. **Chemical (last resort):**
   - Chlorantraniliprole 0.4 ml/L
   - or Cartap hydrochloride 2 g/L
   - Apply during egg hatching period
   - Ensure water in field for better efficacy

**Success Rate:** IPM approach gives 85-90% control vs 60-70% with chemicals alone`,
        content_hi: `धान में तना छेदक का व्यापक प्रबंधन...`,
        keywords: ['rice', 'stem borer', 'Trichogramma', 'biological control', 'dead heart', 'white head'],
        source: 'research',
        confidence: 0.94,
        seasonal_relevance: ['Kharif'],
        applicability: 'all'
    },
    {
        category: 'crop_management',
        title: 'Tomato Fruit Borer Management',
        title_hi: 'टमाटर फल छेदक प्रबंधन',
        content: `Complete management strategy for tomato fruit borer:

**Pre-planting:**
- Summer plowing to expose pupae
- Avoid tomato-tomato-tomato rotation
- 60-day gap between crops

**Nursery Stage:**
- Cover nursery with 40-mesh nylon net
- Bt spray on 15-day seedlings

**Main Field:**
- Pheromone traps @ 8/acre from transplanting
- Install 100 bird perches per acre
- Spray Bt or neem at 15-day interval preventively

**Flowering Stage (Critical):**
- Monitor daily for bore holes
- ETL: 5% fruits damaged
- Release Trichogramma @ 50,000/acre weekly
- Hand pick and destroy damaged fruits immediately

**Organic Solutions:**
- NSKE 5% spray
- Bt formulation (1 ml/L)
- Chili-garlic spray

**Chemical (only if >ETL):**
- Indoxacarb or Emamectin benzoate
- Never mix with alkaline solutions
- Alternate mode of action

**Post-harvest:**
- Destroy all infected fruits
- Don't leave in field or compost
- Deep burial or burn`,
        content_hi: `टमाटर फल छेदक के लिए पूर्ण प्रबंधन रणनीति...`,
        keywords: ['tomato', 'fruit borer', 'Helicoverpa', 'Bt', 'pheromone trap'],
        source: 'expert',
        confidence: 0.91,
        seasonal_relevance: ['Rabi', 'Kharif'],
        applicability: 'all'
    },

    // Seasonal Guides
    {
        category: 'seasonal_guide',
        title: 'Kharif Season Pest Preparedness',
        title_hi: 'खरीफ मौसम कीट तैयारी',
        content: `Pre-monsoon preparedness for pest management:

**May-June (Pre-Kharif):**
- Deep summer plowing
- Clean irrigation channels
- Repair damages in stored grains
- Stock up on bio-agents
- Service spraying equipment

**July (Sowing Time):**
- Synchronize sowing in village
- Seed treatment mandatory
- Set up light traps
- Install yellow sticky traps in vegetable plots

**August-September (Peak Growth):**
- Major pests active: Stem borers, hoppers, borers
- Weekly field inspection
- Monitor weather for outbreak prediction  
- Keep sprayers ready but use only if needed

**October (Harvest Prep):**
- Remove pest-affected plants before harvest
- Plan for rabi pest prevention
- Clean storage facilities

**Monsoon Specific:**
- Pests multiply faster in humidity
- Fungal diseases alongside pests
- Difficult to spray during rain - prefer biological control
- Focus on drainage to reduce pest breeding`,
        content_hi: `कीट प्रबंधन के लिए मानसून पूर्व तैयारी...`,
        keywords: ['Kharif', 'monsoon', 'seasonal', 'preparation', 'pest forecast'],
        source: 'expert',
        confidence: 0.89,
        seasonal_relevance: ['Kharif'],
        applicability: 'all'
    }
];

async function seedKnowledgeBase() {
    try {
        console.log('📚 Starting knowledge base seeding...');

        let count = 0;
        for (const data of knowledgeBaseData) {
            // Check if already exists
            const existing = await KnowledgeBase.findOne({
                title: data.title,
                category: data.category
            });

            if (existing) {
                console.log(`⏭️  Knowledge base entry already exists: ${data.title}`);
                continue;
            }

            await KnowledgeBase.create(data);
            count++;
            console.log(`✓ Created knowledge base entry ${count}: ${data.title}`);
        }

        console.log(`\n✅ Knowledge base seeding complete!`);
        console.log(`📊 Stats: ${count} entries added`);
        console.log(`📝 Categories: IPM Strategy, Farming Practices, Regional Guidelines, Crop Management, Seasonal Guides`);

    } catch (error) {
        console.error('❌ Error seeding knowledge base:', error);
        throw error;
    }
}

module.exports = seedKnowledgeBase;

// Run if called directly
if (require.main === module) {
    const mongoose = require('mongoose');
    require('dotenv').config();

    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agri-guardian')
        .then(() => {
            console.log('✓ Connected to MongoDB');
            return seedKnowledgeBase();
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
