require('dotenv').config()

let MONGODB_URI='mongodb+srv://fullstack:fullstackopen@cluster0.9w1c4.mongodb.net/bloglist-app?retryWrites=true&w=majority'
let TEST_MONGODB_URI='mongodb+srv://fullstack:fullstackopen@cluster0.9w1c4.mongodb.net/bloglist-app-test?retryWrites=true&w=majority'
let PORT=3003

if (process.env.NODE_ENV === 'test') {
  MONGODB_URI = process.env.TEST_MONGODB_URI
}

module.exports = {
  MONGODB_URI,
  PORT
}
