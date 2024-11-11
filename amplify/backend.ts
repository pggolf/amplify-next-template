import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { storage } from './storage/resource';
import { sayHello } from './functions/say-hello/resource';

defineBackend({
  auth,
  data,
  storage,
  sayHello,
});

