const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
require('express-async-errors')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogsRouter.delete('/:id', async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  const user = await User.findById(decodedToken.id)
  const blogToDelete = await Blog.findById(request.params.id)
  
  const blogCreatorId = blogToDelete.user && blogToDelete.user.toString()

  if (user.id.toString() === blogCreatorId) {
    await Blog.findByIdAndRemove(request.params.id)
    response
      .status(204)
      .end()
  } else {
    response
      .status(403)
      .end()
  }
})

blogsRouter.put('/:id', async (request, response) => {
  const body = request.body

  const newBlog = {
    user: body.user.id,
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    id: body.id
  }

  await Blog.findByIdAndUpdate(request.params.id, newBlog)
  response
    .json(newBlog)
    .status(204)
    .end()
})

blogsRouter.post('/', async (request, response) => {
  const body = request.body

  const decodedToken = jwt.verify(request.token, process.env.SECRET)
  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  const user = await User.findById(decodedToken.id)

  if (!user) {
    response.status(401).end()
  }

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    user: user._id
  })

  if (!blog.likes) {
    blog.likes = 0
  }

  if (!blog.title && !blog.url) {
    response.status(400).end()
  } else {
    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    response
      .status(201)
      .json(savedBlog.toJSON())    
  }
})

module.exports = blogsRouter