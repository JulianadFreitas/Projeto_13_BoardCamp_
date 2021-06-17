import express from "express";
import cors from "cors";
import pg from "pg";

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pg;

const connection = new Pool({
  user: "bootcamp_role",
  password: "senha_super_hiper_ultra_secreta_do_role_do_bootcamp",
  host: "localhost",
  port: 5432,
  database: "boardcamp",
});

app.get("/categories", async (req, res) => {
  try {
    const categories = await connection.query("SELECT * FROM categories");
    res.send(categories.rows);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

app.post("/categories", async (req, res) => {
  const { name } = req.body;
  try {
    const categories = await connection.query("SELECT * FROM categories");
    const data = categories.rows;
    const findCategorie = data.find((e) => e.name === name);
    if (name === "") {
      return res.sendStatus(400);
    } else if (findCategorie) {
      return res.sendStatus(409);
    }
    console.log(data);
    console.log(findCategorie);
    console.log(req.body);
    console.log(data.includes(name));
    await connection.query("INSERT INTO categories (name) VALUES ($1)", [name]);
    res.sendStatus(201);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

app.listen(4000, () => {
  console.log("Server listening on port 4000. ");
});