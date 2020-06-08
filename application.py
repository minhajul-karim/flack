"""Main application."""

from flask_socketio import SocketIO, emit, send, join_room, leave_room
from flask import Flask, render_template, request, jsonify
import os
import eventlet


app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)
eventlet.monkey_patch()

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


@socketio.on("message")
def message(data):
    """Receive 'send message' evnent."""
    name = data["name"]
    message = data["message"]
    time = data["time"]
    room = data["room"]
    images = data["images"]

    # Save the most 100 chat messages
    if room in chats:
        if len(chats[room]) == 100:
            socketio.sleep(0)
            chats[room].pop(0)
            chats[room].append(
                {"name": name,
                 "time": time,
                 "message": message,
                 "images": images})
        else:
            chats[room].append(
                {"name": name,
                 "time": time,
                 "message": message,
                 "images": images})
    else:
        rooms.append(room)
        chats[room] = []
        chats[room].append(
            {"name": name,
             "time": time,
             "message": message,
             "images": images})

    # Send data to client
    send(
        {"name": name,
         "time": time,
         "message": message,
         "images": images}, room=room)


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
    name = data["name"]
    time = data["time"]
    image_data = data["imageData"]
    room = data["room"]
    emit("Display image", {"name": name, "time": time,
                           "image_data": image_data}, room=room)


if __name__ == "__main__":
    socketio.run(app)
