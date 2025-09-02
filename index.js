const express = require("express");
const mongoose = require("mongoose");

require("dotenv").config();

const app = express();
const port = process.env.PORT;

mongoose.connect(process.env.MONGO_URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error: ", err))

const Movie = mongoose.connection.collection("movies");

app.get("/search", async (req, res) => {
    try {
        const query = req.query.q || "";

        const result = await Movie.aggregate([
            {
                $search: {
                    index: "default",
                    text: {
                        query: query,
                        path: {
                            wildcard: "*"
                        }
                    }
                }
            },
            { $limit: 5 },
            { $project: { title: 1, plot: 1, _id: 0 } }
        ]).toArray();

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err })
    }
})

app.get("/fuzzy-search", async (req, res) => {
    try {
        const query = req.query.q || "";

        const result = await Movie.aggregate([
            {
                $search: {
                    index: "default",
                    text: {
                        query: query,
                        path: { wildcard: "*" },
                        fuzzy: { maxEdits: 2 }
                    }
                }
            },
            { $limit: 5 },
            { $project: { title: 1, plot: 1, _id: 0 } }
        ]).toArray();

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err })
    }
})

app.get("/autocomplete", async (req, res) => {
    try {
        const query = req.query.q || "";

        const result = await Movie.aggregate([{
            $search: {
                index: "default",
                autocomplete: {
                    query: query,
                    path: "title"
                }
            },
        }, 
        { $limit: 5 },
        { $project: { title: 1, _id: 0 } }]).toArray();

        console.log("Result")

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err })
    }
})

// Search by filters like year, generes
app.get("/search-two", async (req, res) => {
    try {
        const query = req.query.q || "";
        const filter = req.query.genres || "Action"

        const result = await Movie.aggregate([
            {
                $search: {
                    index: "default",
                    compound: {
                        must: [
                            { text: {query: query, path: { wildcard: "*" }} }
                        ],
                        filter: [
                            { text: { query: filter, path: "genres"} }
                        ]
                    }
                }
            },
            { $limit: 5 },
            { $project: { title: 1, genres: 1, _id: 0 } }
        ]).toArray();

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err })
    }
})

app.get("/similarity", async (req, res) => {
    try{
        const query = req.query.q;

        const result = await Movie.aggregate([
            {
                $search: {
                    index: "default",
                    text: {
                        query: query,
                        path: ["title", "plot"],
                        synonyms: "movie_synonyms"
                    }
                }
            },
            { $limit: 5 },
            { $project: { titlt: 1, plot: 1, _id: 0 } }
        ]).toArray();

        res.json(result);
    } catch(err){
        console.error(err);
        res.status(500).json({ error: err })
    }
})

app.listen(port, () => {
    console.log(`Server running on port: ${port}`)
})