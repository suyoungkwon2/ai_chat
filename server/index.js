const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}))
app.post('/api/receive_msg', (req, res) => {
    const sender = req.headers['sender'];
    console.log('Sender from header:', sender);
    // const message = req.headers['message'] || null;
    // const sender_situation = req.headers['sender_situation'] || null;
    const body_message = req.body;
    const message = body_message.message || null;
    const sender_situation = body_message.sender_situation || null;
    console.log('Received body message:', body_message);

    response_dummy = {
        status: 200,
        msg: {
            situation: `dummy situation for ${sender_situation}`,
            message: `dummy message response for ${message}`,
            Heart: `dummy inner thought ${sender}`,
        }
    }
    res.json({ status: 'ok', received: response_dummy });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});