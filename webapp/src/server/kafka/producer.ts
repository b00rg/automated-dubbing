import { Kafka, logLevel, type Producer } from "kafkajs";
import { env } from "@/env";

const brokers = env.KAFKA_BOOTSTRAP_SERVER.split(",")
  .map((broker) => broker.trim())
  .filter(Boolean);

let producerPromise: Promise<Producer> | null = null;

const getProducer = async () => {
  if (!producerPromise) {
    const kafka = new Kafka({
      clientId: "webapp",
      brokers,
      logLevel: logLevel.ERROR,
    });
    const producer = kafka.producer();
    producerPromise = producer.connect().then(() => producer);
  }

  return producerPromise;
};

export type IngestPayload = {
  src_blob: string;
  src_lang: string | null;
  dest_lang: string;
};

export const sendIngestMessage = async (payload: IngestPayload) => {
  const producer = await getProducer();

  await producer.send({
    topic: "ingest",
    messages: [
      {
        key: payload.src_blob,
        value: JSON.stringify(payload),
      },
    ],
  });
};
