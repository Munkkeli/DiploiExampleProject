module.exports = ({ env }) => ({
  host: env("STRAPI_HOST", "0.0.0.0"),
  port: env.int("STRAPI_PORT", 1337),
  url: `https://${env("APP_PUBLIC_URL", "localhost")}/`
});
