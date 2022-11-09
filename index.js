const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.epizi.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// jwt token
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const reviewCollection = client
      .db("touristMan")
      .collection("reviewCollection");
    const serviceCollection = client
      .db("touristMan")
      .collection("serviceCollection");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ token });
    });
    app.get("/services", async (req, res) => {
      let query = {};

      const cursor = serviceCollection.find(query).limit(3);
      const result = await cursor.toArray();
      res.send(result);
      // console.log(allServices);
      // res.send(allServices);
    });
    app.get("/allServices", async (req, res) => {
      let query = {};

      const cursor = serviceCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
      // console.log(allServices);
      // res.send(allServices);
    });
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });
    app.post("/allServices", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });
    app.get("/reviews", async (req, res) => {
      let query = {};
      if (req.query.service) {
        query = {
          service: req.query.service,
        };
      }
      const cursor = reviewCollection.find(query);
      const sortedReviews = cursor.sort({ date: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/myReviews", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      console.log("inside reviews api", decoded);
      //   if(decoded.email !== req.query.email){
      //    return res.status(403).send({message: 'unauthorized access'})
      // }
      let query = {};

      console.log(req.headers.authorization);

      if (req.query.email) {
        query = {
          reviewerEmail: req.query.email,
        };
      }
      console.log(query);
      const cursor = reviewCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/myReview/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await reviewCollection.findOne(query);
      res.send(service);
    });

    app.post("/reviews", async (req, res) => {
      const reviews = req.body;
      const result = await reviewCollection.insertOne(reviews);
      res.send(result);
    });
    app.patch("/myReview/:id", async (req, res) => {
      
      const id = req.params.id;
      const review = req.body;
      const query = { _id: ObjectId(id) };
      console.log(review);
      const option = { upsert: true};
      const updatedDoc = {
        $set: {
          reviewContent: review.reviewContent,
          ratings: review.ratings
        },
        
      };
      
      const result = await reviewCollection.updateOne(query, updatedDoc,option);
      res.send(result);
    });
    app.delete("/myReview/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch((err) => console.log(err));
app.get("/", (req, res) => {
  res.send("Hello from Tourist man server...");
});
app.listen(port, () => {
  console.log("Tourist Man Server is running....");
});
