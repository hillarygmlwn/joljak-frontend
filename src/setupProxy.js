// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/focus',      // '/focus' 로 시작하는 모든 요청만 백엔드로 보냅니다
    createProxyMiddleware({
      target: 'https://learningas.shop',
      changeOrigin: true,
    })
  );
  // 필요하면 '/users' 나 '/auth' 등 다른 엔드포인트도 추가
};
