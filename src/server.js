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

app.get("/games", async (req, res) => {
  const parameter = req.query.name;
  try {
    const games = await connection.query("SELECT * FROM games");
    const data = games.rows;
    if (parameter) {
      const num = parameter.length;
      const resultado = data.filter((e) => {
        const split= e.name.slice(0, num);
        return split === parameter;
      });
      console.log(resultado);
      res.send(resultado);
    }
    res.send(games.rows);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

app.post("/games", async (req, res) => {
  const { name, image, stockTotal, categoryId, pricePerDay } = req.body;
  try {
    const games = await connection.query("SELECT * FROM games");
    const data = games.rows;
    const findGame = data.find((e) => e.name === name);

    if (
      name === "" ||
      parseInt(stockTotal) === 0 ||
      parseInt(pricePerDay) === 0
    ) {
      return res.sendStatus(400);
    } else if (findGame) {
      return res.sendStatus(409);
    }
    console.log(stockTotal);
    console.log(findGame);
    console.log(req.body);
    console.log(data.includes(name));
    await connection.query(
      'INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)',
      [name, image, stockTotal, categoryId, pricePerDay]
    );
    res.sendStatus(201);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

app.listen(4000, () => {
  console.log("Server listening on port 4000. ");
});
