"""
Migration script to add user_id to existing resources
This script assigns all existing resources to the admin user
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client["iPadDatabase"]

async def migrate():
    print("Starting RBAC migration...")
    
    # 1. Find or create admin user with role
    admin_user = await db.users.find_one({"username": "admin"})
    if not admin_user:
        print("ERROR: Admin user not found. Please run /api/auth/setup first.")
        return
    
    admin_id = admin_user["id"]
    print(f"✓ Found admin user with ID: {admin_id}")
    
    # 2. Update admin user with role if missing
    if not admin_user.get("role"):
        await db.users.update_one(
            {"id": admin_id},
            {"$set": {"role": "admin", "is_active": True}}
        )
        print("✓ Updated admin user with admin role")
    
    # 3. Add user_id to all iPads
    ipads_without_user = await db.ipads.count_documents({"user_id": {"$exists": False}})
    if ipads_without_user > 0:
        result = await db.ipads.update_many(
            {"user_id": {"$exists": False}},
            {"$set": {"user_id": admin_id}}
        )
        print(f"✓ Updated {result.modified_count} iPads with user_id")
    else:
        print("✓ All iPads already have user_id")
    
    # 4. Add user_id to all students
    students_without_user = await db.students.count_documents({"user_id": {"$exists": False}})
    if students_without_user > 0:
        result = await db.students.update_many(
            {"user_id": {"$exists": False}},
            {"$set": {"user_id": admin_id}}
        )
        print(f"✓ Updated {result.modified_count} students with user_id")
    else:
        print("✓ All students already have user_id")
    
    # 5. Add user_id to all assignments
    assignments_without_user = await db.assignments.count_documents({"user_id": {"$exists": False}})
    if assignments_without_user > 0:
        result = await db.assignments.update_many(
            {"user_id": {"$exists": False}},
            {"$set": {"user_id": admin_id}}
        )
        print(f"✓ Updated {result.modified_count} assignments with user_id")
    else:
        print("✓ All assignments already have user_id")
    
    # 6. Add user_id to all contracts
    contracts_without_user = await db.contracts.count_documents({"user_id": {"$exists": False}})
    if contracts_without_user > 0:
        result = await db.contracts.update_many(
            {"user_id": {"$exists": False}},
            {"$set": {"user_id": admin_id}}
        )
        print(f"✓ Updated {result.modified_count} contracts with user_id")
    else:
        print("✓ All contracts already have user_id")
    
    # 7. Create indices for efficient querying
    await db.ipads.create_index([("user_id", 1)])
    await db.students.create_index([("user_id", 1)])
    await db.assignments.create_index([("user_id", 1)])
    await db.contracts.create_index([("user_id", 1)])
    await db.users.create_index([("username", 1)], unique=True)
    print("✓ Created database indices")
    
    # 8. Print summary
    print("\n=== Migration Summary ===")
    total_ipads = await db.ipads.count_documents({})
    total_students = await db.students.count_documents({})
    total_assignments = await db.assignments.count_documents({})
    total_contracts = await db.contracts.count_documents({})
    total_users = await db.users.count_documents({})
    
    print(f"Total Users: {total_users}")
    print(f"Total iPads: {total_ipads}")
    print(f"Total Students: {total_students}")
    print(f"Total Assignments: {total_assignments}")
    print(f"Total Contracts: {total_contracts}")
    print(f"All resources assigned to admin user (ID: {admin_id})")
    print("\n✅ Migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(migrate())
