const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongo connect
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ggulbwq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const productCollection = client.db("hbShop").collection("products");

    app.get("/products", async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6;
      const skip = (page - 1) * limit;
      const searchQuery = req.query.search || "";
      const brand = req.query.brand || "";
      const category = req.query.category || "";
      const priceRange = req.query.priceRange || "";
      const sortBy = req.query.sortBy || "";
      const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;

      // Build the query
      let query = {};

      if (searchQuery) {
        query.productName = { $regex: searchQuery, $options: "i" };
      }
      if (brand) {
        query.brandName = brand;
      }
      if (category) {
        query.categoryName = category;
      }
      if (priceRange) {
        query.priceRange = priceRange;
      }

      // Build the sort criteria
      let sortCriteria = {};
      if (sortBy === "price") {
        sortCriteria.price = sortOrder;
      } else if (sortBy === "date") {
        sortCriteria.productCreationDate = sortOrder;
      }

      const totalProducts = await productCollection.countDocuments(query);
      const result = await productCollection
        .find(query)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .toArray();

      res.send({
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
        products: result,
      });
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hb Collection server is running......");
});

app.listen(port, () => console.log(`Server is running on port: ${port}`));
