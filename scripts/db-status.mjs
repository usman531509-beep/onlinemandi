import mongoose from "mongoose";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const uri = process.env.MongoDB_URI;

if (!uri) {
  console.error("DB status: NOT CONNECTED");
  console.error("Reason: MongoDB_URI is missing in .env");
  process.exit(1);
}

try {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  const { host, name } = mongoose.connection;
  console.log("DB status: CONNECTED");
  console.log(`Host: ${host}`);
  console.log(`Database: ${name || "(default)"}`);
  await mongoose.disconnect();
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("DB status: NOT CONNECTED");
  console.error(`Reason: ${message}`);
  process.exit(1);
}
