const express = require("express");
const cors = require("cors");

const port = 5000;
const app = express();

// Config JSON response

app.use(express.json());

//Solvers cors

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));

// Public folders

app.use(express.static("public"));

// Routes
const UserRoutes = require("./routes/UserRoutes");
const BookRoutes = require("./routes/BookRoutes");

app.use("/users", UserRoutes);
app.use("/books", BookRoutes);

app.listen(port, () => {
  console.log("http://localhost:5000");
  console.log(`Servidor na porta: ${port}`);
});
