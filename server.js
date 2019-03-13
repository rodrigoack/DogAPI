'use strict';

const Hapi = require('hapi');
const mongoose = require('mongoose');
const hapiAuthJWT = require('hapi-auth-jwt2');
const jwksRsa = require('jwks-rsa');
const DogController =  require('./src/controllers/dog');
const MongoDBUrl = 'mongodb://localhost:27017/dogapi';

const server = new Hapi.Server({
  port: 3000,
  host: 'localhost'
});

const validateUser = (decoded, request, callback) => {
  // This is a simple check that the `sub` claim
  // exists in the access token. Modify it to suit
  // the needs of your application
  console.log("Decoded", decoded);
  if (decoded && decoded.sub) {
    return callback(null, true, {});
  }

  return callback(null, false, {});
}

const registerRoutes = () => {
  server.route({
    method: 'GET',
    path: '/dogs',
    options: {
      handler: DogController.list
    }
  });

  server.route({
    method: 'GET',
    path: '/dogs/{id}',
    options: {
      handler: DogController.get
    }
  });

  server.route({
    method: 'POST',
    path: '/dogs',
    handler: DogController.create
  });

  server.route({
    method: 'PUT',
    path: '/dogs/{id}',
    handler: DogController.update
  });

  server.route({
    method: 'DELETE',
    path: '/dogs/{id}',
    handler: DogController.remove
  });
}

const init = async () => {
  await server.register(hapiAuthJWT);
  // see: http://Hapi.com/api#serverauthschemename-scheme
  server.auth.strategy('jwt', 'jwt', { 
    key: jwksRsa.hapiJwt2KeyAsync({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      // YOUR-AUTH0-DOMAIN name e.g https://prosper.auth0.com
      jwksUri: 'https://leoojg.auth0.com/.well-known/jwks.json'
    }),
    verifyOptions: { 
      audience: 'https://mydogapi.com',
      issuer: "https://leoojg.auth0.com/",
      algorithms: ['RS256']
    },
    validate: validateUser
  });

  server.auth.default('jwt');

  registerRoutes();

  await server.start();
  return server;

};

init().then(server => {
  console.log('Server running at:', server.info.uri);
}).catch(err => {
  console.log(err);
});