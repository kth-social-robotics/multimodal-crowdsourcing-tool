from flask import Flask, request, abort, render_template
import json
import random
import os
from flask_sqlalchemy import SQLAlchemy
import datetime
import string
import boto3
from io import BytesIO
import base64
import math
from dotenv import load_dotenv
from flask_sslify import SSLify


dotenv_path = os.path.join(os.path.dirname(__file__), '.env')

if os.path.isfile(dotenv_path):
    load_dotenv(dotenv_path)


VIDEOS_TO_SHOW = 7

app = Flask(__name__)

if 'DYNO' in os.environ: # only trigger SSLify if the app is running on Heroku
    sslify = SSLify(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)



class Participant(db.Model):
    __tablename__ = 'v4_participants'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    participant_id = db.Column(db.Text)
    headphone = db.Column(db.Text)
    conditions = db.Column(db.Text)
    comment = db.Column(db.Text)
    last_comment = db.Column(db.Text)
    current_trial = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now)
    source = db.Column(db.Text)
    code = db.Column(db.String(255))
    paid = db.Column(db.Boolean)
    quality = db.Column(db.String(255))
    token = db.Column(db.String(255))
    videos = db.relationship("Video")


class Video(db.Model):
    __tablename__ = 'v4_video'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('v4_participants.id'))
    response = db.Column(db.Boolean)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now)
    done = db.Column(db.Boolean, default=False)
    video = db.Column(db.Text)
    condition = db.Column(db.Text)
    tags = db.Column(db.Text)
    key = db.Column(db.Text)
    original_video = db.Column(db.Text)
    face_value = db.Column(db.Integer)
    voice_value = db.Column(db.Integer)
    lexical = db.Column(db.Text)
    backchannel_id = db.Column(db.Integer)
    category_id = db.Column(db.Integer)
    strength_value = db.Column(db.Integer)
    better_category = db.Column(db.Text)


db.create_all()


@app.route('/')
def index():
    return render_template('index.html')


@app.route("/upload_video", methods=['POST'])
def upload_video():
    data = json.loads(request.data)
    client = boto3.client('s3')
    Participant.query.filter_by(id=data['id'], token=data['token']).update({"current_trial": 'upload_calibration'})
    db.session.commit()
    client.upload_fileobj(BytesIO(base64.b64decode(data['file'])), os.environ['AWS_BUCKET_NAME'], '{}/video_{}.webm'.format(data['id'], data['filename_suffix']))
    return 'ok'


@app.route("/set_comment", methods=['PUT'])
def set_comment():
    data = json.loads(request.data)
    video = [x for x in Participant.query.filter_by(id=data['id'], token=data['token']).first().videos if x.id ==data['video_id']]
    if not video:
        abort(400)
    Video.query.filter_by(id=video[0].id).update(
        {"comment": data['comment'],
        'done': True,
        'face_value': int(data['faceValue']),
        'voice_value': int(data['voiceValue']),
        'strength_value': int(data['strengthValue']),
        'better_category': data['betterCat'],
        'lexical': data['lexical']
    })

    db.session.commit()
    return json.dumps({'status': 'ok'})


@app.route("/set_last_comment", methods=['PUT'])
def set_last_comment():
    data = json.loads(request.data)
    participant = Participant.query.filter_by(id=data['id'], token=data['token'])
    participant.update({"comment": data['comment']})
    db.session.commit()
    if all(map(lambda x: x.done, participant.first().videos)):
        if participant.first().source == 'pa':
            response = {'url': os.environ['COMPLETION_URL'] or '', 'service': participant.first().source}
        else:
            response = {'code': participant.first().code, 'service': participant.first().source}
    else:
        response = {'status': 'not_ok'}
    return json.dumps(response)


@app.route("/get_videos", methods=['POST'])
def get_videos():
    data = json.loads(request.data)
    participant = Participant.query.filter_by(id=data['id'], token=data['token']).first()
    video_id = None
    for video in participant.videos:
        if not video.done:
            vid = video
    if vid:
        return json.dumps({
            'video_id': vid.id,
            'condition': vid.condition,
            'stimuli_video': vid.video,
            'original_video': vid.original_video
        })
    else:
        return json.dumps({'status': 'no_more_videos'})


@app.route("/set_like", methods=['PUT'])
def set_like():
    data = json.loads(request.data)
    participant = Participant.query.filter_by(id=data['id'], token=data['token']).first()
    for video in participant.videos:
        if video.id == data['video_id']:
            video.response = data['like']
            db.session.add(video)
            db.session.commit()
            learner = learning.Learner()
            learner.vote(video.backchannel_id, video.category_id, 1 if data['like'] else -1)
    return json.dumps({'status': 'ok', 'video_id': video.id})


@app.route("/check_face_ok")
def check_face_ok():
    return json.dumps({'status': random.random() < .5})


@app.route("/create_participant", methods=['POST'])
def create_participant():
    data = json.loads(request.data)
    participant = Participant(
        participant_id=data['participant_id'],
        current_trial='intro',
        source=data['source'],
        code=''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(6)),
        token=''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(10))
    )

    videos = (
        ('some_url', 'condition-1', 'context_url', 1, 1),
        ('some_url_2', 'condition-2', 'context_url', 2, 2)
    )
    for url, condition, context_url, backchannel_id, category_id in videos:
        vid = Video(
            video=url, condition=condition, original_video=context_url, backchannel_id = backchannel_id, category_id = category_id
        )
        participant.videos.append(vid)


    db.session.add(participant)
    db.session.commit()

    return json.dumps({'id': participant.id, 'token': participant.token})


@app.route("/update_step", methods=['PUT'])
def update_step():
    data = json.loads(request.data)
    Participant.query.filter_by(id=data['id'], token=data['token']).update({"current_trial": data['page']})
    db.session.commit()
    return json.dumps({'status': 'ok'})


@app.route("/consent_form", methods=['PUT'])
def consent_form():
    data = json.loads(request.data)
    Participant.query.filter_by(id=data['id'], token=data['token']).update({"headphone": data['headphones']})
    db.session.commit()
    return json.dumps({'status': 'ok'})


if __name__ == "__main__":
    app.run(host='0.0.0.0', threaded=True, debug=os.environ.get('DEBUG', False))
