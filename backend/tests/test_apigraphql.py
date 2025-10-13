import pytest
from  graphene.test import Client
from ..trinity.logic.calendrierfactory import CalendrierQueryOutput
import trinity.schema as my_schema

def test_pointage():
    client = Client(my_schema)
    exec = client.execute('''{ pointageArrivee }''')


