function getRequestHost(req) {
  const protocol =
    req.headers['x-forwarded-proto'] ||
    req.protocol;

  const host =
    req.headers['x-forwarded-host'] ||
    req.headers['host'];

  return `${protocol}://${host}`;
}

module.exports = { getRequestHost };
