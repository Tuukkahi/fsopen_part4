const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper.js')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const testUser = {
  username: 'dknuth',
  name: 'Donald Knuth',
  password: 'exactcover',
}

beforeEach(async () => {
  await User.deleteMany({})
  await Blog.deleteMany({})
  const res = await api
    .post('/api/users')
    .send(testUser)
  let blogObject = new Blog({
    title: helper.initialBlogs[0].title,
    author: helper.initialBlogs[0].author,
    url: helper.initialBlogs[0].url,
    likes: helper.initialBlogs[0].likes,
    user: res.body.id
  })
  await blogObject.save()
  blogObject = new Blog({
    title: helper.initialBlogs[1].title,
    author: helper.initialBlogs[1].author,
    url: helper.initialBlogs[1].url,
    likes: helper.initialBlogs[1].likes,
    user: res.body.id
  })
  await blogObject.save()
})

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

afterAll(() => {
  mongoose.connection.close()
})

test('all blogs are returned', async () => {
  const response = await helper.blogsInDb()

  expect(response).toHaveLength(helper.initialBlogs.length)
})

test('unique identifier property of the blog posts is named id', async () => {
  const response = await helper.blogsInDb()

  expect(response[0].id).toBeDefined()
})

test('a valid blog can be added ', async () => {
  const newBlog = { _id: "5a422b3a1b54a676234d17f9", title: "Canonical string reduction", author: "Edsger W. Dijkstra", url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html", likes: 12, __v: 0 }

  const res = await api
    .post('/api/login')
    .send({
      username: testUser.username,
      password: testUser.password
    })
  const token = res.body.token

  await api
    .post('/api/blogs')
    .send(newBlog)
    .set('authorization', `bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()

  const titles = blogsAtEnd.map(r => r.title)

  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
  expect(titles).toContain(
    newBlog.title
  )
})
 
test('if the likes property is missing from the request, it will default to the value 0', async () => {
  const newBlog = { _id: "5a422b891b54a676234d17fa", title: "First class tests", author: "Robert C. Martin", url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll", __v: 0 }

  const res = await api
    .post('/api/login')
    .send({
      username: testUser.username,
      password: testUser.password
    })
  const token = res.body.token

  await api
    .post('/api/blogs')
    .send(newBlog)
    .set('authorization', `bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()

  const added = blogsAtEnd.filter(blog => blog.title === newBlog.title)[0]

  expect(added.likes).toBe(0)
})


test('blog without title is not added', async () => {
  const newBlog = { _id: "5a422ba71b54a676234d17fb", author: "Robert C. Martin", url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html", likes: 0, __v: 0 }

  const res = await api
    .post('/api/login')
    .send({
      username: testUser.username,
      password: testUser.password
    })
  const token = res.body.token

  await api
    .post('/api/blogs')
    .send(newBlog)
    .set('authorization', `bearer ${token}`)
    .expect(400)

  const response = await helper.blogsInDb()

  expect(response).toHaveLength(helper.initialBlogs.length)
})

test('blog without url is not added', async () => {
  const newBlog = { _id: "5a422ba71b54a676234d17fb", title: "TDD harms architecture", author: "Robert C. Martin",  likes: 0, __v: 0 }

  const res = await api
    .post('/api/login')
    .send({
      username: testUser.username,
      password: testUser.password
    })
  const token = res.body.token

  await api
    .post('/api/blogs')
    .send(newBlog)
    .set('authorization', `bearer ${token}`)
    .expect(400)

  const response = await helper.blogsInDb()

  expect(response).toHaveLength(helper.initialBlogs.length)
})

test('blog is deleted', async () => {

  const res = await api
    .post('/api/login')
    .send({
      username: testUser.username,
      password: testUser.password
    })
  const token = res.body.token
  const user = res.body.user

  const newBlog = { _id: "5a422bc61b54a676234d17fc", title: "Type wars", author: "Robert C. Martin", url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html", likes: 2, __v: 0, user: user }
  await api
    .post('/api/blogs')
    .send(newBlog)
    .set('authorization', `bearer ${token}`)
    .expect(200)

  const response = await helper.blogsInDb()

  expect(response).toHaveLength(helper.initialBlogs.length + 1)

  const newBlogId = response.filter(blog => blog.title === newBlog.title)[0].id

  await api
    .delete(`/api/blogs/${newBlogId}`)
    .set('authorization', `bearer ${token}`)
    .expect(204)

  const afterDelete = await helper.blogsInDb()

  expect(afterDelete).toHaveLength(helper.initialBlogs.length)

})

test('the number of likes is updated', async () => {
  const newBlog = { _id: "5a422bc61b54a676234d17fc", title: "Type wars", author: "Robert C. Martin", url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html", likes: 2, __v: 0 }

  const res = await api
    .post('/api/login')
    .send({
      username: testUser.username,
      password: testUser.password
    })
  const token = res.body.token

  await api
    .post('/api/blogs')
    .send(newBlog)
    .set('authorization', `bearer ${token}`)
    .expect(200)

  const response = await helper.blogsInDb()

  expect(response).toHaveLength(helper.initialBlogs.length + 1)

  const newBlogId = response.filter(blog => blog.title === newBlog.title)[0].id

  const newLikes = 4

  await api
    .put(`/api/blogs/${newBlogId}`)
    .send({ title: newBlog.title, author: newBlog.author, likes: newLikes })
    .set('authorization', `bearer ${token}`)
    .expect(200)

  const afterUpdate = await helper.blogsInDb()
  const likes = afterUpdate.filter(blog => blog.title === newBlog.title)[0].likes

  expect(likes).toBe(newLikes)

})

