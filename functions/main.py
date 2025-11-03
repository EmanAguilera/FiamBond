# functions/main.py

import base64
import mimetypes
import uuid

from firebase_functions import https_fn
from firebase_admin import initialize_app
import boto3
from botocore.exceptions import ClientError

initialize_app()

# NOTE: For a deployed function, you should use real credentials
# stored securely as Firebase secrets, not dummy ones.
# For now, we'll keep the LocalStack config for consistency.
LOCALSTACK_ENDPOINT_URL = "http://localhost:4566" 
BUCKET_NAME = "fiambond-local-test-bucket" 
AWS_ACCESS_KEY_ID = "test"
AWS_SECRET_ACCESS_KEY = "test"
AWS_REGION = "us-east-1"

s3_client = None

def get_s3_client():
    global s3_client
    if s3_client is None:
        s3_client = boto3.client(
            "s3",
            endpoint_url=LOCALSTACK_ENDPOINT_URL,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION,
        )
    return s3_client


@https_fn.on_call(cors=True) # <-- A simple way to enable CORS for callable functions
def uploadLoanAttachment(req: https_fn.CallableRequest):
    """
    Receives a Base64 file, uploads it to S3, and returns the URL.
    """
    try:
        file_base64 = req.data.get("file")
        if not file_base64:
            raise https_fn.HttpsError(code="invalid-argument", message="Missing 'file' argument.")

        header, encoded = file_base64.split(",", 1)
        file_data = base64.b64decode(encoded)
        content_type = header.split(':')[1].split(';')[0]
        file_extension = mimetypes.guess_extension(content_type) or ''
        unique_file_name = f"attachments/{uuid.uuid4()}{file_extension}"

        print(f"Uploading '{unique_file_name}' to bucket '{BUCKET_NAME}'...")
        
        # NOTE: When deployed, this will need to be configured for REAL AWS S3
        # and not LocalStack. For now, this code structure is correct.
        client = get_s3_client() 
        client.put_object(
            Bucket=BUCKET_NAME,
            Key=unique_file_name,
            Body=file_data,
            ContentType=content_type
        )
        print("✅ Upload successful.")

        file_url = f"http://placeholder.com/{BUCKET_NAME}/{unique_file_name}" # Placeholder URL
        
        return {"url": file_url}

    except Exception as e:
        print(f"❌ An error occurred: {e}")
        raise https_fn.HttpsError(code="internal", message=f"An internal error occurred.")