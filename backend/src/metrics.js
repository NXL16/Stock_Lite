const client = require('prom-client');
const register = new client.Registry();
client.collectDefaultMetrics({ register });
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds', help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'], buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5], registers: [register]
});
function observeRequest(req, res, startedAt) {
  const route = req.route?.path ? `${req.baseUrl || ''}${req.route.path}` : req.path;
  httpRequestDuration.labels(req.method, route, String(res.statusCode)).observe((Date.now() - startedAt) / 1000);
}
module.exports = { register, observeRequest };

