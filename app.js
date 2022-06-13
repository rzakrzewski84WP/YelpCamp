const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Campground = require('./models/campground');


//connecting to mongoDB working on localhost
mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp', { 
    //check these properties
    useNewUrlParser: true,
    useUnifiedTopology: true
})
//notification if we are connected to db
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});


//express app
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req,res) => {
    res.send('hello word')
})

app.listen(3000, ()=>{
    console.log('App is listening on 3000 port.')
})