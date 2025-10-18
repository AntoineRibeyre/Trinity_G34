import graphene
import graphql_jwt
from django.middleware.csrf import get_token

# Mutation personnalisée pour créer un token d'authentification ainsi qu'un token CSRF

class CustomObtainJSONWebToken(graphql_jwt.ObtainJSONWebToken):
    csrf_token = graphene.String()

    @classmethod
    def mutate(cls, root, info, **kwargs):

        # Exécuter la mutation parent (crée le token et le payload)
        try:
            result = super().mutate(root, info, **kwargs)
        except Exception as e:
            print(f"Erreur lors de l'authentification: {e}")
            raise

        token = result.token
        payload = result.payload

        # Créer un token CSRF Django
        csrf_token = get_token(info.context)

        # Stocker le token dans le contexte REQUEST
        # La vue LoginGraphQLView va le récupérer pour le mettre en cookie
        info.context._jwt_token = token
        info.context._jwt_token_set_cookie = True

        # Créer une instance de la mutation et y injecter les valeurs
        mutation = cls()
        mutation.token = token
        mutation.payload = payload
        mutation.csrf_token = csrf_token

        return mutation