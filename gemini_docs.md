Send feedback Files API
The Gemini family of artificial intelligence (AI) models is built to handle various types of input data, including text, images, and audio. Since these models can handle more than one type or mode of data, the Gemini models are called multimodal models or explained as having multimodal capabilities.

This guide shows you how to work with media files using the Files API. The basic operations are the same for audio files, images, videos, documents, and other supported file types.

For file prompting guidance, check out the File prompt guide section.

Upload a file

You can use the Files API to upload a media file. Always use the Files API when the total request size (including the files, text prompt, system instructions, etc.) is larger than 20 MB.

The following code uploads a file and then uses the file in a call to generateContent.

Python
JavaScript
Go
REST

import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "GOOGLE_API_KEY" });

async function main() {
  const myfile = await ai.files.upload({
    file: "path/to/sample.mp3",
    config: { mimeType: "audio/mpeg" },
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: createUserContent([
      createPartFromUri(myfile.uri, myfile.mimeType),
      "Describe this audio clip",
    ]),
  });
  console.log(response.text);
}

await main();
Send feedback Audio understanding
Gemini can analyze and understand audio input, enabling use cases like the following:

Describe, summarize, or answer questions about audio content.
Provide a transcription of the audio.
Analyze specific segments of the audio.
This guide shows you how to use the Gemini API to generate a text response to audio input.

Before you begin

Before calling the Gemini API, ensure you have your SDK of choice installed, and a Gemini API key configured and ready to use.

Input audio

You can provide audio data to Gemini in the following ways:

Upload an audio file before making a request to generateContent.
Pass inline audio data with the request to generateContent.
Upload an audio file

You can use the Files API to upload an audio file. Always use the Files API when the total request size (including the files, text prompt, system instructions, etc.) is larger than 20 MB.

The following code uploads an audio file and then uses the file in a call to generateContent.

Python
JavaScript
Go
REST

import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "GOOGLE_API_KEY" });

async function main() {
  const myfile = await ai.files.upload({
    file: "path/to/sample.mp3",
    config: { mimeType: "audio/mp3" },
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: createUserContent([
      createPartFromUri(myfile.uri, myfile.mimeType),
      "Describe this audio clip",
    ]),
  });
  console.log(response.text);
}

await main();
To learn more about working with media files, see Files API.

Supported audio formats

Gemini supports the following audio format MIME types:

WAV - audio/wav
MP3 - audio/mp3
AIFF - audio/aiff
AAC - audio/aac
OGG Vorbis - audio/ogg
FLAC - audio/flac
Send feedback Image understanding
Gemini models can process images, enabling many frontier developer use cases that would have historically required domain specific models. Some of Gemini's vision capabilities include the ability to:

Caption and answer questions about images
Transcribe and reason over PDFs, including up to 2 million tokens
Detect objects in an image and return bounding box coordinates for them
Segment objects within an image
Gemini was built to be multimodal from the ground up and we continue to push the frontier of what is possible. This guide shows how to use the Gemini API to generate text responses based on image inputs and perform common image understanding tasks.

Image input

You can provide images as input to Gemini in the following ways:

Upload an image file using the File API before making a request to generateContent. Use this method for files larger than 20MB or when you want to reuse the file across multiple requests.
Pass inline image data with the request to generateContent. Use this method for smaller files (<20MB total request size) or images fetched directly from URLs.
Upload an image file

You can use the Files API to upload an image file. Always use the Files API when the total request size (including the file, text prompt, system instructions, etc.) is larger than 20 MB, or if you intend to use the same image in multiple prompts.

The following code uploads an image file and then uses the file in a call to generateContent.

Python
JavaScript
Go
REST

import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "GOOGLE_API_KEY" });

async function main() {
  const myfile = await ai.files.upload({
    file: "path/to/sample.jpg",
    config: { mimeType: "image/jpeg" },
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: createUserContent([
      createPartFromUri(myfile.uri, myfile.mimeType),
      "Caption this image.",
    ]),
  });
  console.log(response.text);
}

await main();
To learn more about working with media files, see Files API.

Prompting with multiple images

You can provide multiple images in a single prompt by including multiple image Part objects in the contents array. These can be a mix of inline data (local files or URLs) and File API references.

Python
JavaScript
Go
REST

import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";
import * as fs from "node:fs";

const ai = new GoogleGenAI({ apiKey: "GOOGLE_API_KEY" });

