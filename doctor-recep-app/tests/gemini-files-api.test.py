import os
from google import genai
import tempfile

# Test Gemini Files API: upload multiple audio and image files, use in prompt, and get a response

def test_gemini_files_api():
    api_key = os.environ.get('GEMINI_API_KEY')
    assert api_key, 'GEMINI_API_KEY not set in environment'
    client = genai.Client(api_key=api_key)

    # Create dummy files for testing
    with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as f1, \
         tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as f2:
        f1.write(b'Audio file 1 dummy content')
        f2.write(b'Audio file 2 dummy content')
        f1.flush()
        f2.flush()
        audio1_path = f1.name
        audio2_path = f2.name

    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as img:
        img.write(b'\xff\xd8\xff\xe0' + b'0' * 100)  # Minimal JPEG header + dummy data
        img.flush()
        image_path = img.name

    # Upload files
    audio1_file = client.files.upload(file=audio1_path)
    audio2_file = client.files.upload(file=audio2_path)
    image_file = client.files.upload(file=image_path)

    # Compose prompt
    prompt = "Test: Please summarize the content of the audio and image files."
    contents = [prompt, audio1_file, audio2_file, image_file]

    # Call Gemini
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents=contents
    )
    print('Gemini response:', response.text)
    assert response.text, 'No response from Gemini'

    # Cleanup
    client.files.delete(name=audio1_file.name)
    client.files.delete(name=audio2_file.name)
    client.files.delete(name=image_file.name)
    os.remove(audio1_path)
    os.remove(audio2_path)
    os.remove(image_path)

if __name__ == '__main__':
    test_gemini_files_api()
