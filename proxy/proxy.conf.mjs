import fs from 'node:fs';
import {PROXY_TARGET} from "./proxy.const.mjs";
import {customizationConfigOverride} from "./customization_config_override.mjs";
import {buildMergedManifestResponse, createLocalCustomModuleAssetManifest, deepMerge, isCustomModuleAssetManifestRequest, resolveCustomModuleManifestPath} from "./proxy-utils.mjs";

async function serveCustomModuleManifest(req, res) {
  const manifestPath = resolveCustomModuleManifestPath(req.url);
  if (!manifestPath) {
    return false;
  }

  try {
    const response = await buildMergedManifestResponse(req.url, manifestPath, PROXY_TARGET);
    res.writeHead(response.statusCode, response.headers);
    res.end(response.body);
    return true;
  } catch (error) {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: `Unable to read Custom Module asset manifest from ${manifestPath}: ${error.message}` }));
    return true;
  }
}






const proxyRules = [
  {
    // Since the June 2026 release the NDE shell no longer bounces the browser
    // to the real Primo host before starting the SAML flow. suprimaExtLogin
    // creates the login session (JSESSIONID) in its response, so when it is
    // served through localhost the session cookie is scoped to localhost and
    // the SAML ACS (/mng/pdsHandleLogin) on the real host cannot correlate the
    // login -> /mng/errorLogin. Redirecting the browser to the real host here
    // restores the pre-June behavior (and matches what Primo VE still does).
    context: ["/primaws/suprimaExtLogin"],
    target: PROXY_TARGET,
    changeOrigin: true,
    followRedirects: true,
    onProxyReq(_proxyReq, req, res) {
      res.writeHead(302, { location: PROXY_TARGET + req.url });
    },
  },
  {
    context: [
      '/nde/custom/41SLSP_NETWORK-CENTRAL_PACKAGE/**'
    ],
    target: PROXY_TARGET,
    secure: true,
    changeOrigin: true,
    logLevel: 'debug',
  },
    {
    context: [
      '/nde/custom/*/CENTRAL_CODE.txt',
      '!/nde/custom/41SLSP_NETWORK-CENTRAL_PACKAGE/**'
    ],
    target: PROXY_TARGET,
    secure: true,
    changeOrigin: true,
    logLevel: 'debug',
  },
 {
    context: ['/nde/home', '/home'],
    target: PROXY_TARGET,
    secure: true,
    changeOrigin: true,
    logLevel: 'debug',
    selfHandleResponse: true,
    onProxyRes(proxyRes, req, res) {
      const chunks = [];
      proxyRes.on('data', chunk => chunks.push(chunk));
      proxyRes.on('end', () => {
        const body = Buffer.concat(chunks);
        res.statusCode = proxyRes.statusCode || 200;
        res.setHeader('content-type', proxyRes.headers['content-type'] || 'text/html; charset=utf-8');
        res.end(body);
      });
    }
  },
{
    context: [
      '/custom/*/assets/landingpage',
      '/custom/*/assets/landingpage/**',
      '/nde/custom/*/assets/landingpage',
      '/nde/custom/*/assets/landingpage/**'
    ],
    target: PROXY_TARGET,
    secure: true,
    changeOrigin: true,
    logLevel: 'debug',
  },  
  {
    context: [
      '/custom/*/assets',
      '/custom/*/assets/**',
      '/nde/custom/*/assets',
      '/nde/custom/*/assets/**',
      '!/nde/custom/41SLSP_NETWORK-CENTRAL_PACKAGE/**'
    ],
    target: 'not-needed',
    router: (req) => `${req.protocol}://${req.get('host')}`,
    changeOrigin: false,
    logLevel: 'debug',
    pathRewrite: (path) =>
      path.replace(/^\/(?:nde\/)?custom\/[^/]+\/assets\/?/, '/assets/'),
  },
  {
    context: ['/custom/*/asset-manifest.json', '/nde/custom/*/asset-manifest.json'],
    target: PROXY_TARGET,
    secure: true,
    changeOrigin: true,
    logLevel: 'debug',
    selfHandleResponse: true,
    onProxyRes(proxyRes, req, res) {
      serveCustomModuleManifest(req, res).then((handled) => {
        if (handled) {
          return;
        }

        const chunks = [];
        proxyRes.on('data', chunk => chunks.push(chunk));
        proxyRes.on('end', () => {
          const body = Buffer.concat(chunks);
          res.statusCode = proxyRes.statusCode || 200;
          res.setHeader('content-type', proxyRes.headers['content-type'] || 'application/json');
          res.end(body);
        });
      });
    }
  },

  {
    context: ['/primaws/rest/pub/configuration/vid/'],
    target: PROXY_TARGET,
    secure: true,
    changeOrigin: true,
    logLevel: 'debug',
    selfHandleResponse: true,
    onProxyRes(proxyRes, req, res) {
      const chunks = [];
      proxyRes.on('data', chunk => chunks.push(chunk));
      proxyRes.on('end', () => {
        try {
          const bodyStr = Buffer.concat(chunks).toString('utf8');
          const json = JSON.parse(bodyStr);
          // MERGE instead of replace to retain unspecified fields
          json.customization = deepMerge(json.customization || {}, customizationConfigOverride);
          const out = JSON.stringify(json);
          res.setHeader('content-type', 'application/json');
          res.end(out);
        } catch (e) {
          res.end(Buffer.concat(chunks));
        }
      });
    }
  },
  {
    context: [
      '/nde/custom/**',
      '!/nde/custom/41SLSP_NETWORK-CENTRAL_PACKAGE/**'
    ],
    target: 'not-needed',
    router: (req) => {
      const url = `${req.protocol}://${req.get('host')}`
      console.log(url);
      return url;

    },
    secure: true,
    logLevel: 'debug',
    pathRewrite: { '^/nde/custom/.*/': '' },

  },
  {
    context: [
      '**', '!/nde/custom/**', '!/nde/home', '!/home'
    ],
    target: PROXY_TARGET,
    secure: true,
    changeOrigin: true,
    logLevel: 'debug',

  }  
];



export default proxyRules;

