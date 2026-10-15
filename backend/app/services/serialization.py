"""Row values for the sports prototype."""


def row_values(row) -> dict:
    return {column.name: getattr(row, column.name) for column in row.__table__.columns}
