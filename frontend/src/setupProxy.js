/**
 * CRA dev server 代理：把 /api/* 转发到后端 8080
 * 仅在 `npm start` 时生效，生产构建走 nginx
 */
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      logLevel: 'warn',
    }),
  );
};
