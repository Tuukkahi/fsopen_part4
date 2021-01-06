const supertest = require('supertest')
const helper = require('./test_helper.js')
const app = require('../app')
const api = supertest(app)
const User = require('../models/user')
const bcrypt = require('bcrypt')

const newUser = {
  username: 'dknuth',
  name: 'Donald Knuth',
  password: 'exactcover',
}

describe('when there is initially one user at db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async() => {
    const usersAtStart = await helper.usersInDb()


    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('login works with a created user', async() => {
    const usersAtStart = await helper.usersInDb()

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()

    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const response = await api
      .post('/api/login')
      .send({
        username: newUser.username,
        password: newUser.password
      })
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(response.body.username).toBe(newUser.username)
  })

  test('creation fails with too short username', async() => {
    await api
      .post('/api/users')
      .send( {
        username: 'dk',
        password: newUser.password
      })
      .expect(400)
  })

  test('creation fails with too short password', async() => {
    await api
      .post('/api/users')
      .send( {
        username: newUser.username,
        password: 'ex'
      })
      .expect(400)
  })
})
