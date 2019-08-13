const jwt = require("jsonwebtoken")
const User = require("./User")
const secret = "MY_SECRET"
const db = require("../db")

class Token {
    constructor(req) {
        db.prepare("CREATE TABLE IF NOT EXISTS tokens (id INTEGER PRIMARY KEY, user_id INTEGER, valid INTEGER, created INTEGER);").run()
        
        const user = User.find(req.body)
        if (!user) throw new Error("User not found")
        
        const {lastInsertRowid} = db.prepare("INSERT INTO tokens (user_id, valid, created) VALUES (?, ?, ?);").run(user.id, 1, new Date().getTime())
        this.id = lastInsertRowid
        this.user_id = user.id
        this.valid = 1
        this.created = new Date().getTime()
        this.jwt = jwt.sign({id: this.id}, secret, {expiresIn: 120})
    }

    static verify (token) {
      let decoded
      try {
        decoded = jwt.verify(token, secret)
      } catch (e) {
        console.error(e.name, e.message)
        return false
      }
      
      const { id, exp } = decoded
      const now = Math.floor(new Date().getTime() / 1000)
      
      if (exp < now) {
        db.prepare("UPDATE tokens SET valid = 0 WHERE id IS ?;").run(id)
        return false
      } else {
        return db.prepare("SELECT * FROM tokens WHERE id IS ?;").get(id)
      }
    }
}

module.exports = Token