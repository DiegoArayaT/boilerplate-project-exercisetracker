const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

let users = [];
let exercises = [];

app.post("/api/users", (req, res) => {
  const { username } = req.body;
  if(!username) {
    return res.status(400).json({error : "Username is required"})
  }

  const newUser = {
    username,
    _id: (users.length + 1).toString(),
  }

  users.push(newUser);
  res.json(newUser);
})

app.get("/api/users", (req, res) => {
  res.json(users.map(user => ({
    username: user.username,
    _id: user._id
  })));
})

app.get("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  const foundUser = users.find((user) => user._id === userId)

  if(!foundUser) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(foundUser);
})

app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;
  
  if (!description || !duration) {
    return res.status(400).json({ error: "Description and duration are required" });
  }
  
  const foundUser = users.find(user => user._id === userId);
  if (!foundUser) {
    return res.status(404).json({ error: "User not found" });
  }
  
  const exerciseDate = date ? new Date(date) : new Date();
  if (isNaN(exerciseDate.getTime())) {
    return res.status(400).json({ error: "Invalid date format" });
  }
  
  const exercise = {
    userId,
    description,
    duration: parseInt(duration),
    date: exerciseDate.toDateString()
  };
  
  exercises.push(exercise);
  
  const response = {
    _id: foundUser._id,
    username: foundUser.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date
  };
  
  res.json(response);
});

app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;
  
  const foundUser = users.find(user => user._id === userId);
  if (!foundUser) {
    return res.status(404).json({ error: "User not found" });
  }
  
  let userExercises = exercises.filter(ex => ex.userId === userId);
  
  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate.getTime())) {
      userExercises = userExercises.filter(ex => new Date(ex.date) >= fromDate);
    }
  }
  
  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate.getTime())) {
      userExercises = userExercises.filter(ex => new Date(ex.date) <= toDate);
    }
  }
  
  if (limit) {
    userExercises = userExercises.slice(0, parseInt(limit));
  }
  
  const log = userExercises.map(ex => ({
    description: ex.description,
    duration: ex.duration,
    date: ex.date
  }));
  
  const response = {
    _id: foundUser._id,
    username: foundUser.username,
    count: log.length,
    log: log
  };
  
  res.json(response);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});