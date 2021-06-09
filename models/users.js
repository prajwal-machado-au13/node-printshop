const cuid = require('cuid')
const bcrypt = require('bcrypt')
const { promisify } = require('util')
const { isEmail, isAlphanumeric } = require('validator')

const SALT_ROUNDS = 10

const db = require('../db')

const User = db.model('User', {
  _id: { type: String, default: cuid },
  username: usernameSchema(),
  password: { type: String, required: true },
  email: emailSchema({ required: true })
})

module.exports = {
  get,
  list,
  create,
  edit,
  remove,
  model: User
}

async function list (opts = {}) {
  const { offset = 0, limit = 25, productId, status } = opts

  const query = {}
  if (productId) query.products = productId
  if (status) query.status = status

  const users = await User.find(query)
    .sort({ _id: 1 })
    .skip(offset)
    .limit(limit)

  return users
}

async function get (username) {
  const user = await User.findOne({ username })
  return user
}

async function create (fields) {
  const user = new User(fields)
  await hashPassword(user)
  await user.save()
  return user
}

async function edit (username, change) {
  const user = await get(username)
  Object.keys(change).forEach(function (key) {
    user[key] = change[key]
  })
  if (change.password) await hashPassword(user)
  await user.save()
  return user
}

async function remove (username) {
  await User.deleteOne({ username })
}

async function isUnique (doc, username) {
  const existing = await get(username)
  return !existing || doc._id === existing._id
}

function usernameSchema () {
  return {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    minLength: 3,
    maxLength: 16,
    validate: [
      {
        validator: isAlphanumeric,
        message: props => `${props.value} contains special characters`
      },
      {
        validator: str => !str.match(/^admin$/i),
        message: props => 'Invalid username'
      },
      {
        validator: function (username) { return isUnique(this, username) },
        message: props => 'Username is taken'
      }
    ]
  }
}

function emailSchema (opts = {}) {
  const { required } = opts
  return {
    type: String,
    required: !!required,
    validate: {
      validator: isEmail,
      message: props => `${props.value} is not a valid email address`
    }
  }
}

async function hashPassword (user) {
  if (!user.password) throw user.invalidate('password', 'password is required')
  if (user.password.length < 12) throw user.invalidate('password', 'password must be at least 12 characters')

  user.password = await promisify(bcrypt.hash)(user.password, SALT_ROUNDS)
}
