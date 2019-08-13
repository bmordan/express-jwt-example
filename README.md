# Simple User Account Layer for Express

Homage to [dwyl learn-json-web-tokens](https://github.com/dwyl/learn-json-web-tokens) who's example repo really helped me.

This is a simple example node.js server that uses JWT in sessions to authenticate users. How does it work?

## What is in a JWT?

The json web token (JWT) is a compact url safe claim that can be transfered between two parties. JWT are digitally signed, that means you can't tamper with the contents. If you try to change the content of the JWT it's hashing algorithm will not resolve to the same signature and your token will not be validated.

It is comprised of three parts: 

**header**
```json
{
    "typ": "JWT",
    "alg": "HS256"
}
```
**payload**
```json
{
    "id": 1
}
```
**signature**
```js
const data = base64urlEncode( header ) + “.” + base64urlEncode( payload )
const hashedData = hash( data, secret )
const signature = base64urlEncode( hashedData )
```

The JWT is then composed of these three parts separated by periods. You can put anything into the payload part of a JWT. Notice that the signature is a hash of both the header and payload of the JWT. Change the payload and you'll not be able to achieve the same hashedData, so the signatures will not match.

```js
/*
    The actual JWT is composed like this header.payload.signature (see below)
*/
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzcsImlhdCI6MTU2NTY4MzY2NywiZXhwIjoxNTY1NjgzNzg3fQ.WkFCusFLngY0vley3vMHcoXLouuEObL4v8S9I8uuLi0
```

Now this URL safe JWT can be passed backwards and forwards between client and server, if someone/something alters the payload, we will know to not trust that claim.

## User Auth

This is how I have implemented user auth. For routes that required authentication I have a middleware function called `getUser` that intercepts the request.

```js
const getUser = (req, res, next) => {    
    const token = Token.verify(req.session.jwt)
    if (token) { req.user_id = token.user_id }
    return token ? next() : res.redirect("/")
}
```

If the request object cannot provide a valid JWT (token) then the request is redirected. This protects routes that required a authentication. If the token is valid, then by calling `next()` the request is allowed to continue onto it's route handler, only now on the `req` object you can find the user's id.

To authenticate you need to create a user account (that adds a user to the database), or login with a username and password. When a user sends a `POST` request to these routes we create a `new Token` and place it into the session.

## Creating a new Token

When I create a new Token I first create a record in the `tokens` table in my database that records the following:

```
|id|user_id|valid|created|
|:-|:-|:-|:-|
|1|23|0|1565685312042|
|2|23|1|1565685438855|
|3|25|1|1565685457727|
```

What gets put into the token and swaped back and forth between server and client is the id of that row in the `tokens` table. When a token is verified the following steps are taken.

1) Can I decode the token?
2) Has the token expired?
3) Use the payload **id** to retrive the record from the database

If you can't decode the token it is not valid.
If the token is expried (update the database entry to valid=0) it is not valid
If the token is valid, use the id to get the row from the database

With the row you have the `user_id` so now you know who to look up in the `users` table. The **user_id** is added to the `req` object `req.user_id = token.user_id` and passed to the route handler. Note that the `user_id` is not stored in the session or passed backward and forward between server and client.

## Destroy a Token

Tokens have a lifespan. When an expired token is presented, it is invalid and marked as invalid in the database.

When a user hits the `/users/logout` then we delete the token from the session `req.session.destroy()`.

## Routes

|method|route|status|
|:--|:--|:--|
|GET|"/"|public|
|GET|"/users/new"|public|
|POST|"/users"|public|
|POST|"/users/login"|public|
|GET|"/users"|private|
|GET|"/users/:id"|private|
|GET|"/users/logout"|private|

To add routes that are private you just include the middleware `getUser`. For example:

```js
app.get("/photos", getUser, (req, res) => {
    const user = User.find_by_id(req.user_id)
    const photos = Photos.all(user.id)
    res.render("photos", {user, photos})
})
```

## Usage

clone this repo and run `npm i` then you can start a dev server with `npm run dev` or just start it with `npm start`. You'll be presented with the unstyled home page. Create an account, then log in and log out. Try to reach the routes without logging in like `/users/:id`. You should see you are redirected. You can see your jwt in the browser by navigating to Application tab in the dev tools.

![](https://user-images.githubusercontent.com/4499581/62930031-8504f100-bdb3-11e9-8dd6-c066552aeeea.jpg)

## TODO

add some tests
