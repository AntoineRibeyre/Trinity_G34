import graphene
import graphql_jwt
from django.middleware.csrf import get_token
from django.http import JsonResponse


class CustomObtainJSONWebToken(graphql_jwt.ObtainJSONWebToken):
    csrf_token = graphene.String()

    @classmethod
    def mutate(cls, root, info, **kwargs):
        # Exécuter la mutation parent (crée le token et le payload)
        result = super().mutate(root, info, **kwargs)

        token = result.token
        payload = result.payload

        # Créer un token CSRF Django
        csrf_token = get_token(info.context)

        # Ajouter le JWT dans un cookie HttpOnly
        response = JsonResponse({
            "success": True,
            "csrf_token": csrf_token,
            "token": token,
            "payload":payload,
        })
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=False,       # OK pour HTTP local
            samesite="Lax",     # ✅ Lax ou Strict fonctionne en local
            max_age=3600        # durée plus longue pour tester
        )


        info.context._response = response

        # Créer une instance de la mutation et y injecter les valeurs
        mutation = cls()
        mutation.token = token
        mutation.payload = payload
        mutation.csrf_token = csrf_token

        return mutation
