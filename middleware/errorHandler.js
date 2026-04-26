/**
 * 错误处理中间件
 */

// 404 处理
const notFound = (req, res, next) => {
  const error = new Error(`接口不存在: ${req.originalUrl}`)
  error.status = 404
  next(error)
}

// 统一错误处理
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500
  const message = err.message || '服务器内部错误'

  console.error(`[ERROR] ${status} - ${message}`)

  res.status(status).json({
    code: status,
    message,
    data: null
  })
}

module.exports = { notFound, errorHandler }
