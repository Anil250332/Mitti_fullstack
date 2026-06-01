const { Settings } = require("../../models");

/**
 * Create or Update General Settings (Single Record)
 */
exports.saveGeneralSettings = async (req, res) => {
  try {
    const { contactNo, email, address, openingTime, closingTime, facebook, instagram, youtube, linkedin } = req.body;

    let logo = req.body.logo;
    let qrCode = req.body.qrCode;

    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        logo = `/uploads/settings/${req.files.logo[0].filename}`;
      }
      if (req.files.qrCode && req.files.qrCode[0]) {
        qrCode = `/uploads/settings/${req.files.qrCode[0].filename}`;
      }
    }

    const existing = await Settings.findOne();
    
    // Prepare data object with only defined fields
    const dataToSave = {};
    const bodyFields = [
      'contactNo', 'email', 'address', 'openingTime', 'closingTime', 
      'facebook', 'instagram', 'youtube', 'linkedin'
    ];
    
    bodyFields.forEach(f => {
      if (req.body[f] !== undefined) dataToSave[f] = req.body[f];
    });

    if (logo) dataToSave.logo = logo;
    if (qrCode) dataToSave.qrCode = qrCode;

    let data;
    if (existing) {
      data = await existing.update(dataToSave);
    } else {
      data = await Settings.create(dataToSave);
    }

    return res.status(200).json({ success: true, message: "General settings saved successfully", data });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to save general settings", error: error.message });
  }
};

/**
 * Get General Settings (Public or Admin)
 */
exports.getGeneralSettings = async (req, res) => {
  try {
    const data = await Settings.findOne();

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch general settings" });
  }
};
