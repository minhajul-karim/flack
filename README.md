
# Flack

This is an online messaging service, similar in spirit to Slack. Users are able to sign into this site with a display name, create channels (i.e. chatrooms) to communicate in, as well as see and join existing channels. Once a channel is selected, users will be able to send and receive messages and images with one another in real time.

### Installation
After you've cloned or downloaded the repository, you need to install the required packages via the following commands.

If you use pipenv for your virtual environment:
`pipenv install`

For venv:
`pip install -r requirements.txt`


## Deployment
There are a few ways to deploy this application in both local and remote servers.

    gunicorn --worker-class eventlet -w 1 application:app

> Run this command to deploy in local server.

To deploy in Heroku, create a `Procfile` and put the following command inside it.

    web: gunicorn --worker-class eventlet -w 1 application:app


More details about deployment can be found [here](https://flask-socketio.readthedocs.io/en/latest/#deployment).

### Usage
Visit [the site](https://flack-chat-application.herokuapp.com/), register yourself and you'll be added to a common room called general. Write a message and hit the `send` button or the `return` key to send a message. Use `shift + return` keys to insert a new line. To attach images, click on the `paperclip` icon and select your images. You may also create channels if you wish. To do so, click the `+` icon on the top left of your screen. Click `logout` on the top right corner to log out. You can catch up with the ongoing conversation after you log in again.

## Privacy
* Your name and channel history resides in your browser.
* Up to last 100 messages and shared images per channel are saved in the server.

## File Description

    .
    ├── application.py
    ├── Pipfile
    ├── Pipfile.lock
    ├── Procfile
    ├── README.md
    ├── requirements.txt
    ├── start.sh
    ├── static
    │   ├── css
    │   │   ├── bootstrap.min.css
    │   │   ├── style.css
    │   │   └── style.css.map
    │   ├── images
    │   │   ├── favicon.ico
    │   │   └── user_image.png
    │   ├── js
    │   │   ├── download.js
    │   │   └── index.js
    │   └── scss
    │       └── style.scss
    └── templates
        ├── home.html
        └── sign_in.html

> File tree

* `application.py`: All of our backend operations happen here many of which are: receive and save messages from client, save images etc.
* `Pipfile`: This file contains the list of installed packages to be used in a  `pipenv` environment.
* `Procfile`: The command to run this application in Heroku.
* `requirements.txt`: This file contains the list installed packages.
* `static/css/style.css`: The compiled output of `static/scss/style.scss`.
* `static/images`: Favicon and user image resides here.
* `static/js/download.js`: A library to download shared images.
* `static/js/index.js`: Most of our client side operations happen here many of which are: connect to websocket, send messages, images to server, generate dynamic templates to show messages and images, input validation, and many more.
* `static/scss/style.scss`: The main stylesheet.
* `static/templates/sign_in.html`: Sign up page.
* `static/templates/home.html`: Chat page.


## Personal Touch/Improvements
* Input validation.
* Image sharing.
* Display thumbnail of images before sharing.
* Download shared images.

## Built With

* [Flask](https://flask.palletsprojects.com/en/1.1.x/) - The web framework.
* [Socket.IO](https://socket.io/) - The JavaScript library that enables real-time, bidirectional and event-based communication between the browser and the server.
* [Flask-SocketIO](https://github.com/miguelgrinberg/Flask-SocketIO) - Socket.IO integration for Flask applications.
* [download.js](http://danml.com/download.html)- Client-side file downloading using JS and HTML5.
* [Bootstrap](https://getbootstrap.com/docs/4.0/getting-started/introduction/) - Front-end framework.
* [Handlebars](https://handlebarsjs.com/) - The templating language.
