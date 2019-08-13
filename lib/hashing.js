const {pbkdf2Sync} = require("crypto")
module.exports = (salt, password) => {
    const key = pbkdf2Sync(password, salt, 1000, 16, "sha512")
    return key.toString('hex')
}