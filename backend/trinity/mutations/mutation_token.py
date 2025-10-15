import graphene
import graphql_jwt
from django.middleware.csrf import get_token

# Mutation personnalisée pour créer un token d'authentification ainsi qu'un token CSRF

class CustomObtainJSONWebToken(graphql_jwt.ObtainJSONWebToken):
    csrf_token = graphene.String()

    @classmethod
    def mutate(cls, root, info, **kwargs):
        print("CustomObtainJSONWebToken.mutate() appelé")
        print(f"Credentials: username={kwargs.get('username', 'N/A')}")
        
        # Exécuter la mutation parent (crée le token et le payload)
        try:
            result = super().mutate(root, info, **kwargs)
        except Exception as e:
            print(f"Erreur lors de l'authentification: {e}")
            raise

        token = result.token
        payload = result.payload
        
        print(f"Token JWT généré: {token[:50]}...")
        print(f"Payload: {payload}")

        # Créer un token CSRF Django
        csrf_token = get_token(info.context)
        print(f"CSRF token: {csrf_token[:20]}...")

        # Stocker le token dans le contexte REQUEST
        # La vue LoginGraphQLView va le récupérer pour le mettre en cookie
        info.context._jwt_token = token
        info.context._jwt_token_set_cookie = True
        
        print(f"Flags définis sur request.context")
        print(f" - _jwt_token: {info.context._jwt_token[:50]}...")
        print(f" - _jwt_token_set_cookie: {info.context._jwt_token_set_cookie}")

        # Créer une instance de la mutation et y injecter les valeurs
        mutation = cls()
        mutation.token = token
        mutation.payload = payload
        mutation.csrf_token = csrf_token

        print("Mutation terminée avec succès")
        return mutation