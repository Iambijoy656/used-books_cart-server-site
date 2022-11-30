const express = require('express');
const cors = require('cors');
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const port = process.env.PORT || 5000;

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

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

        const paymentsCollection = client.db('booksCart').collection('payments')


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







        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)

        })




        app.get('/userRole', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }

            const user = await usersCollection.findOne(query);

            if (user?.role === "admin") {
                res.send(user)
            }
            else if (user?.role === "seller") {
                res.send(user)
            }
            else {
                res.send(user)
            }

        })




        //  buyers

        app.get('/buyers', async (req, res) => {
            const query = {
                role: "buyer",
            };
            const buyers = await usersCollection.find(query).toArray();
            res.send(buyers)


        })

        // get Sellers
        app.get('/sellers', async (req, res) => {
            const query = {
                role: "seller",
            };
            const sellers = await usersCollection.find(query).toArray();
            res.send(sellers)


        })


        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const order = await buyerDetailsCollection.findOne(query);
            res.send(order)
        })


        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const orders = await buyerDetailsCollection.find(query).toArray();
            res.send(orders)

        })


        app.post('/buyers', async (req, res) => {
            const buyer = req.body;
            const result = await buyerDetailsCollection.insertOne(buyer)
            res.send(result)

        })


        // delete buyer
        app.delete('/buyers/delete-buyers', async (req, res) => {
            const id = req.query.id;
            const filter = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(filter)
            res.send(result)

        })




        app.post('/add-products', async (req, res) => {
            const product = req.body;
            const result = await booksCollection.insertOne(product);
            res.send(result)
        })


        app.get('/my-products', async (req, res) => {
            const email = req.query.email;
            const query = {
                sellerEmail: email
            }
            const myProducts = await booksCollection.find(query).toArray()
            res.send(myProducts)


        })
        app.get('/getReported', async (req, res) => {
            const query = {
                reported: true
            }
            const reportedProducts = await booksCollection.find(query).toArray()
            res.send(reportedProducts)


        })




        app.delete('/delete-product', async (req, res) => {
            const id = req.query.id;
            const filter = { _id: ObjectId(id) }
            const result = await booksCollection.deleteOne(filter)
            res.send(result)

        })





        //for payment
        app.post('/create-payment-intent', async (req, res) => {
            const order = req.body;
            const price = order.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ],

            })
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            console.log(payment)
            const result = await paymentsCollection.insertOne(payment);
            const _id = payment.orderId
            const filter = { _id: ObjectId(_id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updateResult = await buyerDetailsCollection.updateOne(filter, updatedDoc)
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