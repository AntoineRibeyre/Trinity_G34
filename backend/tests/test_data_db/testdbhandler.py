from  django.core.management import call_command
from pathlib import Path
from typing import Any


class TestDBHandler:
    process: Any = None
    flush: bool = True
    """This class resets and reinitializes the database environment for
    testing purposes."""

    def flush_current_database(self) -> None:
        # Clearing database
        self.process = call_command('flush', '--noinput')

    def create_database(self):
        """Creating a new data base"""
        db_path = Path(__file__).parent / "test_data.json"
        self.process = call_command('loaddata', str(db_path))

    def init(self) -> None:
        """This method initiates the test and warns the user that their
        database will be flushed."""
        response = input("Warning: this test will clear your database."
                         "Do you want to continue? Yes/No (default: No): ")
        match response:
            case "Yes":
                self.flush_current_database()
                self.flush = True
            case "yes":
                self.flush_current_database()
                self.flush = True
            case _:
                self.flush = False
