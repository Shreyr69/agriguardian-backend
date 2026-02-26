const Crop = require('../models/Crop');
const Pest = require('../models/Pest');

// GET /api/crops
exports.getAllCrops = async (req, res) => {
    try {
        const crops = await Crop.find().sort({ name: 1 });
        res.json(crops);
    } catch (error) {
        console.error('Get crops error:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/crops/:id
exports.getCropById = async (req, res) => {
    try {
        const crop = await Crop.findById(req.params.id);

        if (!crop) {
            return res.status(404).json({ error: 'Crop not found' });
        }

        // Optionally include pests
        const pests = await Pest.find({ crop_id: crop._id });

        res.json({
            ...crop.toJSON(),
            pests
        });
    } catch (error) {
        console.error('Get crop error:', error);
        res.status(500).json({ error: error.message });
    }
};
