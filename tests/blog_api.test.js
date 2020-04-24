const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const Blog = require('../models/blog')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

const api = supertest(app)

describe('handling blogs', () => {

  let savedUser, token

  beforeEach(async () => {
    console.log('Running beforeEach funcion, initializing the database')
    // Delete blogs and users
    await Blog.deleteMany({})
    await User.deleteMany({})
    console.log('Deleted blog entries and users')

    // Create a test user for the blog entries
    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({
      username: 'root',
      passwordHash,
    })

    // Save the user to the db
    savedUser = await user.save()
    console.log(`Created and saved user ${savedUser._id} to the db`)

    const userForToken = {
      username: 'root',
      id: savedUser._id,
    }

    token = jwt.sign(userForToken, process.env.SECRET)

    // Initialize a blogObjects array and fill it with blogs
    const blogObjects = helper.initialBlogs
      .map(blog => new Blog(blog))

    console.log('Blog objects before user', blogObjects[0])

    for (let entry of blogObjects) {
      entry.user = savedUser._id
    }

    console.log('Blog objects after adding user: ', blogObjects[0])

    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
  })

  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('id parameter is actually called id', async () => {
    const response = await api.get('/api/blogs')

    for (let blog of response.body) {
      expect(blog.id).toBeDefined()
    }
  })

  test('a valid blog can be added ', async () => {
    const newBlog = {
      title: 'A Test Blog',
      author: 'Robert C. Martin',
      url: 'http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html',
      likes: 0
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

    const titles = blogsAtEnd.map(b => b.title)
    expect(titles).toContain('A Test Blog')
  })

  test('likes value is initialized as 0, if not otherwise defined', async () => {
    const noLikesBlog = {
      title: 'No Likes',
      author: 'Grumpy cat',
      url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html'
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(noLikesBlog)

    const response = await api.get('/api/blogs')

    const noLikesBlogAfterAdding = response.body.find(blog => blog.title === 'No Likes')

    expect(noLikesBlogAfterAdding.likes).toBe(0)
  })

  test('a blog without title and url returns 400', async () => {
    const imperfectBlog = {
      author: 'Some dudette',
      like: 3
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(imperfectBlog)
      .expect(400)
  })

  test('a blog can be deleted', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    console.log('BLOGTODELETE from test: ', blogToDelete)

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `bearer ${token}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(
      helper.initialBlogs.length - 1
    )
    const titles = blogsAtEnd.map(blog => blog.title)

    expect(titles).not.toContain(blogToDelete.title)
  })

  test('a blog can be updated and returns 204', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]

    const newBlog = {
      title: 'Updated Title',
      author: blogToUpdate.author,
      url: blogToUpdate.url,
      likes: blogToUpdate.likes
    }

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(newBlog)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd[0].title).toBe('Updated Title')
  })
})

describe('when there is initially one user at db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({
      username: 'root',
      passwordHash
    })

    await user.save()

  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'tsaarika',
      name: 'Tommi',
      password: 'tosiSALAinen',
    }

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

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)


    expect(result.body.error).toContain('`username` to be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })
})

describe('user credentials', () => {
  test('username is required', async () => {
    const missingUsernameUser = {
      name: 'test user',
      password: 'testpw'
    }

    const result = await api
      .post('/api/users')
      .send(missingUsernameUser)
      .expect(400)

    expect(result.body.error).toContain('Username cannot be empty')
  })

  test('username has to be at least 3 characters', async () => {
    const shortUsernameUser = {
      username: 'as',
      name: 'test user 2',
      password: 'asdfasdf'
    }

    const result = await api
      .post('/api/users')
      .send(shortUsernameUser)
      .expect(400)

    expect(result.body.error).toContain('Username has to be at least 3 characters long')
  })

  test('password is required', async () => {
    const missingPasswordUser = {
      username: '3335jgjgjg',
      name: 'test user'
    }

    const result = await api
      .post('/api/users')
      .send(missingPasswordUser)
      .expect(400)

    expect(result.body.error).toContain('password missing')
  })

  test('password has to be at least 3 characters', async () => {
    const shortPasswordUser = {
      username: 'asffffjjj',
      name: 'test user 2',
      password: 'as'
    }

    const result = await api
      .post('/api/users')
      .send(shortPasswordUser)
      .expect(400)

    expect(result.body.error).toContain('password has to be at least 3 characters long')
  })
})

afterAll(() => {
  mongoose.connection.close()
})