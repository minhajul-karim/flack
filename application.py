"""Main application."""

import os

from flask import Flask, url_for, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)


@app.route("/")
def home():
    return render_template("home.html")


@app.route("/get_name")
def get_name():
    return render_template("get_name.html")
