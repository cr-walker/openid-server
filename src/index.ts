import { Provider } from 'oidc-provider'
import { JWKS } from 'jose'

const main = async () => {
  // create some signing keys (dev onlhy)
  const keystore = new JWKS.KeyStore()

  await Promise.all([
    keystore.generate('RSA', 2048, { use: 'sig' }),
    keystore.generate('RSA', 2048, { use: 'enc' }),
    keystore.generate('EC', 'P-256', { use: 'sig' }),
    keystore.generate('EC', 'P-256', { use: 'enc' }),
    keystore.generate('OKP', 'Ed25519', { use: 'sig' }),
  ])

  console.log('this is the full private JWKS:\n', keystore.toJWKS(true))

  const configuration = {
    // ... see available options /docs
    clients: [{
      client_id: 'foo',
      client_secret: 'bar',
      redirect_uris: ['http://lvh.me:8080/cb'],
      // + other client properties
    }],
    jwks: keystore.toJWKS(true)
  };

  const oidc = new Provider('http://localhost:3000', configuration)

  // express/nodejs style application callback (req, res, next) for use with express apps, see /examples/express.js
  // oidc.callback

  // koa application for use with koa apps, see /examples/koa.js
  // oidc.app

  // or just expose a server standalone, see /examples/standalone.js
  const server = oidc.listen(3000, () => {
    console.log('oidc-provider listening on port 3000, check http://localhost:3000/.well-known/openid-configuration');
  })
}

main()