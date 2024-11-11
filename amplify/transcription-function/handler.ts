import { S3Event } from 'aws-lambda';
import { S3Client } from "@aws-sdk/client-s3";
import { TranscribeClient, StartTranscriptionJobCommand } from "@aws-sdk/client-transcribe";

const s3Client = new S3Client();
const transcribeClient = new TranscribeClient();

export const handler = async (event: S3Event) => {
    for (const record of event.Records) {
        const bucketName = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

        // Only process files in the "recordings/" folder
        if (!key.startsWith('recordings/')) {
            console.log(`Skipping file not in recordings folder: ${key}`);
            continue;
        }

        const transcriptionJobName = generateTranscriptionJobName(key);
        const recordingDate = extractDateFromFilename(key);
        const mainSpeaker = extractSpeakerFromFilename(key);
        const audioFileLink = `https://${bucketName}.s3.amazonaws.com/${key}`;

        try {
            const startTranscriptionParams = {
                TranscriptionJobName: transcriptionJobName,
                LanguageCode: 'en-US',
                Media: { MediaFileUri: audioFileLink },
                MediaFormat: 'mp3',
                OutputBucketName: process.env.OUTPUT_BUCKET_NAME,
                OutputKey: `transcripts/${transcriptionJobName}.json`,
                Settings: {
                    ShowSpeakerLabels: true,
                    MaxSpeakerLabels: 4,
                    VocabularyFilterName: "test-remove-um-uh",
                    VocabularyFilterMethod: "remove"
                },
                Tags: [
                    { Key: 'Date', Value: recordingDate },
                    { Key: 'MainSpeaker', Value: mainSpeaker }
                ]
            };

            await transcribeClient.send(new StartTranscriptionJobCommand(startTranscriptionParams));
            console.log(`Transcription job started successfully for ${key}`);
        } catch (error) {
            console.error('Error starting transcription job:', error);
            throw error;
        }
    }

    return { statusCode: 200, body: JSON.stringify('Processing completed') };
};

function generateTranscriptionJobName(filename: string): string {
    const baseName = filename.split('/').pop()?.replace(/\.[^/.]+$/, "") || "";
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const validPrefix = sanitizedName.match(/^[a-zA-Z0-9]/) ? '' : 'job_';
    return (validPrefix + sanitizedName).slice(0, 200);
}

function extractDateFromFilename(filename: string): string {
    const dateMatch = filename.match(/PG (\d{2}-\d{2}-\d{4})/);
    return dateMatch ? dateMatch[1] : '';
}

function extractSpeakerFromFilename(filename: string): string {
    const speakerMatch = filename.match(/-\s*([\w\s]+)\s*\.[\w]+$/);
    return speakerMatch ? formatName(speakerMatch[1]) : '';
}

function formatName(name: string): string {
    const [firstName, lastInitial] = name.split(' ');
    return `${capitalize(firstName)} ${lastInitial?.charAt(0).toUpperCase() || ''}.`;
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}