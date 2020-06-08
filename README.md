# Flack

This is an online messaging service using Flask, similar in spirit to Slack. Users are able to sign into this site with a display name, create channels (i.e. chatrooms) to communicate in, as well as see and join existing channels. Once a channel is selected, users will be able to send and receive messages and images with one another in real time.

### Installation
After clone clone or download, you need to install the required packages.

For pipenv:
`pipenv install`

For venv:
`pip install -r requirements.txt`

### Usage
Go to http://127.0.0.1:5000/. 

Register yourself and you'll be added to a common room called general. Write down inside the text box and hit the send button or the return key to send a message. Use shift + return to insert a new line. To attach images, click on the paperclip icon and select your images. You may also create channels if you wish. To do so, click the plus(+) icon on the left of your screen. Click logout on the upper right to log out. You can catch up with the current conversation after you log in again.
[screenshots] [screenshots] [screenshots]

## Deployment

Add additional notes about how to deploy this on a live system

## Privacy
* Your name and channel history resides in your browser.
* Up to last 100 messages and shared images are saved in the server.

## Built With(demo)

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - The web framework used
* [Maven](https://maven.apache.org/) - Dependency Management
* [ROME](https://rometools.github.io/rome/) - Used to generate RSS Feeds

