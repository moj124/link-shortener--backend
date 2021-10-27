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
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: herokuSSLSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

app.get("/", async (req, res) => {

});

app.get("/urls", async (req, res) => {
  try {
    const text = "SELECT new_link, base_link FROM links ORDER BY link_id DESC";
    const query = await client.query(text);
    // console.log(query.rows);
    res.status(201).json({
      status: 200,
      data: query.rows
    });
  } catch (err) {
    console.log(err);
  }
});

app.get("/:link", async (req, res) => {
  const {link} = req.params;
  try {
    const text = "SELECT base_link FROM links WHERE new_link = $1";
    const queried_data = await client.query(text,[link]);
    const original_link = queried_data.rows[0].base_link;
    res.redirect(301,original_link);
  } catch (err) {
    console.error(err);
  }
});

app.delete("/:link", async (req, res) => {
  const {link} = req.params;
  try{
    const text = "DELETE FROM links WHERE new_link = $1";
    const query = await client.query(text,[link]);
    // console.log(link)

    res.status(201).json({
      status: "OK"
    })
  } catch (err) {
    console.error(err);
  }
});

app.put("/", async (req, res) => {
  const {link, originalURL} = req.body;
  console.log(link,originalURL)
try{
  const text = 'INSERT INTO links(new_link, base_link) VALUES($1,$2)';
  await client.query(text,[link,originalURL]);

  res.status(201).json({
    status: "Success"
  });
} catch (err) {
  console.error(err.message);
}
});


//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
