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
  // Create object with authors and their blog counts respectively
  const countedAuthors = blogs
    .reduce((allAuthors, currentBlog) => {
      if (currentBlog.author in allAuthors) {
        allAuthors[currentBlog.author]++
      } else {
        allAuthors[currentBlog.author] = 1
      }
      return allAuthors
    }, {})

  let mostProductiveAuthor = {}
    
  for (let [key, value] of Object.entries(countedAuthors)) {
    if (!mostProductiveAuthor.value || mostProductiveAuthor.value < value) {
      mostProductiveAuthor = {
        author: key,
        blogs: value
      }
    }
  }

  return mostProductiveAuthor
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs
}