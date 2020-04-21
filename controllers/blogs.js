const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
  response.json(blogs)
})

blogsRouter.delete('/:id', async (request, response) => {
  await Blog.findByIdAndRemove(request.params.id)
  response
    .status(204)
    .end()
})

blogsRouter.put('/:id', async (request, response) => {
  const body = request.body
  console.log('body: ', body)

  const newBlog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes
  }

  await Blog.findByIdAndUpdate(request.params.id, newBlog)
  response
    .status(204)
    .end()
})

blogsRouter.post('/', async (request, response) => {
  const blog = new Blog(request.body)

  if (!blog.likes) {
    blog.likes = 0
  }

  if (!blog.title && !blog.url) {
    response.status(400).end()
  } else {
    const savedBlog = await blog.save()
    response
      .status(201)
      .json(savedBlog.toJSON())    
  }
})

module.exports = blogsRouter