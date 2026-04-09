# AutoDub

An automated video dubbing platform built in association with Microsoft for Trinity College's SWENG module. Upload a video in any language and receive a dubbed version. Voices are cloned per speaker, translated into the target language, and time-stretched to fit the original timing.

## How It Works

The pipeline uses seven machine learning models:

1. **Language detection**: Azure AI Foundry identifies the source language automatically
2. **Transcription** (concurrent): Azure AI Foundry transcribes speech with timestamps
3. **Diarization** (concurrent): a Hugging Face model (run locally on CPU) assigns timestamps to each speaker, giving each person a unique voice
4. **Translation**: Azure AI Foundry translates the transcribed segments into the target language
5. **Voice cloning**: ElevenLabs selects the best audio samples per speaker and creates a clone of their voice
6. **Text-to-speech**: ElevenLabs generates translated audio in each speaker's cloned voice
7. **Reconstruction**: audio segments are time-stretched/compressed to fit the original timestamps, layered over the original background audio, and muxed back into the video

## Architecture

The system is a monorepo with two services communicating via Apache Kafka and Azure Blob Storage:

```
User Upload (Next.js Webapp)
         ↓
    Ingest Queue (Kafka)
         ↓
Diarization Service  →  speaker detection + transcription with timestamps
         ↓
Translation Service  →  text translation per segment
         ↓
TTS Service          →  voice cloning + speech synthesis
         ↓
Reconstruction       →  audio time-stretching + video muxing
         ↓
Download (Dubbed Video)
```

Using Kafka queues and independent microservices allows each stage to scale up or down independently to meet demand.

| Directory | Description |
|---|---|
| [`webapp/`](webapp/) | Next.js frontend and tRPC API for video uploads and progress tracking |
| [`ai-processing/`](ai-processing/) | Python microservices for the dubbing pipeline |

## Tech Stack

**Webapp**: Next.js 15, TypeScript, tRPC, Drizzle ORM, PostgreSQL, Better Auth, Shadcn/UI, Tailwind CSS, KafkaJS

**AI Processing**: Python 3.11, Azure AI Foundry, Hugging Face (pyannote diarization), ElevenLabs, FFmpeg, Rubberband

**Infrastructure**: Apache Kafka, Azure Blob Storage, PostgreSQL, Docker, Dokploy

## Getting Started

### Prerequisites

- Node.js, pnpm
- Python 3.11+
- Docker
- Kafka cluster
- Azure Storage account and Azure AI Foundry credentials
- ElevenLabs API key

### Webapp

```bash
cd webapp
pnpm install
docker compose up -d          # Start PostgreSQL
pnpm db:generate
pnpm db:migrate
cp .env.example .env          # Fill in env vars
pnpm dev                      # http://localhost:3000
```

### AI Processing

```bash
cd ai-processing
pip install -r requirements.txt
# Set env vars (Kafka, Azure, ElevenLabs, DB connection)

# Run each microservice in a separate terminal
python -m kafka_pipeline.microservices.diarization_service --group-id diarization-v1
python -m kafka_pipeline.microservices.translation_service --group-id translation-v1
python -m kafka_pipeline.microservices.tts_service --group-id tts-v1
python -m kafka_pipeline.microservices.reconstruction_service --group-id reconstruct-v1
```

Each microservice runs as an independent Kafka consumer. See [`ai-processing/README.md`](ai-processing/README.md) and [`webapp/README.md`](webapp/README.md) for service-specific details and environment variable references.

## Kafka Topics

| Topic | Producer | Consumer |
|---|---|---|
| `ingest` | Webapp | Diarization |
| `translate_segments` | Diarization | Translation |
| `text_to_speech` | Translation | TTS |
| `reconstruct_video` | TTS | Reconstruction |

## Deployment
Each AI processing microservice has its own Dockerfile (`Dockerfile.diarization`, `Dockerfile.translation`, `Dockerfile.tts`, `Dockerfile.reconstruction`) built from a shared base image, so individual pipeline stages can be updated and redeployed independently.
