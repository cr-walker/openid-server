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

  // the oidc provider issuing auth tokens
  const issuer = 'http://localhost:3000'

  // custom verification claims use namespaced oidc claims: see https://auth0.com/docs/security/tokens/json-web-tokens/create-namespaced-custom-claims
  const namespace = 'https://stagetokensoft.com/'

  const claims = {
    // standard oidc claims: see https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims
    address: [
      'address'
    ],
    email: [ // email scope
      'email', // e.g. 'chris@tokensoft.io'
    ],
    profile: [ // profile scope contains standard user info
      'name', // John X. Doe
      'gender', // male
      'family_name', // Doe
      'given_name', // John
      'middle_name', // Xavier
      'picture', // image URL e.g. 'https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50'
      'birthdate', // ISO 8601 e.g. '2020-01-01'
      'phone_number', // e.g. '+1 (123) 867-5309'
    ],
    // custom account scope
    account: [
      namespace + 'account_address',
      namespace + 'account_chain',
      namespace + 'account_type',
    ],
    verification: [
      'email_verified', // boolean
      'phone_number_verified', // boolean,
      // has the user's current name + address been verified using government documents?
      namespace + 'identity_verified', // boolean, e.g. true
      namespace + 'identity_verified_date', // ISO 8601 timestamp e.g. '2021-10-19T23:29:49Z'
    ]
  }

  async function findAccount (ctx : any, sub: any, token: any) {
    // sub: account identifier
    // token used for account being loaded?
    console.log('***', { ctx, sub, token })
    // this is a dummy function returning some custom oidc claims we described above
    return {
      accountId: sub,
      async claims (use: any, scope: any, claims: any, rejected: any) {
        return {
          sub,
          country: 'US',
          [namespace + 'identity_verified']: true,
          roles: ['admin']
        }
      }
    }
  }

  const config = {
    claims,
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
      response_types: ['code id_token', 'code', 'id_token', 'none'] as ResponseType[]
      // + other client properties
    }],
    jwks: keystore.toJWKS(true),
    findAccount
  }

  const oidc = new Provider(issuer, config)

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
