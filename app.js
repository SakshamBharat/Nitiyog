require("dotenv").config();

const express = require("express");
const session = require("express-session");
const SequelizeStore =
  require("connect-session-sequelize")(session.Store);
const helmet = require("helmet");
const path = require("path");

const {
  sequelize
} = require("./models");

const {
  loadUser
} = require("./middleware/auth");

const {
  ensureAdminSeeded
} = require("./seeders/admin");

const pageRoutes =
  require("./routes/pages");

const authRoutes =
  require("./routes/auth");

const adminRoutes =
  require("./routes/admin");


const app = express();


/*
|--------------------------------------------------------------------------
| Security
|--------------------------------------------------------------------------
*/

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);


/*
|--------------------------------------------------------------------------
| Body parsers
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: "100kb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "100kb"
  })
);


/*
|--------------------------------------------------------------------------
| Static files
|--------------------------------------------------------------------------
*/

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);


/*
|--------------------------------------------------------------------------
| EJS
|--------------------------------------------------------------------------
*/

app.set(
  "view engine",
  "ejs"
);

app.set(
  "views",
  path.join(__dirname, "views")
);


/*
|--------------------------------------------------------------------------
| Sessions
|--------------------------------------------------------------------------
*/

const sessionStore =
  new SequelizeStore({
    db: sequelize,

    tableName: "sessions",

    checkExpirationInterval:
      15 * 60 * 1000,

    expiration:
      24 * 60 * 60 * 1000
  });


app.use(
  session({
    secret: process.env.SESSION_SECRET,

    store: sessionStore,

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,

      secure:
        process.env.NODE_ENV === "production",

      sameSite: "lax",

      maxAge:
        24 * 60 * 60 * 1000
    }
  })
);


/*
|--------------------------------------------------------------------------
| Current user
|--------------------------------------------------------------------------
*/

app.use(loadUser);


/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

app.use("/", pageRoutes);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/admin",
  adminRoutes
);


/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).send(
    "Page not found"
  );
});


/*
|--------------------------------------------------------------------------
| Error handler
|--------------------------------------------------------------------------
*/

app.use(
  (error, req, res, next) => {
    console.error(error);

    res.status(500).json({
      error:
        "Internal server error."
    });
  }
);


/*
|--------------------------------------------------------------------------
| Database + server
|--------------------------------------------------------------------------
*/

async function start() {
  try {
    await sequelize.authenticate();

    console.log(
      "PostgreSQL connected."
    );

    /*
     * sync is suitable for initial development.
     *
     * For production, use Sequelize migrations
     * instead of alter:true.
     */
    await sequelize.sync({
      alter: true
    });

    await ensureAdminSeeded();

    await sessionStore.sync();

    const port =
      process.env.PORT || 3000;

    app.listen(
      port,
      () => {
        console.log(
          `NitiYog running at http://localhost:${port}`
        );
      }
    );

  } catch (error) {
    console.error(
      "Startup failed:",
      error
    );

    process.exit(1);
  }
}


start();
