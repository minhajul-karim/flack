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


@app.route("/")
def home():
    """Home page."""
    print(rooms)
    return render_template("home.html", chats=chats["general"], rooms=rooms)


@app.route("/get_name")
def get_name():
    """Display page to get user name."""
    return render_template("get_name.html")


@app.route("/create_room", methods=["POST"])
def create_room():
    """Create a new room."""
    room_name = request.form.get("room_name")

    # Return false if room already exists, otherwise return true
    if room_name in rooms:
        return jsonify({"status": False})
    else:
        rooms.append(room_name)
        return jsonify({"status": True})


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
    join_room(data["room"])
    send({"message": data["name"] + " has joined."}, room=data["room"])


@socketio.on("leave")
def leave(data):
    """Leave a room."""
    leave_room(data["room"])
    send({"message": data["name"] + " has left."}, room=data["room"])


if __name__ == "__main__":
    socketio.run(app)
