const Users = require('./models/users')
const Orders = require('./models/orders')
const Products = require('./models/products')
const autoCatch = require('./lib/auto-catch')

module.exports = autoCatch({
  getProduct,
  listProducts,
  createProduct,
  editProduct,
  deleteProduct,
  createOrder,
  listOrders,
  createUser
})

async function getProduct (req, res, next) {
  const { id } = req.params

  const product = await Products.get(id)
  if (!product) return next()

  res.json(product)
}

async function listProducts (req, res, next) {
  const { offset = 0, limit = 10, tag } = req.query

  const products = await Products.list({
    offset: Number(offset),
    limit: Number(limit),
    tag
  })

  res.json(products)
}

async function createProduct (req, res, next) {
  if (!req.isAdmin) return forbidden(next)

  const product = await Products.create(req.body)
  res.json(product)
}

async function editProduct (req, res, next) {
  if (!req.isAdmin) return forbidden(next)

  const change = req.body
  const product = await Products.edit(req.params.id, change)

  res.json(product)
}

async function deleteProduct (req, res, next) {
  if (!req.isAdmin) return forbidden(next)

  await Products.remove(req.params.id)
  res.json({ success: true })
}

async function createOrder (req, res, next) {
  const fields = req.body
  if (!req.isAdmin) fields.username = req.user.username

  const order = await Orders.create(fields)
  res.json(order)
}

async function listOrders (req, res, next) {
  const { offset = 0, limit = 25, productId, status } = req.query

  const opts = {
    offset: Number(offset),
    limit: Number(limit),
    productId,
    status
  }

  if (!req.isAdmin) opts.username = req.user.username

  const orders = await Orders.list(opts)

  res.json(orders)
}

async function createUser (req, res, next) {
  const user = await Users.create(req.body)
  const { username, email } = user
  res.json({ username, email })
}

function forbidden (next) {
  const err = new Error('Forbidden')
  err.statusCode = 403
  return next(err)
}
