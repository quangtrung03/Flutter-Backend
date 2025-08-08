const SupportRequest = require('../../models/SupportRequest.js');

exports.createSupportRequest = async (req, res) => {
  try {
    const supportRequest = new SupportRequest(req.body);
    await supportRequest.save();
    res.status(201).send({ message: 'Support request saved successfully' });
  } catch (error) {
    res.status(400).send({ error: 'Failed to save support request' });
  }
};
exports.getSupportRequests = async (req, res) => {
  try {
    const supportRequests = await SupportRequest.find();
    res.status(200).send(supportRequests);
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch support requests' });
  }
};

exports.deleteSupportRequest = async (req, res) => {
  try {
    const { id } = req.params;
    await SupportRequest.findByIdAndDelete(id);
    res.status(200).send({ message: 'Support request deleted successfully' });
  } catch (error) {
    res.status(400).send({ error: 'Failed to delete support request' });
  }
};

exports.respondToSupportRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    const updatedRequest = await SupportRequest.findByIdAndUpdate(
      id,
      { response, respondedAt: new Date() },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).send({ error: 'Support request not found' });
    }

    res.status(200).send({ message: 'Response sent successfully', data: updatedRequest });
  } catch (error) {
    res.status(400).send({ error: 'Failed to send response' });
  }
};
