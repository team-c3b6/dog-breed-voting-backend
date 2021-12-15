import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false };
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting;
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()); //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

// app.get("/", async (req, res) => {
//   const dbres = await client.query('select * from categories');
//   res.json(dbres.rows);
// });

// GET /breeds
app.get("/breeds", async (req, res) => {
  const dbres = await client.query("select * from breeds order by votes desc");
  const breedsList = dbres.rows;
  res.status(200).json({
    status: "success",
    data: {
      breedsList,
    },
  });
});

// GET /breeds/:id
app.get("/breeds/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const queryResults = await client.query(
    "select * from breeds where id = $1",
    [id]
  );
  const breed = queryResults.rows[0];

  if (breed) {
    res.json({
      status: "success",
      data: breed,
    });
  } else {
    res.status(404).json({
      status: "fail",
      data: {
        id: "Could not find a breed with that id identifier",
      },
    });
  }
});

//POST /breeds
app.post("/breeds", async (req, res) => {
  const { breed, image_url } = req.body;
  const queryResults = await client.query(
    "select * from breeds where breed = $1",
    [breed]
  );
  const breedFound = queryResults.rows[0];

  if (breedFound) {
    const voteUpdate = await client.query(
      "update breeds set votes = votes + 1 where breed = $1 returning *",
      [breed]
    );
    res.status(200).json({
      status: "success",
      data: voteUpdate,
    });
  } else {
    const addBreed = await client.query(
      "insert into breeds (breed, image_url) values ($1, $2) returning *",
      [breed, image_url]
    );
    res.status(200).json({
      status: "success",
      data: addBreed,
    });
  }
});

// DELETE /breeds/:id
app.delete("/breeds/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const queryResult = await client.query(
    "delete from breeds where id = $1 returning *",
    [id]
  );
  const removedBreed = queryResult.rows[0];

  if (removedBreed) {
    res.status(200).json({
      status: "success",
    });
  } else {
    res.status(404).json({
      status: "fail",
      data: {
        id: "Could not find a breed with that id identifier",
      },
    });
  }
});

// DELETE /breeds
app.delete("/breeds", async (req, res) => {
  const queryResult = await client.query("delete from breeds");

  res.status(200).json({
    status: "success",
  });
});

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw "Missing PORT environment variable.  Set it in .env file.";
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
