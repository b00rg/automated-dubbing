"use client";

import * as React from "react";

import {
  type LanguageCode,
  languageOptions,
  getLanguageNameForDisplay,
} from "@/lib/languages";
import type { Video } from "@/lib/video-type";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDropzone } from "react-dropzone";
import { api } from "@/trpc/react";
import { BlockBlobClient } from "@azure/storage-blob";

export default function VideoUpload({
  onUploadComplete,
}: {
  onUploadComplete?: (video: Video) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [sourceLanguage, setSourceLanguage] = React.useState<LanguageCode | "">(
    "",
  );
  const [destLanguage, setDestLanguage] = React.useState<LanguageCode | "">("");
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadStatus, setUploadStatus] = React.useState<
    "idle" | "uploading" | "uploaded" | "error"
  >("idle");
  const [blobName, setBlobName] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null,
  );

  const createUpload = api.video.createUpload.useMutation();
  const finalizeUpload = api.video.finalizeUpload.useMutation();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: { "video/*": [] },
    onDrop: (acceptedFiles) => {
      const selectedFile = acceptedFiles?.[0] ?? null;
      if (!selectedFile) return;
      setFile(selectedFile);
      void startUpload(selectedFile);
    },
  });

  async function startUpload(selectedFile: File) {
    setUploadError(null);
    setSuccessMessage(null);
    setUploadProgress(0);
    setUploadStatus("uploading");
    setBlobName(null);

    try {
      const { uploadUrl, blobName: serverBlobName } =
        await createUpload.mutateAsync({
          fileName: selectedFile.name,
          contentType: selectedFile.type || "application/octet-stream",
        });

      const blobClient = new BlockBlobClient(uploadUrl);
      await blobClient.uploadBrowserData(selectedFile, {
        blockSize: 4 * 1024 * 1024,
        maxSingleShotSize: 4 * 1024 * 1024,
        concurrency: 4,
        blobHTTPHeaders: {
          blobContentType: selectedFile.type || "application/octet-stream",
        },
        onProgress: (event) => {
          if (!selectedFile.size) return;
          const percent = Math.round(
            (event.loadedBytes / selectedFile.size) * 100,
          );
          setUploadProgress(Math.min(100, Math.max(0, percent)));
        },
      });

      setBlobName(serverBlobName);
      setUploadProgress(100);
      setUploadStatus("uploaded");
    } catch (error) {
      setUploadStatus("error");
      setUploadError(
        error instanceof Error
          ? error.message
          : "Something went wrong while uploading.",
      );
    }
  }

  async function handleCreateVideo() {
    setUploadError(null);
    setSuccessMessage(null);
    if (!file) return;
    if (!title.trim()) return;
    if (!sourceLanguage || !destLanguage) return;
    if (sourceLanguage === destLanguage) return;
    if (uploadStatus === "uploading") return;
    if (uploadStatus !== "uploaded" || !blobName) return;

    try {
      const createdVideo = await finalizeUpload.mutateAsync({
        blobName,
        title: title.trim(),
        sourceLanguage,
        destLanguage,
      });

      if (!createdVideo) {
        throw new Error("Upload saved, but no video was returned.");
      }

      setSuccessMessage(
        `"${createdVideo.title}" has been added and is now processing.`,
      );
      onUploadComplete?.(createdVideo);

      setTitle("");
      setFile(null);
      setSourceLanguage("");
      setDestLanguage("");
      setUploadProgress(0);
      setUploadStatus("idle");
      setBlobName(null);
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Something went wrong while uploading.",
      );
    }
  }

  return (
    <div className="w-full px-6 py-16">
      <div className="flex min-h-[calc(100vh-6rem)] flex-col space-y-6">
        {/* header */}
        <div className="space-y-5 text-center">
          <h1 className="text-4xl font-semibold">Upload video</h1>
          <p className="text-muted-foreground">
            Upload a video and choose source and destination languages.
          </p>
        </div>

        {/* title */}
        <div className="mx-auto mt-10 w-full max-w-5xl space-y-3">
          <Label htmlFor="title" className="block text-center text-xl">
            Title
          </Label>
          <Input
            id="title"
            placeholder="e.g. My Video"
            className="w-full"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        {/* upload box */}
        <div className="mx-auto mt-10 w-full max-w-5xl">
          <div
            {...getRootProps({
              disabled:
                uploadStatus === "uploading" || finalizeUpload.isPending,
            })}
            className="hover:border-muted-foreground/40 hover:bg-muted/20 flex min-h-90 cursor-pointer flex-col items-center justify-center rounded-xl border-4 border-dashed p-12 text-center transition-colors"
          >
            <input {...getInputProps()} />

            {!file ? (
              <>
                <p className="text-lg font-medium">
                  {isDragActive
                    ? "Drop your video here"
                    : "Drag & drop your video here"}
                </p>
                <p className="text-muted-foreground text-sm">
                  or click to select a file
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium">Selected file</p>
                <p className="text-muted-foreground text-sm">{file.name}</p>
              </>
            )}
          </div>
          <div className="mt-4 space-y-2">
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>
                {uploadStatus === "uploading"
                  ? "Uploading..."
                  : uploadStatus === "uploaded"
                    ? "Upload complete"
                    : uploadStatus === "error"
                      ? "Upload failed"
                      : "No upload yet"}
              </span>
              <span>{uploadProgress}%</span>
            </div>
          </div>
        </div>

        {/* language wrapper */}
        <div className="mx-auto mt-8 w-full max-w-5xl">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {/* source language */}
            <div className="space-y-2 md:relative">
              <Label className="font-medium">Source language</Label>
              <Select
                value={sourceLanguage}
                onValueChange={(languageCode) =>
                  setSourceLanguage(languageCode as LanguageCode)
                }
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {getLanguageNameForDisplay(option.code)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* destination language */}
            <div className="space-y-2 md:relative">
              <Label className="font-medium">Destination language</Label>
              <Select
                value={destLanguage}
                onValueChange={(languageCode) =>
                  setDestLanguage(languageCode as LanguageCode)
                }
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {getLanguageNameForDisplay(option.code)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* create video */}
        <div className="mt-10">
          <div className="mx-auto flex w-full max-w-5xl justify-center">
            <Button
              onClick={handleCreateVideo}
              disabled={
                finalizeUpload.isPending ||
                uploadStatus !== "uploaded" ||
                !title.trim() ||
                !sourceLanguage ||
                !destLanguage ||
                sourceLanguage === destLanguage
              }
            >
              {finalizeUpload.isPending ? "Saving..." : "Upload video"}
            </Button>
          </div>
          {uploadError ? (
            <p className="text-destructive mt-4 text-center text-sm">
              {uploadError}
            </p>
          ) : null}
          {successMessage ? (
            <div className="mx-auto mt-4 w-full max-w-5xl rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
