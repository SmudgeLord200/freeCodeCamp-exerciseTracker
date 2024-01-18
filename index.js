const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");

//mongodb connection
const mySecret = process.env["MONGO_URI"];
const mongoose = require("mongoose");
mongoose.connect(mySecret, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// two mongodb schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});
const userModel = mongoose.model("user", userSchema);

const exerciseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: new Date() },
});
const exerciseModel = mongoose.model("exerciseModel", exerciseSchema);

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//api for get user
app.get("/api/users", (req, res) => {
  userModel
    .find({})
    .then((users) => res.json(users))
    .catch((err) => res.json(err));
});

//api for get logs
app.get("/api/users/:_id/logs", (req, res) => {
  let user_id = req.params._id;
  let from = req.query.from;
  let to = req.query.to;
  let limit = req.query.limit;
  let queryObj = { userId: user_id };

  userModel.findById(user_id).then((user) => {
    if (from || to) {
      queryObj.date = {};
      if (from) queryObj.date["$gte"] = new Date(from);
      if (to) queryObj.date["$lte"] = new Date(to);
    }

    //retrieve the relevant exercise entries
    exerciseModel
      .find(queryObj)
      .limit(limit)
      .then((exercises) => {
        let resObj = {
          _id: user.userId,
          username: user.username,
        };
        exercises = exercises.map((e) => {
          return {
            description: e.description,
            duration: e.duration,
            date: e.date.toDateString(),
          };
        });
        resObj.log = exercises;
        resObj.count = exercises.length;

        res.json(resObj);
      });
  });
});

//api for post user
app.post("/api/users", (req, res) => {
  let username = req.body.username;
  let newUser = new userModel({ username: username });
  newUser.save();
  res.json(newUser);
});

//api for post exercise
app.post("/api/users/:_id/exercises", (req, res) => {
  let user_id = req.params._id;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;
  let exerciseObj = {
    userId: user_id,
    description: description,
    duration: duration,
    date: !date ? new Date() : new Date(date),
  };
  let newExercise = new exerciseModel(exerciseObj);
  //find by user id
  userModel.findById(user_id).then((user) => {
    if (user) {
      newExercise.save();
      res.json({
        _id: user._id,
        username: user.username,
        description: newExercise.description,
        duration: newExercise.duration,
        date: newExercise.date.toDateString(),
      });
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
