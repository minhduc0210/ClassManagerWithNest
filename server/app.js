//Import
const express = require('express')
require("dotenv").config()
const cors = require("cors")
const cookieParser = require("cookie-parser");

//App settings
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

//Get env
const hostname = process.env.HOSTNAME
const port = process.env.PORT

//Connect to database
require("./database_connection/DbConnection")

//Router
const router = require("./routers");
app.use("/", router);

//Run server
app.listen(port, hostname, () => {
    console.log(`Server is running at http://${hostname}:${port}`)
})