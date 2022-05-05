import express from "express";
import bodyParser from "body-parser";
import boolParser from "express-query-boolean";
import router from "./router";

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(boolParser());

router(app);

app.use(
  (
    err: express.ErrorRequestHandler,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).send("error").send();
  }
);

app.use((_req, res, _next) => {
  console.warn("routing not found");
  res.status(404).send("NotFound").send();
});

app.set("port", process.env.PORT || 5000);
const server = app.listen(app.get("port"), () => {
  console.info(`Example app listening at ${JSON.stringify(server.address())}`);
});
