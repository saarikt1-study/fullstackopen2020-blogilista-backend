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

module.exports = {
  dummy, totalLikes, favoriteBlog
}