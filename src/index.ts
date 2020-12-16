import { Provider, ResponseType } from 'oidc-provider'
import { JWKS } from 'jose'

const main = async () => {
  // create some signing keys (dev only)
  const keystore = new JWKS.KeyStore()

  await Promise.all([
    // I don't know which of these we need
    keystore.generate('RSA', 2048, { use: 'sig' }),
    keystore.generate('RSA', 2048, { use: 'enc' }),
    keystore.generate('EC', 'P-256', { use: 'sig' }),
    keystore.generate('EC', 'P-256', { use: 'enc' }),
    keystore.generate('OKP', 'Ed25519', { use: 'sig' })
  ])

  console.log('this is the full private JWKS:\n', keystore.toJWKS(true))

  const response_types : ResponseType[] = ['code id_token', 'code', 'id_token', 'none']
  const configuration = {
    // ... see available options /docs
    clients: [{
      client_id: 'zELcpfANLqY7Oqas',
      client_secret: 'TQV5U29k1gHibH5bx1layBo0OSAvAbRT3UYW3EWrSYBB5swxjVfWUa1BS8lqzxG/0v9wruMcrGadany3',
      redirect_uris: [
        // these seem buggy for some reason
        'http://localhost:3001',
        'http://localhost:3001/',
        'http://localhost:3001/callback',
        'http://localhost:3001/admin',
        'http://localhost:3001/profile',
        'http://localhost:3001/custom-logout'
      ],
      // I don't know what this is
      grant_types: ['implicit', 'authorization_code'],
      // I don't know which of these are OK
      response_types
      // + other client properties
    }],
    jwks: keystore.toJWKS(true)
  }

  const oidc = new Provider('http://localhost:3000', configuration)

  // disable check for https - clearly needs to be changed in prod
  console.error('redirect https check disabled')
  let c = oidc.Client as any
  c.Schema.prototype.redirectUris = () => {}

  // express/nodejs style application callback (req, res, next) for use with express apps, see /examples/express.js
  // oidc.callback

  // koa application for use with koa apps, see /examples/koa.js
  // oidc.app

  // or just expose a server standalone, see /examples/standalone.js
  const server = oidc.listen(3000, () => {
    console.log('oidc-provider listening on port 3000, check http://localhost:3000/.well-known/openid-configuration')
  })
}

main()
