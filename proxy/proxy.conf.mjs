import {PROXY_TARGET} from "./proxy.const.mjs";
import {customizationConfigOverride} from "./customization_config_override.mjs";
import {deepMerge} from "./proxy-utils.mjs";






const proxyRules = [
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
      '**', '!/nde/custom/**'
    ],
    target: PROXY_TARGET,
    secure: true,
    changeOrigin: true,
    logLevel: 'debug',

  }
];



export default proxyRules;

