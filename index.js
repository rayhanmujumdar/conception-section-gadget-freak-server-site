const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000
require('dotenv').config()
var jwt = require('jsonwebtoken');
//middlewire
app.use(cors())
app.use(express.json())

app.get('/user', (req, res) => {
    res.send('hello world')
})
console.log()

const {
    MongoClient,
    ServerApiVersion,
    ObjectId
} = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wmjc8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1
});

const verifyToken = (token) => {
    let email
    jwt.verify(token, process.env.DB_SECRET_CODE, function (err, decoded) {
        if (err) {
            email = 'Invalid'
        } else {
            email = decoded
        }
    });
    // console.log(email)
    return email
}
const run = async () => {
    try {
        await client.connect()
        const productCollection = client.db('gadgetProduct').collection('product')
        const orderCollection = client.db('gadgetProduct').collection('orderList')
        // Order list added
        app.post('/order',async(req,res) => {
            const order = req.body
            const auth = req.headers.authorization
            const token = auth.split(' ')[1]
            const verifyEmail = verifyToken(token)
            console.log(verifyEmail)
            if(verifyEmail.email === order.email){
                const result = await orderCollection.insertOne(order)
                res.send({success: "Successfully send order"});
            }else{
                res.send({sucess: "UnAuthorized Access"})
            }
        })
        //get my order api
        app.get('/order',async(req,res) => {
            const query = req.query
            const auth = req.headers.authorization
            const token = auth.split(" ")[1]
            const verifyEmail = verifyToken(token)
            if(query.email === verifyEmail.email){
                const cursor = orderCollection.find(query)
                const result = await cursor.toArray()
                res.send(result)
            }
            else{
                res.send({success: 'UnAuthorized Access'})
            }
        })
        // delete ordered product
        app.delete('/order/:id',async (req,res) => {
            const id = req.params.id
            const query = {_id: ObjectId(id)}
            const result = await orderCollection.deleteOne(query)
            res.send(result)
        })
        //get the product data
        app.get('/product',async(req,res) => {
            const query = req.query
            const cursor = productCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })
        // get a single product data
        app.get('/productId/:id',async(req,res) => {
            const id = req.params
            const query = {_id: ObjectId(id)}
            const result = await productCollection.findOne(query)
            res.send(result)
        })
        //get a single product 
        app.post('/product', async (req, res) => {
            const product = req.body
            const [email, token] = req.headers.authorization.split(" ")
            const verifyEmail = verifyToken(token)
            if (email === verifyEmail.email) {
                const result = await productCollection.insertOne(product)
                res.send({success: 'Product Upload Successfully' })
            }
            else{
                res.send({success: "UnAuthorized Access"})
            }
        })
        // login jwt token make
        app.post('/login', (req, res) => {
            const email = req.body
            const accessToken = jwt.sign(email, process.env.DB_SECRET_CODE);
            res.send({
                accessToken
            })
        })

    } finally {

    }
}

run().catch(console.dir)


app.listen(port, () => {
    console.log('lising my voice of port' + port)
})