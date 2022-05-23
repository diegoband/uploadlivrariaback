const mongoose = require("mongoose");

const DB_USER = "diegoband";
const DB_PASSWORD = encodeURIComponent("bandeira");

mongoose
  .connect(
    `mongodb+srv://${DB_USER}:${DB_PASSWORD}@cluster0.7xqv2.mongodb.net/booksebenezer?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log("Conectamos ao MongoDB!");
  })
  .catch((err) => {
    console.log(err);
  });

module.exports = mongoose;
