const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.static('public'));

const PORT = 3000;

// Wikipedia API endpoint
app.get('/api/wiki', async (req, res) => {
    try {
        const response = await axios.get('https://en.wikipedia.org/w/api.php', {
            params: {
                action: 'query',
                format: 'json',
                prop: 'extracts',
                exintro: true,
                explaintext: true,
                redirects: 1,
                titles: req.query.query
            }
        });

        console.log("Wikipedia API Response:", response.data); // Log the full response

        const pages = response.data.query.pages;
        const pageId = Object.keys(pages)[0];
        
        // Handle missing page or invalid results
        if (!pageId || pageId === "-1") {
            console.log("No results found for query:", req.query.query); // Log missing results
            return res.json({
                title: "No results found",
                briefSummary: "No Wikipedia page found for your search query.",
                detailedExplanation: "Please try another search term or check the spelling.",
                relatedQuestions: []
            });
        }

        const page = pages[pageId];
        const extract = page.extract || 'No summary available';

        // Split the extract into brief and detailed parts
        const briefSummary = extract.split('\n')[0] || 'No brief summary available';
        const detailedExplanation = extract || 'No detailed explanation available';

        console.log("Page Title:", page.title); // Log the page title
        console.log("Brief Summary:", briefSummary); // Log the brief summary
        console.log("Detailed Explanation:", detailedExplanation); // Log the detailed explanation

        res.json({
            title: page.title,
            briefSummary: briefSummary,
            detailedExplanation: detailedExplanation,
            relatedQuestions: generateRelatedQuestions(req.query.query)
        });
    } catch (error) {
        console.error("Wikipedia API Error:", error); // Log any errors
        res.status(500).json({ error: 'Wikipedia API error' });
    }
});

// YouTube API endpoint (unchanged)
app.get('/api/youtube', async (req, res) => {
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: req.query.query,
                type: 'video',
                maxResults: 5,
                key: process.env.YOUTUBE_API_KEY
            }
        });

        const videos = response.data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title
        }));

        res.json({ videos });
    } catch (error) {
        res.status(500).json({ error: 'YouTube API error' });
    }
});

// Generate related questions (unchanged)
function generateRelatedQuestions(query) {
    const keywords = query.toLowerCase().split(' ');
    const starters = ['What is', 'How to', 'History of', 'Best way to', 'Why does'];
    return starters.map(start => `${start} ${keywords.slice(0, 3).join(' ')}?`);
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});