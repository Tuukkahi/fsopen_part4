const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.map(blog => blog.likes).reduce((a,b) => a+b, 0)
}

const favoriteBlog = (blogs) => (
  blogs
    .map(a => ({ "title": a.title, "author": a.author, "likes": a.likes }))
    .reduce((a,b) => a.likes > b.likes ? a : b)
)

const mostBlogs = (blogs) => (
  [... new Set(blogs.map(blog => blog.author))]
    .map(author => ({ author, "blogs": blogs.filter(blog => blog.author === author).length }))
    .reduce((a,b) => a.blogs > b.blogs ? a : b)
)

const mostLikes = (blogs) => (
  [... new Set(blogs.map(blog => blog.author))]
    .map(author => (
      {
        author,
        "likes": blogs.filter(blog => blog.author === author).reduce((a,b) => a+b.likes, 0)
      }))
    .reduce((a,b) => a.likes > b.likes ? a : b)
)

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}
