const express = require('express');
const cors = require('cors');
const app = express()
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const port = process.env.PORT || 5000;



// middleware
app.use(cors())
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.iyuahvh.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const categoriesCollection = client.db('booksCart').collection('categories')
        const booksCollection = client.db('booksCart').collection('allBooks')

        // get all categories
        app.get('/categories', async (req, res) => {
            const query = {};
            const categories = await categoriesCollection.find(query).toArray()
            res.send(categories)
        })


        // get all books
        app.get('/allBooks', async (req, res) => {
            const query = {}
            const cursor = booksCollection.find(query)
            const allBooks = await cursor.toArray();
            res.send(allBooks)
        })

        // app.post('/services', async (req, res) => {
        //     const service = req.body;
        //     const result = await serviceCollection.insertOne(service);
        //     res.send(result)

        // })



        app.get('/getLimitBooks', async (req, res) => {
            const query = {}
            const cursor = booksCollection.find(query)
            const books = await cursor.limit(6).toArray();
            res.send(books)
        })


        // app.get('/services/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) }
        //     const service = await serviceCollection.findOne(query);
        //     res.send(service)
        // })








    } finally {

    }

}
run().catch(error => console.error(error))


app.get('/', (req, res) => {
    res.send('books Cart server is running')
})


app.listen(port, () => {
    console.log(`Books Cart server running on port ${port}`)
})