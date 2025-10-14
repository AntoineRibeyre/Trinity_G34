from datetime import datetime, timedelta
from calendar import timegm


def jwt_payload_handler(user, context=None):
    now = datetime.utcnow()
    expiration = now + timedelta(minutes=5)

    return {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'exp': timegm(expiration.utctimetuple()),
        'origIat': timegm(now.utctimetuple()),
    }
