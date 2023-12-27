const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const { connectToMongoDB } = require("./connect");
const URL = require("./models/url"); 
const {checkForAuthentication,restrictTo} = require("./middleware/auth");


const urlRoute = require("./routes/url");
const staticRoute = require("./routes/staticRouter");
const userRoute = require("./routes/user");


const app = express();
const PORT = 8001;

connectToMongoDB("mongodb://127.0.0.1:27017/shorturl").then(() =>
  console.log("Mongodb connected")
);

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false}));
app.use(checkForAuthentication);

app.use("/url", restrictTo(["NORMAL", "ADMIN"]), urlRoute);
app.use("/user",userRoute);
app.use("/", staticRoute);

app.get("/url/:shortId", async (req,res) => {
  const shortId = req.params.shortId;
  const entry = await URL.findOneAndUpdate(
    {
      shortId,
    },
    {
      $push: {
        visitHistory: {
          timestamp: Date.now(),
        },
      },
    }
  );
  res.redirect(entry?.redirectURL);
});

app.listen(PORT, () => console.log(`Server Started at PORT:${PORT}`));
