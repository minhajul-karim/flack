"""Main application."""

import os

from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit, send, join_room, leave_room

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# Store chats, channels
chats = {"general": []}
rooms = ["general"]
last_room = "general"


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
    new_room = request.form.get("new_room")

    # Return false if room already exists, otherwise return true
    if new_room in rooms:
        return jsonify({"status": False})
    else:
        rooms.append(new_room)
        chats[new_room] = []
        return jsonify({"status": True})


@app.route("/current_room")
def current_room():
    """Return last visited room."""
    return last_room


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

    # Set last visited room
    global last_room
    last_room = room
    join_room(room)
    emit("chat history", {"chats": chats[room]})


@socketio.on("leave")
def leave(data):
    """Leave a room."""
    leave_room(data["room"])
    send({"message": data["name"] + " has left."}, room=data["room"])


@socketio.on("new room")
def new_room(data):
    """Emit new room."""
    new_room = data["new_room"]
    emit("display new room", {"new_room": new_room}, broadcast=True)


if __name__ == "__main__":
    socketio.run(app)
