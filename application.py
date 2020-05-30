"""Main application."""

import os
import sys
import base64

from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for, send_file
from flask_socketio import SocketIO, emit, send, join_room, leave_room
from werkzeug.utils import secure_filename
from binascii import a2b_base64

UPLOAD_FOLDER = "static/uploads"
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
socketio = SocketIO(app)

# Store chats, channels
chats = {"general": []}
rooms = ["general"]


@app.route("/")
def home():
    """Home page."""
    return render_template("home.html", rooms=rooms)


@app.route("/sign_in")
def get_name():
    """Display page to get user name."""
    return render_template("sign_in.html")


@app.route("/create_room", methods=["POST"])
def create_room():
    """Create a new room."""
    new_room = request.form.get("newRoom")

    # Return false if room already exists, otherwise return true
    if new_room in rooms:
        return jsonify({"status": False})
    else:
        rooms.append(new_room)
        chats[new_room] = []
        return jsonify({"status": True})


@app.route("/upload", methods=["GET", "POST"])
def upload_file():
    """Upload file."""
    if request.method == "POST":
        # Check if the post request has the file part
        if 'file' not in request.files:
            return "No file part"
        file = request.files['file']
        # if user does not select file, browser also
        # submit an empty part without filename
        if file.filename == "":
            return "No file selected"
        if not allowed_file(file.filename):
            return "File format not supported"
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.root_path,
                                   app.config["UPLOAD_FOLDER"], filename))
            return redirect(url_for("uploaded_file", filename=filename))
    return render_template("file_form.html")


@app.route("/uploads/<filename>")
def uploaded_file(filename):
    file = os.path.join(app.root_path,
                        app.config["UPLOAD_FOLDER"], filename)
    return send_file(file, as_attachment=True)


def allowed_file(filename):
    """Check allowed filename."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@socketio.on("message")
def message(data):
    """Receive 'send message' evnent."""
    name = data["name"]
    message = data["message"]
    time = data["time"]
    room = data["room"]

    # Save the most 100 chat messages
    if room in chats:
        if len(chats[room]) == 100:
            chats[room].pop(0)
            chats[room].append(
                {"name": name, "message": message, "time": time})
        else:
            chats[room].append(
                {"name": name, "message": message, "time": time})
    else:
        rooms.append(room)
        chats[room] = []
        chats[room].append(
            {"name": name, "message": message, "time": time})

    # Send data to client
    send({"name": name, "message": message, "time": time}, room=room)


@socketio.on("join")
def join(data):
    """Join a room."""
    room = data["room"]
    join_room(room)
    emit("chat history", {"chats": chats[room]})


@socketio.on("leave")
def leave(data):
    """Leave a room."""
    leave_room(data["room"])


@socketio.on("new room")
def new_room(data):
    """Emit new room."""
    new_room = data["newRoom"]
    emit("display new room", {"room": new_room}, broadcast=True)


@socketio.on("file_attachment")
def file_attachment(data):
    """Emit file."""
    # data_url = data["imageData"]


if __name__ == "__main__":
    socketio.run(app)
