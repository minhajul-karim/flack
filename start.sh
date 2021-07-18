export FLASK_APP=application.py
export FLASK_DEBUG=1
flask run
# gunicorn --worker-class eventlet -w 1 application:app