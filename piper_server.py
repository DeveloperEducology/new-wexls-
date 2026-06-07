import os
import subprocess
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 5050
# Defaults: expects the binary and voices folder in the project root or standard paths
PIPER_PATH = os.environ.get("PIPER_PATH", "./scratch/piper_env/bin/piper")
MODEL_DIR = os.environ.get("PIPER_MODEL_DIR", "./voices")

class PiperHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        if parsed_url.path != '/api/tts':
            self.send_response(404)
            self.end_headers()
            return
            
        params = urllib.parse.parse_qs(parsed_url.query)
        text = params.get('text', [''])[0]
        voice = params.get('voice', ['en_US-amy-medium'])[0]
        
        if not text:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Missing text parameter")
            return
            
        # Force using the Amy medium female voice as requested
        model_name = 'en_US-amy-medium'
        
        # Look for model.onnx in the voices directory
        model_path = os.path.join(MODEL_DIR, f"{model_name}.onnx")
        
        # If it doesn't exist, try resolving as direct path or matching any file
        if not os.path.exists(model_path):
            # Fallback to search if the user downloaded with slightly different names
            found = False
            for f in os.listdir(MODEL_DIR) if os.path.exists(MODEL_DIR) else []:
                if f.startswith(model_name) and f.endswith(".onnx"):
                    model_path = os.path.join(MODEL_DIR, f)
                    found = True
                    break
            
            if not found:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(f"Voice model not found for '{voice}' at: {os.path.abspath(model_path)}. Please make sure the .onnx and .onnx.json files are placed inside the '{MODEL_DIR}' folder.".encode())
                return
            
        try:
            print(f"[Piper] Synthesizing: \"{text[:40]}...\" using {os.path.basename(model_path)}")
            # Call piper binary, specifying output_file as "-" (standard output) to output WAV directly
            cmd = [
                PIPER_PATH,
                "--model", model_path,
                "--output_file", "-"
            ]
            
            process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Pipe the text to stdin and get output
            stdout, stderr = process.communicate(input=text.encode('utf-8'))
            
            if process.returncode != 0:
                print(f"[Piper] Subprocess failed: {stderr.decode()}")
                self.send_response(500)
                self.end_headers()
                self.wfile.write(f"Piper error: {stderr.decode()}".encode())
                return
                
            self.send_response(200)
            self.send_header('Content-Type', 'audio/wav')
            self.send_header('Content-Length', str(len(stdout)))
            self.send_header('Access-Control-Allow-Origin', '*') # Add CORS support
            self.end_headers()
            self.wfile.write(stdout)
            
        except Exception as e:
            print(f"[Piper] Exception during TTS: {e}")
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode())

if __name__ == '__main__':
    # Ensure directories exist
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)
        print(f"Created voices directory at: {MODEL_DIR}")
        
    print(f"=========================================================")
    print(f" Piper TTS Local HTTP Server running on: http://localhost:{PORT}")
    print(f" PIPER_PATH: {PIPER_PATH}")
    print(f" MODEL_DIR : {MODEL_DIR}")
    print(f"=========================================================")
    HTTPServer(('0.0.0.0', PORT), PiperHandler).serve_forever()