async function main() {
  // Upload the first image
  const image1_path = "path/to/image1.jpg";
  const uploadedFile = await ai.files.upload({
    file: image1_path,
    config: { mimeType: "image/jpeg" },
  });

  // Prepare the second image as inline data
  const image2_path = "path/to/image2.png";
  const base64Image2File = fs.readFileSync(image2_path, {
    encoding: "base64",
  });

  // Create the prompt with text and multiple images
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: createUserContent([
      "What is different between these two images?",
      createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
      {
        inlineData: {
          mimeType: "image/png",
          data: base64Image2File,
        },
      },
    ]),
  });
  console.log(response.text);
}

await main();


python code :
Prompting with multiple images

You can provide multiple images in a single prompt by including multiple image Part objects in the contents array. These can be a mix of inline data (local files or URLs) and File API references.

Python
JavaScript
Go
REST

from google import genai
from google.genai import types

client = genai.Client(api_key="GOOGLE_API_KEY")

# Upload the first image
image1_path = "path/to/image1.jpg"
uploaded_file = client.files.upload(file=image1_path)

# Prepare the second image as inline data
image2_path = "path/to/image2.png"
with open(image2_path, 'rb') as f:
    img2_bytes = f.read()

# Create the prompt with text and multiple images
response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents=[
        "What is different between these two images?",
        uploaded_file,  # Use the uploaded file reference
        types.Part.from_bytes(
            data=img2_bytes,
            mime_type='image/png'
        )
    ]
)

print(response.text)
mage understanding
Gemini models can process images, enabling many frontier developer use cases that would have historically required domain specific models. Some of Gemini's vision capabilities include the ability to:

Caption and answer questions about images
Transcribe and reason over PDFs, including up to 2 million tokens
Detect objects in an image and return bounding box coordinates for them
Segment objects within an image
Gemini was built to be multimodal from the ground up and we continue to push the frontier of what is possible. This guide shows how to use the Gemini API to generate text responses based on image inputs and perform common image understanding tasks.

Image input

You can provide images as input to Gemini in the following ways:

Upload an image file using the File API before making a request to generateContent. Use this method for files larger than 20MB or when you want to reuse the file across multiple requests.
Pass inline image data with the request to generateContent. Use this method for smaller files (<20MB total request size) or images fetched directly from URLs.
Upload an image file

You can use the Files API to upload an image file. Always use the Files API when the total request size (including the file, text prompt, system instructions, etc.) is larger than 20 MB, or if you intend to use the same image in multiple prompts.

The following code uploads an image file and then uses the file in a call to generateContent.

Python
JavaScript
Go
REST

from google import genai

client = genai.Client(api_key="GOOGLE_API_KEY")

my_file = client.files.upload(file="path/to/sample.jpg")

response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents=[my_file, "Caption this image."],
)

print(response.text)
To learn more about working with media files, see Files API.
Send feedback Audio understanding
Gemini can analyze and understand audio input, enabling use cases like the following:

Describe, summarize, or answer questions about audio content.
Provide a transcription of the audio.
Analyze specific segments of the audio.
This guide shows you how to use the Gemini API to generate a text response to audio input.

Before you begin

Before calling the Gemini API, ensure you have your SDK of choice installed, and a Gemini API key configured and ready to use.

Input audio

You can provide audio data to Gemini in the following ways:

Upload an audio file before making a request to generateContent.
Pass inline audio data with the request to generateContent.
Upload an audio file

You can use the Files API to upload an audio file. Always use the Files API when the total request size (including the files, text prompt, system instructions, etc.) is larger than 20 MB.

The following code uploads an audio file and then uses the file in a call to generateContent.

Python
JavaScript
Go
REST

from google import genai

client = genai.Client(api_key="GOOGLE_API_KEY")

myfile = client.files.upload(file="path/to/sample.mp3")

response = client.models.generate_content(
    model="gemini-2.0-flash", contents=["Describe this audio clip", myfile]
)

print(response.text)
To learn more about working with media files, see Files API.
Send feedback Files API
The Gemini family of artificial intelligence (AI) models is built to handle various types of input data, including text, images, and audio. Since these models can handle more than one type or mode of data, the Gemini models are called multimodal models or explained as having multimodal capabilities.

This guide shows you how to work with media files using the Files API. The basic operations are the same for audio files, images, videos, documents, and other supported file types.

For file prompting guidance, check out the File prompt guide section.

Upload a file

You can use the Files API to upload a media file. Always use the Files API when the total request size (including the files, text prompt, system instructions, etc.) is larger than 20 MB.

The following code uploads a file and then uses the file in a call to generateContent.

Python
JavaScript
Go
REST

from google import genai

client = genai.Client(api_key="GOOGLE_API_KEY")

myfile = client.files.upload(file="path/to/sample.mp3")

response = client.models.generate_content(
    model="gemini-2.0-flash", contents=["Describe this audio clip", myfile]
)

print(response.text)
