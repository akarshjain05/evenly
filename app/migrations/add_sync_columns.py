import logging
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

async def run_migration(db: AsyncSession):
    # SQLite ALTER TABLE ADD COLUMN does not support IF NOT EXISTS in all versions, 
    # but we can try to query the table info to check if column exists.
    
    tables_and_columns = {
        "groups": ["updated_at", "is_deleted"],
        "members": ["updated_at", "is_deleted"],
        "expenses": ["updated_at", "is_deleted"],
        "expense_splits": ["updated_at"],
        "settlements": ["updated_at", "is_deleted"]
    }
    
    for table, columns in tables_and_columns.items():
        # check if it's sqlite or postgres
        # check columns
        try:
            # PRAGMA works for sqlite, but we might be on postgres
            # so let's check current dialect
            dialect = db.bind.dialect.name
            
            if dialect == 'sqlite':
                result = await db.execute(text(f"PRAGMA table_info({table})"))  # nosec B608
                existing_cols = [row[1] for row in result.all()]
            else:
                result = await db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = :table"), {"table": table})
                existing_cols = [row[0] for row in result.all()]
                
            for col in columns:
                if col not in existing_cols:
                    logger.info(f"Adding column {col} to {table}")
                    if col == "updated_at":
                        datatype = "TIMESTAMP WITH TIME ZONE" if dialect != "sqlite" else "DATETIME"
                        await db.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {datatype}"))  # nosec B608
                    elif col == "is_deleted":
                        await db.execute(text(f"ALTER TABLE {table} ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE NOT NULL"))  # nosec B608
        except Exception as e:
            logger.error(f"Error migrating {table}: {e}")
