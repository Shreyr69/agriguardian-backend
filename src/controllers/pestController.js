const Pest = require('../models/Pest');
const Advisory = require('../models/Advisory');
const Crop = require('../models/Crop');

// GET /api/pests
exports.getAllPests = async (req, res) => {
    try {
        const { crop_id } = req.query;

        const query = {};
        if (crop_id) {
            query.crop_id = crop_id;
        }

        const pests = await Pest.find(query)
            .populate('crop_id', 'name name_hi')
            .sort({ name: 1 });

        res.json(pests);
    } catch (error) {
        console.error('Get pests error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch pests'
        });
    }
};

// GET /api/pests/:id
exports.getPestById = async (req, res) => {
    try {
        const pest = await Pest.findById(req.params.id)
            .populate('crop_id', 'name name_hi');

        if (!pest) {
            return res.status(404).json({ error: 'Pest not found' });
        }

        // Get advisory for this pest
        const advisory = await Advisory.findOne({ pest_id: pest._id });

        res.json({
            ...pest.toJSON(),
            advisory: advisory || null
        });
    } catch (error) {
        console.error('Get pest error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch pest details'
        });
    }
};
