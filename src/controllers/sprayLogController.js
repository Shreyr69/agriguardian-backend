const SprayLog = require('../models/SprayLog');
const Crop = require('../models/Crop');

// GET /api/spray-logs (requires auth)
exports.getSprayLogs = async (req, res) => {
    try {
        const sprayLogs = await SprayLog.find({ user_id: req.userId })
            .populate('crop_id', 'name name_hi')
            .sort({ spray_date: -1 });

        res.json(sprayLogs);
    } catch (error) {
        console.error('Get spray logs error:', error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/spray-logs (requires auth)
exports.createSprayLog = async (req, res) => {
    try {
        const { crop_id, pesticide_name, dose, spray_date, notes } = req.body;

        if (!pesticide_name) {
            return res.status(400).json({ error: 'Pesticide name is required' });
        }

        const sprayLog = new SprayLog({
            user_id: req.userId,
            crop_id: crop_id || null,
            pesticide_name,
            dose,
            spray_date: spray_date || new Date(),
            notes
        });

        await sprayLog.save();

        // Populate crop info before returning
        await sprayLog.populate('crop_id', 'name name_hi');

        res.status(201).json(sprayLog);
    } catch (error) {
        console.error('Create spray log error:', error);
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/spray-logs/:id (requires auth)
exports.deleteSprayLog = async (req, res) => {
    try {
        const sprayLog = await SprayLog.findOne({
            _id: req.params.id,
            user_id: req.userId
        });

        if (!sprayLog) {
            return res.status(404).json({ error: 'Spray log not found or unauthorized' });
        }

        await sprayLog.deleteOne();

        res.json({ message: 'Spray log deleted successfully' });
    } catch (error) {
        console.error('Delete spray log error:', error);
        res.status(500).json({ error: error.message });
    }
};
