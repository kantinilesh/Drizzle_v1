import re

def fix_models():
    file_path = "app/models/models.py"
    with open(file_path, "r") as f:
        content = f.read()

    # Rule 1: Standard ID
    content = re.sub(
        r'Column\(String, primary_key=True, default=gen_uuid\)',
        r'UUIDCol(primary_key=True)',
        content
    )

    # Rule 2: ID that is also an FK
    content = re.sub(
        r'Column\(String, ForeignKey\("([^"]+)", ondelete="([^"]+)"\), primary_key=True\)',
        r'UUIDCol(primary_key=True, fk="\1", ondelete="\2")',
        content
    )

    # Rule 3: FK with ondelete
    content = re.sub(
        r'Column\(String, ForeignKey\("([^"]+)", ondelete="([^"]+)"\), nullable=([A-Za-z]+)\)',
        r'UUIDCol(fk="\1", ondelete="\2", nullable=\3)',
        content
    )

    # Rule 4: FK without ondelete
    content = re.sub(
        r'Column\(String, ForeignKey\("([^"]+)"\), nullable=([A-Za-z]+)\)',
        r'UUIDCol(fk="\1", nullable=\2)',
        content
    )

    # Rule 5: entity_id which is a generic String holding UUIDs
    content = re.sub(
        r'entity_id = Column\(String, nullable=True\)',
        r'entity_id = UUIDCol(nullable=True)',
        content
    )

    with open(file_path, "w") as f:
        f.write(content)

if __name__ == "__main__":
    fix_models()
    print("Models updated.")
