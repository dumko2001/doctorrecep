
from google import genai

def test_file_upload_and_generate():
    client = genai.Client(api_key="AIzaSyCuRoRkbCzzu9VDYfdgTj6rSWC_AKtUb94")

    # Upload file
    uploaded_file = client.files.upload(path="example/IM-0001-0001.jpeg")
    print(f"Uploaded file URI: {uploaded_file.uri}")

    prompt = "Summarize the contents of this file."

    # Construct file content correctly according to the SDK expected structure
    # The file part must be a dictionary with a 'file' key containing the uri, wrapped inside a Part dict

    contents = [
        prompt,
        {
            "file": {
                "uri": uploaded_file.uri
            }
        }
    ]

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-preview-05-20",
            contents=contents,
        )
        print("Response text:", response.text)
    except Exception as e:
        print("Error during generate_content call:", e)


if __name__ == "__main__":
    test_file_upload_and_generate()
