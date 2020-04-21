const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const Blog = require('../models/blog')

const api = supertest(app)

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
})

test('notes are returned as json', async () => {
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
    .send(imperfectBlog)
    .expect(400)
})

test('a blog can be deleted', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToDelete = blogsAtStart[0]

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .expect(204)

  const blogsAtEnd = await helper.blogsInDb()
  
  expect(blogsAtEnd).toHaveLength(
    helper.initialBlogs.length - 1
  )
  const titles = blogsAtEnd.map(blog => blog.title)

  expect(titles).not.toContain(blogToDelete.title)
})

afterAll(() => {
  mongoose.connection.close()
})