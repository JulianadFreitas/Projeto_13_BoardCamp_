import express from "express";
import cors from "cors";
import pg from "pg";
import joi from "joi";
import dayjs from "dayjs";

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
      res.send(resultado);
    }
    res.send(customers.rows);
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
    birthday: joi.date().iso().less("now"),
  });
  const isValid = schema.validate(req.body);
  try {
    const findCpf = await connection.query(
      "SELECT * FROM customers WHERE cpf = $1",
      [cpf]
    );

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

app.put("/customers/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, phone, cpf, birthday } = req.body;
  const schema = joi.object({
    name: joi.string().required(),
    phone: joi.string().min(10).max(11).alphanum().required(),
    cpf: joi.string().length(11).alphanum().required(),
    birthday: joi.date().iso().less("now"),
  });
  const isValid = schema.validate(req.body);
  try {
    const findCpf = await connection.query(
      "SELECT * FROM customers WHERE cpf = $1",
      [cpf]
    );
    const findIdCpf = await connection.query(
      "SELECT * FROM customers WHERE id = $1",
      [id]
    );
    if (isValid.error) {
      return res.sendStatus(400);
    } else if (
      findCpf.rows.length === 0 ||
      (findCpf.rows.length !== 0 && findIdCpf.rows[0].id === id)
    ) {
      await connection.query(
        "UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5",
        [name, phone, cpf, birthday, id]
      );
      res.sendStatus(200);
    } else {
      return res.sendStatus(409);
    }
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

app.get("/rentals", async (req, res) => {
  try {
    if (!!req.query.customerId) {
      const request = await connection.query(
        `SELECT rentals.*, customers AS customer, games AS game
             FROM rentals
             JOIN customers ON rentals."customerId" = customers.id
             JOIN games ON rentals."gameId" = games.id
             WHERE "customerId" = $1`,
        [req.query.customerId]
      );
      return res.send(request.rows);
    } else if (!!req.query.gameId) {
      const request = await connection.query(
        `SELECT rentals.*, customers AS customer, games AS game
             FROM rentals
             JOIN customers ON rentals."customerId" = customers.id
             JOIN games ON rentals."gameId" = games.id
             WHERE "gameId" = $1`,
        [req.query.gameId]
      );
      return res.send(request.rows);
    }
    const request = await connection.query(`
           SELECT rentals.*, customers AS customer, games AS game
           FROM rentals
           JOIN customers ON rentals."customerId" = customers.id
           JOIN games ON rentals."gameId" = games.id
         `);
    res.send(request.rows);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

app.post("/rentals", async (req, res) => {
  const { customerId, gameId, daysRented } = req.body;
  const schema = joi.object({
    daysRented: joi.number().min(1).required(),
    customerId: joi.number().min(1).required(),
    gameId: joi.number().min(1).required(),
  });
  const findCustomerId = await connection.query(
    "SELECT * FROM customers WHERE id = $1",
    [customerId]
  );
  const findGameId = await connection.query(
    "SELECT * FROM games WHERE id = $1",
    [gameId]
  );
  const isValid = schema.validate(req.body);
  try {
    if (
      isValid.error ||
      !findCustomerId.rows[0] ||
      !findGameId.rows[0] ||
      findGameId.rows[0].stockTotal < 1
    ) {
      res.sendStatus(400);
      return;
    }
    await connection.query(
      'INSERT INTO rentals ("customerId", "gameId", "daysRented", "rentDate", "originalPrice", "returnDate", "delayFee" ) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        customerId,
        gameId,
        daysRented,
        dayjs().format("YYYY-MM-DD"),
        findGameId.rows[0].pricePerDay * daysRented,
        null,
        null,
      ]
    );
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

app.post("/rentals/:id/return", async (req, res) => {
  const id = req.params.id;
  const today = dayjs();
  try {
    const rental = await connection.query(
      "SELECT * FROM rentals WHERE id = $1",
      [id]
    );
    if (!rental.rows.length) return res.sendStatus(404);
    if (rental.rows[0].returnDate !== null) return res.sendStatus(400);
    const game = await connection.query("SELECT * FROM games WHERE id = $1", [
      rental.rows[0].gameId,
    ]);
    let delay;
    const initialDay = rental.rows[0].rentDate;
    const lastday = new Date();
    const daysPassedSinceRental = Math.round(
      (new Date(today).getTime() - new Date(initialDay).getTime()) / 86400000
    );

    if (daysPassedSinceRental <= 0) {
      delay = null;
    } else {
      delay = daysPassedSinceRental * game.rows[0].pricePerDay;
    }

    const teste = await connection.query(
      'UPDATE rentals SET "returnDate" = $1, "delayFee" = $2 WHERE id = $3',
      [today, delay, id]
    );
    await connection.query(
      `UPDATE games SET "stockTotal" = "stockTotal" + 1 WHERE id = $1`,
      [rent.rows[0].gameId]
    );

    res.sendStatus(200);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

app.delete("/rentals/:id", async (req, res) => {
  const rentalId = req.params.id;
  try {
    const rentalExists = await connection.query(
      "SELECT * FROM rentals WHERE id = $1",
      [rentalId]
    );
    if (!rentalExists.rows.length) return res.sendStatus(404);
    if (rentalExists.rows[0].returnDate) return res.sendStatus(400);

    await connection.query("DELETE FROM rentals WHERE id = $1", [rentalId]);
    return res.sendStatus(200);
  } catch {
    return res.sendStatus(500);
  }
});

app.listen(4000, () => {
  console.log("Server listening on port 4000. ");
});
