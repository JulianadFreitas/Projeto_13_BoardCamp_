import express from "express";
import cors from "cors";
import pg from "pg";
import joi from "joi";

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
    const games = await connection.query(
      'SELECT id, name, image, "stockTotal", "categoryId", "pricePerDay",(SELECT name FROM categories WHERE id="categoryId") AS "categoryName" FROM games'
    );
    console.log(games);
    if (parameter) {
      const num = parameter.length;
      const resultado = data.filter((e) => {
        const split = e.name.slice(0, num);
        return split === parameter;
      });
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
    const categories = await connection.query("SELECT * FROM categories");
    const categoryName = categories.rows.filter(
      (e) => e.id === parseInt(categoryId)
    );

    if (
      name === "" ||
      parseInt(stockTotal) === 0 ||
      parseInt(pricePerDay) === 0 ||
      categoryName.length === 0
    ) {
      return res.sendStatus(400);
    } else if (findGame) {
      return res.sendStatus(409);
    }

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

app.get("/customers", async (req, res) => {
  const parameter = req.query.cpf;
  try {
    const customers = await connection.query("SELECT * FROM customers");
    const data = customers.rows;
    if (parameter) {
      const num = parameter.length;
      const resultado = data.filter((e) => {
        const split = e.cpf.slice(0, num);
        return split === parameter;
      });
      console.log(resultado);
      res.send(resultado);
    }
    res.send(customers.rows);

   console.log(parameter);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

app.get("/customers/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const customer = await connection.query(
      "SELECT * FROM customers WHERE id=$1",
      [id]
    );
    if (customer.rows[0]) {
      res.send(customer.rows[0]);
    } else {
      res.sendStatus(404);
    }
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

app.post("/customers", async (req, res) => {
  const { name, phone, cpf, birthday } = req.body;
  const schema = joi.object({
    name: joi.string().required(),
    phone: joi.string().min(10).max(11).alphanum().required(),
    cpf: joi.string().length(11).alphanum().required(),
    birthday: joi.date().iso().less('now'),
  });
  const isValid = schema.validate(req.body);
  try {
    const findCpf = await connection.query("SELECT * FROM customers WHERE cpf = $1", [cpf]);
    console.log(findCpf.rows, "aqui");

    if (isValid.error) {
      return res.sendStatus(400);
    } else if (findCpf.rows.length === 0) {
      await connection.query(
        "INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)",
        [name, phone, cpf, birthday]
        );
      res.sendStatus(201);
    } else {
      return res.sendStatus(409);
    }
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});






app.listen(4000, () => {
  console.log("Server listening on port 4000. ");
});
