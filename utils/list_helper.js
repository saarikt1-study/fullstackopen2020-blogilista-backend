const dummy = () => {
  return 1
}

const totalLikes = (blogs) => {
  const sumOfLikes = blogs
    .reduce((acc, cur) => acc + cur.likes, 0)

  return sumOfLikes
}

const favoriteBlog = (blogs) => {
  const bestBlog = blogs
    .reduce((best, current) => {
      if (!best.likes || current.likes > best.likes) {
        best = current
      }
      return best
    }, {})

  return {
    title: bestBlog.title,
    author: bestBlog.author,
    likes: bestBlog.likes
  }
}

const mostBlogs = (blogs) => {
  const countedAuthors = blogs
    .reduce((allAuthors, currentBlog) => {
      if (currentBlog.author in allAuthors) {
        allAuthors[currentBlog.author]++
      } else {
        allAuthors[currentBlog.author] = 1
      }
      return allAuthors
    }, {})
  
  console.log('countedBlogs', countedAuthors)
  const maxCount = Math.max(...Object.values(countedAuthors))

  const authorArray = Object.entries(countedAuthors)

  const mostProductiveAuthor = authorArray.filter(author => author[1] === maxCount)

  console.log('last: ', mostProductiveAuthor)
  
  return (
    {
      author: mostProductiveAuthor[0][0],
      blogs: mostProductiveAuthor[0][1]
    }
  )
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs
}