import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth import authenticate
from django.middleware.csrf import get_token
import graphene
from django.http import JsonResponse

# =============================
# LoginMutation
# =============================
class LoginMutation(graphene.Mutation):
    success = graphene.Boolean()
    message = graphene.String()
    csrf_token = graphene.String()  # Pour Angular

    class Arguments:
        email = graphene.String(required=True)
        password = graphene.String(required=True)

    def mutate(self, info, email, password):
        request = info.context  # WSGIRequest
        user = authenticate(email=email, password=password)
        if not user:
            return LoginMutation(success=False, message="Identifiants invalides", csrf_token=None)

        # Création du JWT
        payload = {
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=1),
            'iat': datetime.utcnow()
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

        # Générer CSRF token lisible par Angular
        csrf_token = get_token(request)

        # Créer une réponse JSON pour inclure le cookie
        response = JsonResponse({
            "success": True,
            "message": "Login réussi",
            "csrf_token": csrf_token
        })

        response.set_cookie(
            key='access_token',
            value=token,
            httponly=True,
            secure=True,
            samesite='Lax',
            max_age=3600
        )

        # Injecter la réponse pour Graphene-Django
        info.context._response = response

        return LoginMutation(success=True, message="Login réussi", csrf_token=csrf_token)


# =============================
# LogoutMutation
# =============================
class LogoutMutation(graphene.Mutation):
    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info):
        request = info.context  # WSGIRequest

        # Créer une réponse JSON pour supprimer le cookie
        response = JsonResponse({
            "success": True,
            "message": "Logout réussi"
        })

        response.set_cookie(
            key='access_token',
            value='',        # on supprime le token
            httponly=True,
            secure=True,
            samesite='Lax',
            max_age=0        # expiration immédiate
        )

        # Injecter la réponse pour Graphene-Django
        info.context._response = response

        return LogoutMutation(success=True, message="Logout réussi")
