const path = require("path");

module.exports = ({ env }) => ({
  connection: {
    client: "postgres",
    connection: {
      host: env("POSTGRES_HOST", "postgres"),
      port: env("POSTGRES_PORT", 5432),
      user: env("POSTGRES_USER", "postgres"),
      password: env("POSTGRES_PASSWORD", "postgres"),
      database: env("POSTGRES_DB", "strapi"),
    },
    useNullAsDefault: true,
  },
});
