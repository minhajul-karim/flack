export FLASK_APP=application.py
export FLASK_DEBUG=1
gunicorn --worker-class eventlet -w 1 application:app
# flask run