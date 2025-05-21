# flask_server.py
from flask import Flask, request
from flask_cors import CORS
import subprocess
import os

app = Flask(__name__)
CORS(app)
process = None

@app.route("/start", methods=["POST"])
def start():
    global process
    if process is None:
        script_path = os.path.join(os.path.dirname(__file__), "3code1.py")
        process = subprocess.Popen(["python", script_path])
        return "Started", 200
    return "Already running", 400

@app.route("/stop", methods=["POST"])
def stop():
    global process
    if process:
        process.terminate()
        process = None
        return "Stopped", 200
    return "Not running", 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
