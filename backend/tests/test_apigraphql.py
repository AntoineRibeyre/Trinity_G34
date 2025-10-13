import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

import django
django.setup()

import pytest
from graphene.test import Client
from backend.schema import schema   # import absolu
from django.core.management import call_command
import json

     

@pytest.mark.django_db 
def test_pointage_arrivee(snapshot):
    client = Client(schema)
    query = """
    query {
      registerArrival(userId: 1) {
        datetimeField
        durationField
      }
    }
    """
    executed = client.execute(query)
    executed_str = json.dumps(executed, indent=2, sort_keys=True)
    # On compare le résultat au snapshot enregistré
    snapshot.assert_match(executed_str, "arriving_test")
