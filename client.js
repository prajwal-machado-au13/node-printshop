const Request = require('request')
const querystring = require('querystring')

module.exports = function ({ endpoint, username, password }) {
  endpoint = endpoint || 'http://localhost:1337'
  const jar = Request.jar()
  const request = Request.defaults({ jar })

  let isLoggedIn = false

  return {
    login,
    getProduct,
    listProducts,
    createProduct,
    editProduct,
    deleteProduct,
    createOrder,
    createUser,
    listOrders
  }

  function login (cb) {
    const url = `${endpoint}/login`
    postJSON(url, { username, password }, function (err, data) {
      if (!err && (data || {}).success) isLoggedIn = true
      cb(err, data)
    })
  }

  function getProduct (id, cb) {
    const url = `${endpoint}/products/${id}`
    getJSON(url, cb)
  }

  function listProducts (opts, cb) {
    if (typeof opts === 'function') {
      cb = opts
      opts = {}
    }

    const { offset = 0, limit = 25, tag } = opts
    const url = `${endpoint}/products?${querystring.stringify({
      offset,
      limit,
      tag
    })}`
    getJSON(url, cb)
  }

  function createProduct (product, cb) {
    const url = `${endpoint}/products`
    withLogin(postJSON)(url, product, cb)
  }

  function editProduct (id, changes, cb) {
    const url = `${endpoint}/products/${id}`
    withLogin(putJSON)(url, changes, cb)
  }

  function deleteProduct (id, cb) {
    const url = `${endpoint}/products/${id}`
    withLogin(delJSON)(url, cb)
  }

  function createOrder ({ products, username }, cb) {
    const url = `${endpoint}/orders`
    withLogin(postJSON)(url, { products, username }, cb)
  }

  function createUser ({ username, password, email }, cb) {
    const url = `${endpoint}/users`
    postJSON(url, { username, password, email }, cb)
  }

  function listOrders (opts, cb) {
    if (typeof opts === 'function') {
      cb = opts
      opts = {}
    }

    const { offset = 0, limit = 25, status, productId } = opts
    const url = `${endpoint}/orders?${querystring.stringify({
      offset,
      limit,
      status,
      productId
    })}`
    withLogin(getJSON)(url, cb)
  }

  function withLogin (fn) {
    if (isLoggedIn) return fn
    if (!username || !password) return fn

    return function () {
      const args = arguments
      const cb = Array.from(args).slice(-1)[0]

      login(err => err ? cb(err) : fn.apply(fn, args))
    }
  }

  function getJSON (url, cb) {
    request.get(url, { json: true }, handleResponse(cb))
  }

  function postJSON (url, data, cb) {
    request.post(url, { json: true, body: data }, handleResponse(cb))
  }

  function putJSON (url, data, cb) {
    request.put(url, { json: true, body: data }, handleResponse(cb))
  }

  function delJSON (url, cb) {
    request.delete(url, { json: true }, handleResponse(cb))
  }
}

function handleResponse (cb) {
  return function (err, res, body) {
    if (err) return cb(err)
    if (res.statusCode !== 200) {
      const defaultMsg = `Request Failed.\n Status Code: ${res.statusCode}`
      const serverMsg = (body || {}).error
      err = new Error(serverMsg || defaultMsg)
      err.statusCode = res.statusCode
      return cb(err)
    }
    cb(null, body)
  }
}
