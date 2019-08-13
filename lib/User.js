const db = require("../db")
const hash = require("./hashing")

class User {
    constructor({username, password}) {
        db.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT);").run()
        const {lastInsertRowid} = db.prepare("INSERT INTO users (username, password) VALUES (?, ?);").run(username, hash(username, password))
        const user = db.prepare("SELECT * FROM users WHERE id IS ?").get(lastInsertRowid)
        Object.assign(this, {...user})
    }
    static all() {
        return db.prepare("SELECT * FROM users;").all()
    }
    static find({username, password}) {
        return db.prepare("SELECT * FROM users WHERE username IS ? AND password IS ?").get(username, hash(username, password))
    }
    static find_by_id(id) {
        return db.prepare("SELECT * FROM users WHERE id IS ?").get(id)
    }
}

module.exports = User