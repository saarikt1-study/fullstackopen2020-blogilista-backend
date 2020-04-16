const dummy = () => {
  return 1
}

const totalLikes = (blogs) => {
  const sumOfLikes = blogs
    .reduce((acc, cur) => acc + cur.likes, 0)
  
  return sumOfLikes
}

module.exports = {
  dummy, totalLikes
}