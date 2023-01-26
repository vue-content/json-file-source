import { readFileSync, writeFileSync } from "fs";
import { ViteDevServer, Plugin } from "vite";
import dottie from 'dottie'
import bodyParser from 'body-parser'

interface Options {

  /** Path to the folder your json files are stored, relative to your project root. */
  path: string;

  /** Indentation length in the json files. Defaults to 2.  */
  indentation?: number;
}

interface ParsedRequest extends Omit<Request, 'body'> {
  body: string
}

interface RouteArguments {
  options: Options;
  locale: string;
  req: ParsedRequest;
  res: Response;
  params: string[];
}

type RouteFunction = (args: RouteArguments) => string | void;

interface RouteFunctions {
  get?: RouteFunction;
  post?: RouteFunction;
  delete?: RouteFunction;
  patch?: RouteFunction;
}

export const jsonFileDevServer = (options: Options): Plugin => ({
  name: "configure-server",
  configureServer(server: ViteDevServer) {
    server.middlewares.use(bodyParser.json())
    server.middlewares.use("/vue-content", (req, res, next) => {
      // The complete route looks like /vue-content/:locale/:route/:param1/:param2/:param3
      if (!req.url || !req.method) {
        return next()
      }
      const [_, locale, route, ...params] = req.url.split("/");
      const method = req.method.toLowerCase();
      if (typeof routes[route]?.[method] === "function") {
        const result = routes[route]?.[method]({
          locale,
          options,
          params,
          res,
          req,
        });
        if (typeof result === "string") {
          res.end(result);
        }
        else if (typeof result === "object") {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result));
        }
        else {
          res.end()
        }
      } else {
        next();
      }
    });
  },
});

const routes: Record<string, RouteFunctions> = {

  blocks: {
    get: ({ options, locale, params, req, res }) => {
      const file = readFileSync(`./${options.path}/${locale}.json`);
      const [id] = params
      if (id) {
        const parsedContent = JSON.parse(file.toString())
        return dottie.get(parsedContent, id);
      }
      return file.toString();
    },

    patch: ({ options, locale, params, req, res }) => {
      const file = readFileSync(`./${options.path}/${locale}.json`);
      const parsedContent = JSON.parse(file.toString())
      const [id] = params
      if (id) {
        Object.entries(req.body).forEach(([key, field]) => {
          dottie.set(parsedContent, `${id}.${key}`, field);
        })
      }
      else {
        Object.assign(parsedContent, req.body)
      }
      writeFileSync(`./${options.path}/${locale}.json`, JSON.stringify(parsedContent, null, options.indentation ?? 2))
    },

  },
};
