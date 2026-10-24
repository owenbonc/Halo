// An in-memory MongoDB on port 27017 for working offline. Set MONGODB_URI=mongodb://127.0.0.1:27017
import { MongoMemoryReplSet } from 'mongodb-memory-server';

const server = await MongoMemoryReplSet.create({
  instanceOpts: [{ port: 27017 }],
  replSet: { count: 1 },
});
console.log(`Local MongoDB running at ${server.getUri()} (Ctrl+C to stop; data is lost on exit).`);
process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});
