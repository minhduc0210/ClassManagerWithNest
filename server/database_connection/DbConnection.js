const mongoose = require("mongoose");

mongoose
    .connect(`${process.env.URL}${process.env.DBNAME}`)
    .then(() => console.log("Connect to db by mongoose"))
    .catch((err) => console.log("Connect error: ", err))