const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper.js')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const User = require('../models/user')
const bcrypt = require('bcrypt')

const testUser = {
  username: 'dknuth',
  name: 'Donald Knuth',
  password: 'exactcover',
}

beforeEach(async () => {
  await User.deleteMany({})
  await Blog.deleteMany({})
  const passwordHash = await bcrypt.hash('sekret', 10)
  const user = new User({ username: 'root', passwordHash })
  await user.save()
  console.log(user)
  let blogObject = new Blog(helper.initialBlogs[0])
  await blogObject.save()
  blogObject = new Blog(helper.initialBlogs[1])
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

  await api
    .post('/api/blogs')
    .send(newBlog)
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

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()

  const added = blogsAtEnd.filter(blog => blog.id === newBlog._id)[0]

  expect(added.likes).toBe(0)
})


test('blog without title is not added', async () => {
  const newBlog = { _id: "5a422ba71b54a676234d17fb", author: "Robert C. Martin", url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html", likes: 0, __v: 0 }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)

  const response = await helper.blogsInDb()

  expect(response).toHaveLength(helper.initialBlogs.length)
})

test('blog without url is not added', async () => {
  const newBlog = { _id: "5a422ba71b54a676234d17fb", title: "TDD harms architecture", author: "Robert C. Martin",  likes: 0, __v: 0 }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)

  const response = await helper.blogsInDb()

  expect(response).toHaveLength(helper.initialBlogs.length)
})

test('blog is deleted', async () => {
  const newBlog = { _id: "5a422bc61b54a676234d17fc", title: "Type wars", author: "Robert C. Martin", url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html", likes: 2, __v: 0 }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(200)

  const response = await helper.blogsInDb()

  expect(response).toHaveLength(helper.initialBlogs.length + 1)

  await api
    .delete(`/api/blogs/${newBlog._id}`)
    .expect(204)

  const afterDelete = await helper.blogsInDb()

  expect(afterDelete).toHaveLength(helper.initialBlogs.length)
  
})

test('the number of likes is updated', async () => {
  const newBlog = { _id: "5a422bc61b54a676234d17fc", title: "Type wars", author: "Robert C. Martin", url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html", likes: 2, __v: 0 }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(200)

  const response = await helper.blogsInDb()

  expect(response).toHaveLength(helper.initialBlogs.length + 1)

  const newLikes = 4

  await api
    .put(`/api/blogs/${newBlog._id}`)
    .send({ title: newBlog.title, author: newBlog.author, likes: newLikes })
    .expect(200)

  const afterUpdate = await helper.blogsInDb()
  const likes = afterUpdate.filter(blog => blog.id === newBlog._id)[0].likes

  expect(likes).toBe(newLikes)

})
