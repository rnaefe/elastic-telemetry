const { client, DATABASE, LOGS_TABLE } = require('./client');
const { createDatabase, createLogsTable, getRetentionDays } = require('./schema');

async function runDDL(query) {
  // exec() returns a Readable stream the client expects us to drain,
  // otherwise it logs a "socket was closed before fully read" warning.
  const { stream } = await client.exec({ query });
  if (!stream) return;
  await new Promise((resolve, reject) => {
    stream.on('data', () => {});
    stream.on('end', resolve);
    stream.on('error', reject);
    stream.resume();
  });
}

async function bootstrap() {
  try {
    await runDDL(createDatabase);
    console.log(`Database '${DATABASE}' ready.`);

    await runDDL(createLogsTable());
    console.log(`Table '${DATABASE}.${LOGS_TABLE}' ready (TTL ${getRetentionDays()} days).`);
  } catch (error) {
    console.error('Error bootstrapping ClickHouse:', error.message || error);
    process.exit(1);
  }
}

module.exports = bootstrap;
