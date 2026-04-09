# AutoDub

An AI-powered video translation and dubbing platform. Upload a video in any language and receive a dubbed version with speaker-aware voice synthesis — voices are cloned per speaker and time-stretched to match the original timing.

## Architecture

The system is a monorepo with two services communicating via Kafka and Azure Blob Storage:

```
User Upload (Next.js Webapp)
         ↓
    Ingest Event (Kafka)
         ↓
Diarization Service → Transcription + Speaker Detection
         ↓
Translation Service → Language Translation
         ↓
TTS Service        → Voice Synthesis (speaker-aware)
         ↓
Reconstruction     → Audio/Video Muxing
         ↓
Download (Dubbed Video)
```

| Directory | Description |
|---|---|
| [`webapp/`](webapp/) | Next.js frontend and tRPC API for video uploads and progress tracking |
| [`ai-processing/`](ai-processing/) | Python microservices for diarization, translation, TTS, and reconstruction |

## Features

- **Speaker diarization** — identifies and separates speakers using pyannote
- **Automatic transcription** — OpenAI Whisper with source language detection
- **Multi-language translation** — 50+ languages via Azure Translator
- **Voice cloning** — ElevenLabs maintains voice identity per speaker across the dub
- **Audio reconstruction** — Rubberband time-stretches audio to match original timing
- **Progress tracking** — real-time pipeline status per video in the webapp

## Tech Stack

**Webapp**: Next.js 15, TypeScript, tRPC, Drizzle ORM, PostgreSQL, Better Auth, Shadcn/UI, Tailwind CSS, KafkaJS

**AI Processing**: Python 3.11, PyTorch, OpenAI Whisper, pyannote, ElevenLabs, Azure Cognitive Services, FFmpeg, Rubberband

**Infrastructure**: Kafka, Azure Blob Storage, PostgreSQL, Docker

## Getting Started

### Prerequisites

- Node.js, pnpm
- Python 3.11+
- Docker
- Kafka cluster
- Azure Storage account
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

Each AI processing microservice has its own Dockerfile (`Dockerfile.diarization`, `Dockerfile.translation`, `Dockerfile.tts`, `Dockerfile.reconstruction`) built from a shared base image. The webapp deploys as a standard Next.js application.
