const express = require('express')
const app = express()
const session = require('express-session')
const User = require("./lib/User")
const Token = require("./lib/Token")

const getUser = (req, res, next) => {    
    const token = Token.verify(req.session.jwt)
    if (token) { req.user_id = token.user_id }
    return token ? next() : res.redirect("/")
}

app.set('view engine', 'ejs')

app.use(session({secret: "MY_SECRET", resave: false, saveUninitialized: true}))

app.use(express.urlencoded({ extended: true }))

app.get("/users", getUser, (req, res) => {
    const user = User.find_by_id(req.user_id)
    res.render("private", { user })
})

app.get("/users/logout", getUser, (req, res) => {
    req.session.destroy()
    req.user_id = null
    res.render("home")
})

app.get("/users/new", (req, res) => {
    res.render("create")
})

app.get("/users/:id", getUser, (req, res) => {
    if (Number(req.params.id) !== req.user_id) return res.redirect("/users/logout")
    const user = User.find_by_id(req.user_id)
    res.render("user", { user })
})

app.get("/", (req, res) => {
    res.render("home")
})

app.post("/users/login", (req, res) => {
    const token = new Token(req)
    req.session.jwt = token.jwt
    const user = User.find_by_id(token.user_id)
    res.render("private", { user })
})

app.post("/users", (req, res) => {
    new User(req.body)
    const token = new Token(req)
    req.session.jwt = token.jwt
    res.redirect("/users")
})

app.listen(9292)
