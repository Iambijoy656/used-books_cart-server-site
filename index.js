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


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    // console.log(authHeader);
    if (!authHeader) {
        return res.status(401).send('Unauthorize access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' });
        }
        req.decoded = decoded
        next();
    })
}







async function run() {
    try {
        const categoriesCollection = client.db('booksCart').collection('categories')
        const booksCollection = client.db('booksCart').collection('allBooks')

        const buyerDetailsCollection = client.db('booksCart').collection('buyerDetails')

        const usersCollection = client.db('booksCart').collection('users')



        // get all categories
        app.get('/categories', async (req, res) => {
            const query = {};
            const categories = await categoriesCollection.find(query).toArray()
            res.send(categories)
        })






        app.get('/category/:name', async (req, res) => {
            const name = req.params.name;
            console.log(name);
            const query = {}
            const allBooks = await booksCollection.find(query).toArray();

            const category_books = allBooks.filter(c => c.category === name);
            res.send(category_books)


        })

        // get all books
        app.get('/allBooks', async (req, res) => {
            const query = {}
            const allBooks = await booksCollection.find(query).toArray();
            res.send(allBooks)
        })



        app.get('/getLimitBooks', async (req, res) => {
            const query = {}
            const cursor = booksCollection.find(query)
            const books = await cursor.limit(6).toArray();
            res.send(books)
        })




        // jwt

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_KEY, { expiresIn: '10h' })
                return res.send({ accessToken: token });
            }

            console.log(user)
            res.status(403).send({ accessToken: '' })

        })





        //  buyers

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users)
        })


        // app.get('/users/admin/:email', async (req, res) => {
        //     const email = req.params.email;
        //     const query = { email }
        //     const user = await usersCollection.findOne(query)
        //     res.send({ isAdmin: user?.role === 'admin' })
        // })



        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)

        })


        // app.put('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: ObjectId(id) }
        //     const options = { upsert: true }
        //     const updatedDoc = {
        //         $set: {
        //             role: 'admin',
        //         }
        //     }
        //     const result = await usersCollection.updateOne(filter, updatedDoc, options)

        //     res.send(result)
        // })




        // buyer details 

        app.get('/orders', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const query = { email: email }
            const orders = await buyerDetailsCollection.find(query).toArray();
            res.send(orders)

        })


        app.post('/buyers', async (req, res) => {
            const buyer = req.body;
            const result = await buyerDetailsCollection.insertOne(buyer)
            res.send(result)

        })






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