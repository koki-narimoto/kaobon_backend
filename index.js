const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const multer = require("multer");
const path = require("path");

const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");


dotenv.config();

const app = express();

mongoose 
 .connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true   })   
 .then(() => console.log("Database connected!"))
 .catch(err => console.log(err));

 // tells rest api to just go to images as opposed to looking for a get request
app.use("/images", express.static(path.join(__dirname, "/public/images")));

app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/images");
    },
    filename: (req, file, cb) => {
        cb(null, req.body.name);
    }
});

const upload = multer({storage : storage});

app.post("/api/upload", upload.single("file"), (req, res) => {
    try{
        return res.status(200).json("File uploaded successfully");
    }catch(err){
        console.log(err);
    }
});

app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);

// runs on local host 8800
app.listen(8800, ()=>{
    console.log("Backend server on 8800");
})