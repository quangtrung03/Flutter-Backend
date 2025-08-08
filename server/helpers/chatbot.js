const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  // Example: Send message to an NLP service (e.g., Dialogflow, OpenAI)
  try {
    const response = await axios.post('https://api.example.com/nlp', {
      message: userMessage,
    });

    const botResponse = response.data.reply;
    res.json({ reply: botResponse });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Chatbot server running on port ${PORT}`);
});