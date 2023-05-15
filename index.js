
const express = require("express");
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000

app.use(express.json());
app.use(cors());


app.get("/", (req, res) => {
    res.send("Cars Doctor Server is running....");
})

const verifyJWT = (req, res, next) => {
    console.log('hiting verify jwt')
    console.log(req.headers.authorization);
    const authorization = req.headers.authorization;
    if(!authorization){
        return res.status(401).send({error: true, message: 'unauthorized access'})
    }
    const token = authorization.split(' ')[1];
    console.log('token', token);
    jwt.verify(token, process.env.CAR_ACCESS_TOKEN, (error, decoded)=>{
        if(error){
            return res.status(403).send({error: true, message: 'unauthorized access'});
        }
        req.decoded = decoded;
        next();
    })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l6kpz6n.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const carDoctorCollection = client.db("carDoctor").collection("services");
        const bookingCollection = client.db("carDoctor").collection("bookings");

        app.get("/services", async (req, res) => {
            const cursor = carDoctorCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        // 
        app.get("/service/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            const options = {
                projection: { title: 1, price: 1, service_id: 1, img: 1 },
            };

            const result = await carDoctorCollection.findOne(query, options);
            res.send(result);
        })


        // bookings

        app.get("/booking", verifyJWT, async (req, res) => {
            // console.log(req.headers.authorization);
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email };
            }
            const result = await bookingCollection.find(query).toArray()
            res.send(result);
        })

        app.post("/booking", async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result);

        })

        // delete
        app.delete("/booking/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingCollection.deleteOne(query);
            res.send(result);
        })


        // jwt token
        app.post("/jwt", (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.CAR_ACCESS_TOKEN, { expiresIn: '1h' });
            res.send({ token });
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.listen(PORT, () => {
    console.log("Car doctor server is running on PORT: ", PORT);
})